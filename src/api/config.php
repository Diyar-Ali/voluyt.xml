<?php
// Database Configuration
define('DB_HOST', 'localhost'); // Or your database host (e.g., 127.0.0.1)
define('DB_USERNAME', 'root');    // Your MySQL username
define('DB_PASSWORD', '');        // Your MySQL password
define('DB_NAME', 'google_keep_clone_db'); // Your database name

// Timezone
date_default_timezone_set('UTC'); // Or your preferred timezone

// Error Reporting (Development: E_ALL, Production: 0 or E_ERROR)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Base URL (Optional: useful for generating absolute URLs if needed)
// define('BASE_URL', 'http://localhost/google-keep-clone/dist/');

// Establish database connection (Example using MySQLi)
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);

    // Check connection
    if ($conn->connect_error) {
        // Log error to a file or error tracking system instead of die() in production
        error_log("Connection failed: " . $conn->connect_error);
        // For development, die() is okay to immediately see the issue.
        // In production, you might want to return a generic error response.
        http_response_code(500);
        echo json_encode(['error' => 'Database connection error. Please try again later.']);
        exit; // Stop script execution
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Global Headers (CORS, Content-Type for JSON API)
// Call this at the beginning of your API endpoint files
function setApiHeaders() {
    header("Access-Control-Allow-Origin: *"); // Or specify your frontend domain for better security
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

    // Handle OPTIONS preflight request
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit(0);
    }
}

?>
