# Google Keep Clone

This project is a web application designed to replicate the functionality and appearance of Google Keep. It allows users to create, manage, and organize notes, with features such as pinning, labeling, color-coding, and archiving.

## Technology Stack

*   **Frontend:**
    *   HTML5 (Semantic Structure)
    *   Tailwind CSS v3 (Styling via CDN)
    *   JavaScript (ES6+) (Client-side logic, DOM manipulation)
    *   Alpine.js (Lightweight JS framework for UI interactivity)
    *   Handlebars.js (Templating)
*   **Backend:**
    *   PHP (RESTful API for CRUD operations)
    *   MySQL (Database)
*   **Build Tools:**
    *   Node.js (To run build script)
    *   fs-extra (Node.js module for file system operations in build script)
*   **Assets:**
    *   SVG (Icons)
    *   Custom Favicon

## Features

*   Note Creation Widget (Initial and Expanded States)
*   Note Management (Create, Read, Update, Delete - CRUD)
*   Note Display & Interaction (Masonry Grid/List View Toggle, Pinning, Checklists, Image Display, Link Recognition)
*   Advanced Organization (Labels: Management, Assignment, Filtering)
*   Navigation & Search (Collapsible Sidebar, Real-time Search)
*   Responsive Design

*(Stretch Goals: Collaboration UI, Drag-and-drop reordering)*

## Project Structure

```
/
|-- .gitignore
|-- build.js
|-- package.json
|-- CHANGELOG.md
|-- README.md
|-- VERSION
|-- dist/                  # Final compiled output for the web server
|   |-- api/               # Copied PHP backend scripts
|   |-- assets/
|   |   |-- icons/         # SVG icons
|   |   `-- favicon.ico
|   |-- js/
|   `-- index.php
|-- src/                   # Source files
|   |-- api/               # Backend PHP scripts
|   |   |-- config.php     # Database connection and config
|   |   `-- notes.php      # API endpoint for all note actions
|   |-- assets/
|   |   |-- icons/
|   |   `-- favicon.ico
|   |-- js/
|   |   `-- app.js
|   |-- templates/
|   |   |-- layouts/
|   |   |   `-- main.hbs
|   |   |-- partials/
|   |   |   |-- header.hbs
|   |   |   |-- sidebar.hbs
|   |   |   |-- note-card.hbs
|   |   |   |-- note-creator.hbs
|   |   |   `-- edit-modal.hbs
|   |   `-- index.hbs
```

## Setup Instructions

### Prerequisites

*   Node.js and npm
*   A local web server environment with PHP and MySQL (e.g., XAMPP, MAMP, WAMP, or Docker setup).
*   phpMyAdmin (or any other MySQL management tool).

### Backend Setup

1.  **Database Creation:**
    *   Using phpMyAdmin, create a new database (e.g., `google_keep_clone_db`).
    *   Import the SQL schema provided below into the created database.
2.  **Configuration:**
    *   Copy the contents of `src/api/` to your web server's document root (e.g., `htdocs/google-keep-clone/api/` or similar, this will be handled by the build script for the `dist` folder).
    *   Edit `src/api/config.php` (which will be copied to `dist/api/config.php`) with your database credentials (host, username, password, database name).

### Frontend Setup & Build

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd google-keep-clone
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Run the Build Script:**
    ```bash
    npm run build
    ```
    This will compile the Handlebars templates, copy PHP files, and move all necessary assets to the `dist/` directory.
4.  **Serve the Application:**
    *   Point your local web server to the `dist/` directory.
    *   Open `http://localhost/your-path-to-dist/index.php` (or the equivalent URL for your server setup) in your browser.

## SQL Schema

```sql
-- Users Table
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(255) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes Table
CREATE TABLE `notes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `color` VARCHAR(7) DEFAULT '#FFFFFF',
  `is_pinned` TINYINT(1) DEFAULT 0,
  `is_archived` TINYINT(1) DEFAULT 0,
  `is_trashed` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Labels Table
CREATE TABLE `labels` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  UNIQUE KEY `user_label_name` (`user_id`, `name`), -- Ensure label names are unique per user
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note_Labels Pivot Table
CREATE TABLE `note_labels` (
  `note_id` INT NOT NULL,
  `label_id` INT NOT NULL,
  PRIMARY KEY (`note_id`, `label_id`),
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note_Collaborators Pivot Table (for stretch goal)
CREATE TABLE `note_collaborators` (
  `note_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`note_id`, `user_id`),
  FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example: Add a default user for development (optional)
-- INSERT INTO `users` (`username`, `email`, `password_hash`) VALUES ('testuser', 'test@example.com', 'some_secure_hash');
-- (For password_hash, use PHP's password_hash() function, e.g., password_hash("password123", PASSWORD_DEFAULT))

```

---

*This README is a work in progress and will be updated as the project develops.*
