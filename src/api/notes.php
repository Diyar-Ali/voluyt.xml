<?php
require_once 'config.php';

setApiHeaders(); // Set global API headers (CORS, Content-Type)

$conn = getDbConnection(); // Establish database connection

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Helper function to send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Basic User ID (placeholder - replace with actual session/token based user ID later)
// For now, we'll assume a default user_id for development.
// In a real application, this would come from an authentication system.
$userId = $input['user_id'] ?? ($_GET['user_id'] ?? 1); // TODO: Replace with actual authenticated user ID

switch ($method) {
    case 'GET':
        // Fetch notes (Read operation)
        // Parameters: user_id (via $userId), label_id (optional), is_archived (optional), is_trashed (optional), search (optional), id (optional for single note)

        $labelId = isset($_GET['label_id']) ? intval($_GET['label_id']) : null;
        $isArchived = isset($_GET['is_archived']) ? filter_var($_GET['is_archived'], FILTER_VALIDATE_BOOLEAN) : null;
        $isTrashed = isset($_GET['is_trashed']) ? filter_var($_GET['is_trashed'], FILTER_VALIDATE_BOOLEAN) : null;
        $searchQuery = isset($_GET['search']) ? trim($_GET['search']) : null;
        $noteId = isset($_GET['id']) ? intval($_GET['id']) : null;

        $sql = "SELECT n.*, GROUP_CONCAT(DISTINCT l.id) AS label_ids, GROUP_CONCAT(DISTINCT l.name SEPARATOR '|||') AS label_names
                FROM notes n
                LEFT JOIN note_labels nl ON n.id = nl.note_id
                LEFT JOIN labels l ON nl.label_id = l.id
                WHERE n.user_id = ?";

        $params = [$userId];
        $types = "i";

        if ($noteId) {
            $sql .= " AND n.id = ?";
            $params[] = $noteId;
            $types .= "i";
        } else {
            if ($labelId) {
                $sql .= " AND EXISTS (SELECT 1 FROM note_labels nl_filter WHERE nl_filter.note_id = n.id AND nl_filter.label_id = ?)";
                $params[] = $labelId;
                $types .= "i";
            }

            if ($isArchived !== null) {
                 $sql .= " AND n.is_archived = ?";
                 $params[] = $isArchived ? 1 : 0;
                 $types .= "i";
            } else {
                 $sql .= " AND n.is_archived = 0"; // Default to not showing archived if param not set
            }

            if ($isTrashed !== null) {
                $sql .= " AND n.is_trashed = ?";
                $params[] = $isTrashed ? 1 : 0;
                $types .= "i";
            } else {
                $sql .= " AND n.is_trashed = 0"; // Default to not showing trashed if param not set
            }

            if ($searchQuery) {
                $sql .= " AND (n.title LIKE ? OR n.content LIKE ?)";
                $searchTerm = "%" . $searchQuery . "%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= "ss";
            }
        }

        $sql .= " GROUP BY n.id ORDER BY n.is_pinned DESC, n.updated_at DESC";

        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            sendResponse(['error' => 'SQL prepare failed: ' . $conn->error, 'sql' => $sql], 500);
        }

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        if(!$stmt->execute()){
            sendResponse(['error' => 'SQL execute failed: ' . $stmt->error], 500);
        }
        $result = $stmt->get_result();
        $notes = [];
        while ($row = $result->fetch_assoc()) {
            $row['is_pinned'] = (bool)$row['is_pinned'];
            $row['is_archived'] = (bool)$row['is_archived'];
            $row['is_trashed'] = (bool)$row['is_trashed'];
            $row['labels'] = [];
            if ($row['label_ids'] && $row['label_names']) {
                $ids = explode(',', $row['label_ids']);
                $names = explode('|||', $row['label_names']); // Use the same delimiter as in GROUP_CONCAT
                for ($i=0; $i < count($ids); $i++) {
                    if(isset($names[$i])) { // Ensure names array has corresponding element
                        $row['labels'][] = ['id' => intval($ids[$i]), 'name' => $names[$i]];
                    }
                }
            }
            unset($row['label_ids']);
            unset($row['label_names']);
            $notes[] = $row;
        }
        $stmt->close();
        sendResponse($notes);
        break;

    case 'POST':
        // Create a new note
        if (!isset($input['title']) && !isset($input['content'])) {
            sendResponse(['error' => 'Title or content is required'], 400);
        }
        $title = $input['title'] ?? '';
        $content = $input['content'] ?? '';
        $color = $input['color'] ?? '#FFFFFF';
        $isPinned = isset($input['is_pinned']) ? ($input['is_pinned'] ? 1 : 0) : 0;
        $isArchived = isset($input['is_archived']) ? ($input['is_archived'] ? 1 : 0) : 0;

        $stmt = $conn->prepare("INSERT INTO notes (user_id, title, content, color, is_pinned, is_archived) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt === false) {
            sendResponse(['error' => 'SQL prepare failed for insert: ' . $conn->error], 500);
        }
        $stmt->bind_param("isssii", $userId, $title, $content, $color, $isPinned, $isArchived);

        if ($stmt->execute()) {
            $newNoteId = $stmt->insert_id;
            // Handle labels if provided
            if (isset($input['labels']) && is_array($input['labels']) && !empty($input['labels'])) {
                $labelStmt = $conn->prepare("INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)");
                if ($labelStmt === false) {
                    // Log error, but proceed with note creation response
                    error_log('SQL prepare failed for insert labels: ' . $conn->error);
                } else {
                    foreach ($input['labels'] as $labelId) {
                        if (is_numeric($labelId)) {
                           $labelStmt->bind_param("ii", $newNoteId, intval($labelId));
                           if(!$labelStmt->execute()){
                               error_log('SQL execute failed for insert label: ' . $labelStmt->error);
                           }
                        }
                    }
                    $labelStmt->close();
                }
            }
            // Fetch the newly created note to return it
            $fetchStmt = $conn->prepare("SELECT n.*, GROUP_CONCAT(DISTINCT l.id) AS label_ids, GROUP_CONCAT(DISTINCT l.name SEPARATOR '|||') AS label_names
                                        FROM notes n
                                        LEFT JOIN note_labels nl ON n.id = nl.note_id
                                        LEFT JOIN labels l ON nl.label_id = l.id
                                        WHERE n.id = ? AND n.user_id = ?
                                        GROUP BY n.id");
            if($fetchStmt) {
                $fetchStmt->bind_param("ii", $newNoteId, $userId);
                $fetchStmt->execute();
                $newNoteResult = $fetchStmt->get_result()->fetch_assoc();
                if($newNoteResult){
                    $newNoteResult['is_pinned'] = (bool)$newNoteResult['is_pinned'];
                    $newNoteResult['is_archived'] = (bool)$newNoteResult['is_archived'];
                    $newNoteResult['is_trashed'] = (bool)$newNoteResult['is_trashed'];
                    $newNoteResult['labels'] = [];
                     if ($newNoteResult['label_ids'] && $newNoteResult['label_names']) {
                        $ids = explode(',', $newNoteResult['label_ids']);
                        $names = explode('|||', $newNoteResult['label_names']);
                        for ($i=0; $i < count($ids); $i++) {
                             if(isset($names[$i])) {
                                $newNoteResult['labels'][] = ['id' => intval($ids[$i]), 'name' => $names[$i]];
                             }
                        }
                    }
                    unset($newNoteResult['label_ids']);
                    unset($newNoteResult['label_names']);
                    sendResponse($newNoteResult, 201);
                } else {
                     sendResponse(['id' => $newNoteId, 'message' => 'Note created, but failed to fetch complete data.'], 201);
                }
                $fetchStmt->close();
            } else {
                 sendResponse(['id' => $newNoteId, 'message' => 'Note created, but failed to prepare fetch statement.'], 201);
            }

        } else {
            sendResponse(['error' => 'Failed to create note: ' . $stmt->error], 500);
        }
        $stmt->close();
        break;

    case 'PUT':
        $noteId = isset($_GET['id']) ? intval($_GET['id']) : (isset($input['id']) ? intval($input['id']) : null);
        if (!$noteId) {
            sendResponse(['error' => 'Note ID is required for update'], 400);
        }

        // Check if the note belongs to the user (important for security)
        $checkStmt = $conn->prepare("SELECT user_id FROM notes WHERE id = ?");
        $checkStmt->bind_param("i", $noteId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $noteOwner = $result->fetch_assoc();
        $checkStmt->close();

        if (!$noteOwner) {
            sendResponse(['error' => 'Note not found'], 404);
        }
        // TODO: Implement real user check: if ($noteOwner['user_id'] != $REAL_AUTHENTICATED_USER_ID) { sendResponse(['error' => 'Unauthorized'], 403); }


        $fields = [];
        $params = [];
        $types = "";

        if (array_key_exists('title', $input)) { $fields[] = "title = ?"; $params[] = $input['title']; $types .= "s"; }
        if (array_key_exists('content', $input)) { $fields[] = "content = ?"; $params[] = $input['content']; $types .= "s"; }
        if (array_key_exists('color', $input)) { $fields[] = "color = ?"; $params[] = $input['color']; $types .= "s"; }
        if (array_key_exists('is_pinned', $input)) { $fields[] = "is_pinned = ?"; $params[] = $input['is_pinned'] ? 1 : 0; $types .= "i"; }
        if (array_key_exists('is_archived', $input)) { $fields[] = "is_archived = ?"; $params[] = $input['is_archived'] ? 1 : 0; $types .= "i"; }
        if (array_key_exists('is_trashed', $input)) {
            $fields[] = "is_trashed = ?"; $params[] = $input['is_trashed'] ? 1 : 0; $types .= "i";
            // If trashing, unpin it
            if ($input['is_trashed']) {
                $fields[] = "is_pinned = 0";
            }
        }

        if (empty($fields) && !array_key_exists('labels', $input)) {
            sendResponse(['error' => 'No fields to update'], 400);
        }

        $updatedNoteData = false;
        if (!empty($fields)) {
            $sql = "UPDATE notes SET " . implode(", ", $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?";
            $params[] = $noteId;
            $params[] = $userId;
            $types .= "ii";

            $stmt = $conn->prepare($sql);
            if ($stmt === false) {
                sendResponse(['error' => 'SQL prepare failed for update: ' . $conn->error], 500);
            }
            $stmt->bind_param($types, ...$params);
            if ($stmt->execute()) {
                $updatedNoteData = $stmt->affected_rows > 0;
            } else {
                sendResponse(['error' => 'Failed to update note fields: ' . $stmt->error], 500);
            }
            $stmt->close();
        }

        if (array_key_exists('labels', $input)) {
            if (!is_array($input['labels'])) {
                sendResponse(['error' => 'Labels must be an array'], 400);
            }
            $deleteLabelStmt = $conn->prepare("DELETE FROM note_labels WHERE note_id = ?");
            $deleteLabelStmt->bind_param("i", $noteId);
            $deleteLabelStmt->execute();
            $deletedLabelRows = $deleteLabelStmt->affected_rows;
            $deleteLabelStmt->close();

            $insertedLabelRows = 0;
            if (!empty($input['labels'])) {
                $insertLabelStmt = $conn->prepare("INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)");
                 foreach ($input['labels'] as $labelId) {
                     if (is_numeric($labelId)) {
                        $insertLabelStmt->bind_param("ii", $noteId, intval($labelId));
                        if($insertLabelStmt->execute()){
                            $insertedLabelRows += $insertLabelStmt->affected_rows;
                        }
                     }
                }
                $insertLabelStmt->close();
            }
            if ($deletedLabelRows > 0 || $insertedLabelRows > 0) {
                $updatedNoteData = true; // Mark as updated if labels were changed
            }
        }

        if ($updatedNoteData) {
             // Fetch the updated note to return it
            $fetchStmt = $conn->prepare("SELECT n.*, GROUP_CONCAT(DISTINCT l.id) AS label_ids, GROUP_CONCAT(DISTINCT l.name SEPARATOR '|||') AS label_names
                                        FROM notes n
                                        LEFT JOIN note_labels nl ON n.id = nl.note_id
                                        LEFT JOIN labels l ON nl.label_id = l.id
                                        WHERE n.id = ? AND n.user_id = ?
                                        GROUP BY n.id");
            if($fetchStmt) {
                $fetchStmt->bind_param("ii", $noteId, $userId);
                $fetchStmt->execute();
                $updatedNoteResult = $fetchStmt->get_result()->fetch_assoc();
                 if($updatedNoteResult){
                    $updatedNoteResult['is_pinned'] = (bool)$updatedNoteResult['is_pinned'];
                    $updatedNoteResult['is_archived'] = (bool)$updatedNoteResult['is_archived'];
                    $updatedNoteResult['is_trashed'] = (bool)$updatedNoteResult['is_trashed'];
                    $updatedNoteResult['labels'] = [];
                     if ($updatedNoteResult['label_ids'] && $updatedNoteResult['label_names']) {
                        $ids = explode(',', $updatedNoteResult['label_ids']);
                        $names = explode('|||', $updatedNoteResult['label_names']);
                        for ($i=0; $i < count($ids); $i++) {
                            if(isset($names[$i])) {
                                $updatedNoteResult['labels'][] = ['id' => intval($ids[$i]), 'name' => $names[$i]];
                            }
                        }
                    }
                    unset($updatedNoteResult['label_ids']);
                    unset($updatedNoteResult['label_names']);
                    sendResponse($updatedNoteResult, 200);
                } else {
                     sendResponse(['id' => $noteId, 'message' => 'Note updated, but failed to fetch complete data.'], 200);
                }
                $fetchStmt->close();
            } else {
                 sendResponse(['id' => $noteId, 'message' => 'Note updated, but failed to prepare fetch statement.'], 200);
            }
        } else {
            sendResponse(['id' => $noteId, 'message' => 'No changes detected or note not found/unauthorized'], 200);
        }
        break;

    case 'DELETE':
        $noteId = isset($_GET['id']) ? intval($_GET['id']) : (isset($input['id']) ? intval($input['id']) : null);
        if (!$noteId) {
            sendResponse(['error' => 'Note ID is required for delete'], 400);
        }

        $permanently = isset($_GET['permanently']) ? filter_var($_GET['permanently'], FILTER_VALIDATE_BOOLEAN) : false;

        $checkStmt = $conn->prepare("SELECT user_id, is_trashed FROM notes WHERE id = ?");
        $checkStmt->bind_param("i", $noteId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $noteMeta = $result->fetch_assoc();
        $checkStmt->close();

        if (!$noteMeta) {
            sendResponse(['error' => 'Note not found'], 404);
        }
        // TODO: Implement real user check: if ($noteMeta['user_id'] != $REAL_AUTHENTICATED_USER_ID) { sendResponse(['error' => 'Unauthorized'], 403); }


        if ($permanently) {
            if (!$noteMeta['is_trashed']) {
                 sendResponse(['error' => 'Note must be in trash to be permanently deleted'], 400);
            }
            $conn->begin_transaction();
            try {
                $stmtLabels = $conn->prepare("DELETE FROM note_labels WHERE note_id = ?");
                $stmtLabels->bind_param("i", $noteId);
                $stmtLabels->execute();
                $stmtLabels->close();

                // TODO: Delete from note_collaborators if feature is implemented

                $stmt = $conn->prepare("DELETE FROM notes WHERE id = ? AND user_id = ?");
                $stmt->bind_param("ii", $noteId, $userId); // $userId is placeholder
                $stmt->execute();
                $affectedRows = $stmt->affected_rows;
                $stmt->close();

                $conn->commit();

                if ($affectedRows > 0) {
                    sendResponse(['id' => $noteId, 'message' => 'Note permanently deleted']);
                } else {
                    sendResponse(['error' => 'Failed to permanently delete note or note not found/unauthorized'], 500);
                }
            } catch (mysqli_sql_exception $exception) {
                $conn->rollback();
                sendResponse(['error' => 'Transaction failed: ' . $exception->getMessage()], 500);
            }

        } else {
            // Move to trash: set is_trashed = 1, is_pinned = 0
            $stmt = $conn->prepare("UPDATE notes SET is_trashed = 1, is_pinned = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $noteId, $userId); // $userId is placeholder
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    sendResponse(['id' => $noteId, 'message' => 'Note moved to trash']);
                } else {
                     sendResponse(['error' => 'Failed to move note to trash or note not found/unauthorized'], 500);
                }
            } else {
                sendResponse(['error' => 'Failed to move note to trash: ' . $stmt->error], 500);
            }
            $stmt->close();
        }
        break;

    default:
        sendResponse(['error' => 'Invalid request method'], 405);
        break;
}

$conn->close();
?>
