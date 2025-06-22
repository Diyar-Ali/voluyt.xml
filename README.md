# Consulting CRM Application

## 1. Project Overview

This Consulting CRM (Customer Relationship Management) application is designed to help consultants and small consulting firms manage their client interactions, sales pipeline, projects, and tasks efficiently. It provides a centralized platform to track contacts, companies, leads, ongoing projects, and associated tasks, along with a notification system and basic insights to stay on top of client relationships and business development.

The full feature roadmap and detailed task specifications can be found in the `TODO_DETAILED.xml` file in the repository root.

## 2. Features Implemented

The current version of the application includes the following core features:

*   **Dashboard**: Provides a quick overview of key metrics like total contacts, companies, active leads, projects, and pending tasks. Includes quick action buttons for common operations and displays recent insights.
*   **Contact Management**: Create, Read, Update, and Delete (CRUD) operations for contacts. Store details like name, email, phone, company, industry, position, and notes.
*   **Company Management**: CRUD operations for companies. Store details like name, industry, website, contact information, employee count, and annual revenue.
*   **Lead Management**: CRUD operations for leads. Track potential sales opportunities with details like associated contact, title, description, status (prospect, qualified, proposal, negotiation, won, lost), value, probability, source, and expected close date.
*   **Project Management**: CRUD operations for projects. Manage client projects with details like associated contact, related lead, name, description, status (planning, in-progress, on_hold, completed, cancelled), start/end dates, budget, assigned personnel, and team members.
*   **Task Management**: CRUD operations for tasks. Track to-dos with details like title, description, assigned user, associated contact/lead/project, due date, priority, and status.
*   **Interaction Logging**: Log interactions (call, email, meeting, note, task) associated with contacts. View interaction history for a contact.
*   **Notification System**:
    *   In-app notifications for events like new task assignments.
    *   View list of notifications, unread count, and mark notifications as read.
    *   Notifications for tasks are actionable, allowing quick navigation to the task.
*   **Basic Insights**: Provides actionable insights such as stale contacts (not contacted recently), overdue follow-ups, and stale leads.
*   **CSV Data Import/Export**:
    *   Import contacts from a CSV file.
    *   Export contacts to a CSV file.
*   **Responsive UI**: The frontend is designed with Tailwind CSS for a responsive experience on different screen sizes.

## 3. Technology Stack

*   **Backend**:
    *   **Framework**: FastAPI (Python)
    *   **Database**: MongoDB (NoSQL)
    *   **ODM (Object-Document Mapper)**: Pydantic (for data validation and settings management)
    *   **Server**: Uvicorn (ASGI server)
*   **Frontend**:
    *   **Library**: React.js
    *   **HTTP Client**: Axios
    *   **Styling**: Tailwind CSS
    *   **State Management**: React Hooks (`useState`, `useEffect`)
*   **Environment Management**:
    *   Python: `venv`
    *   Node.js: `npm` or `yarn`

## 4. Prerequisites

Before you begin, ensure you have the following installed:

*   **Python**: Version 3.8 or higher.
*   **Node.js**: Version 14.x or higher (which includes npm). Yarn can also be used as an alternative to npm.
*   **MongoDB**: A running instance of MongoDB (local or cloud-hosted like MongoDB Atlas).
*   **Git**: For cloning the repository.

## 5. Setup and Installation

### 5.1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 5.2. Backend Setup

1.  **Navigate to Backend Directory**:
    ```bash
    cd backend
    ```

2.  **Create and Activate Virtual Environment**:
    ```bash
    python -m venv venv
    # On Windows
    # venv\Scripts\activate
    # On macOS/Linux
    # source venv/bin/activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the `backend` directory (`backend/.env`) by copying `backend/.env.example` if it exists, or create it manually with the following content:
    ```env
    MONGO_URL="mongodb://localhost:27017/" # Replace with your MongoDB connection string
    DB_NAME="consulting_crm"
    ```
    Ensure your MongoDB instance is running and accessible.

### 5.3. Frontend Setup

1.  **Navigate to Frontend Directory**:
    ```bash
    cd frontend
    # (If you are in the backend directory, use 'cd ../frontend')
    ```

2.  **Install Dependencies**:
    Using npm:
    ```bash
    npm install
    ```
    Or using Yarn:
    ```bash
    yarn install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the `frontend` directory (`frontend/.env`) with the following content:
    ```env
    REACT_APP_BACKEND_URL=http://localhost:8000
    # This should point to where your backend API is running.
    # The /api path is appended in the App.js code.
    ```

## 6. Running the Application

### 6.1. Start the Backend Server

1.  Ensure you are in the `backend` directory and your virtual environment is activated.
2.  Run the FastAPI application using Uvicorn:
    ```bash
    uvicorn server:app --reload --port 8000
    ```
    *   `--reload`: Enables auto-reload on code changes (for development).
    *   `--port 8000`: Specifies the port (default is 8000).
    The backend API will be available at `http://localhost:8000`.

### 6.2. Start the Frontend Development Server

1.  Ensure you are in the `frontend` directory.
2.  Run the React application:
    Using npm:
    ```bash
    npm start
    ```
    Or using Yarn:
    ```bash
    yarn start
    ```
    This will typically open the application in your default web browser at `http://localhost:3000`.

## 7. API Documentation

The backend is built with FastAPI, which automatically generates interactive API documentation. Once the backend server is running, you can access:

*   **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

These interfaces allow you to explore and test the API endpoints directly from your browser.

## 8. Testing

### 8.1. Backend Tests

The backend includes a test suite using `pytest`.

1.  Ensure you are in the `backend` directory with the virtual environment activated.
2.  Install test dependencies if not already included in `requirements.txt` (e.g., `pip install pytest httpx`).
3.  Run the tests:
    ```bash
    pytest ../backend_test.py
    # (Assuming backend_test.py is in the root or adjust path)
    # Or if backend_test.py is in backend/tests/
    # pytest tests/backend_test.py
    ```
    (The current project structure has `backend_test.py` in the root. For consistency, it might be better placed in `backend/tests/test_main.py` or similar, and `tests/__init__.py` suggests a `tests` package.)
    *Self-correction: `backend_test.py` is in the root. The command should be run from the root.*

    To run backend tests (from the project root directory):
    ```bash
    # Ensure backend venv is active if it has specific dependencies not global
    # (cd backend && source venv/bin/activate && cd ..)
    pytest backend_test.py
    ```

### 8.2. Frontend Tests

Currently, the frontend does not have an extensive test suite. Standard React testing tools like Jest and React Testing Library can be added to implement unit and integration tests for components.
To run default React tests (if any boilerplate exists):
```bash
# In frontend directory
npm test
# or
yarn test
```

## 9. Project Structure (Simplified)

```
.
├── backend/
│   ├── .env                  # Backend environment variables (Git ignored)
│   ├── requirements.txt      # Python dependencies
│   ├── server.py             # FastAPI application, models, and API endpoints
│   └── venv/                 # Python virtual environment (Git ignored)
│
├── frontend/
│   ├── .env                  # Frontend environment variables (Git ignored)
│   ├── node_modules/         # Node.js dependencies (Git ignored)
│   ├── package.json          # Frontend dependencies and scripts
│   ├── yarn.lock / package-lock.json # Lock file
│   ├── public/               # Static assets and index.html
│   └── src/                  # React application source code
│       ├── App.js            # Main application component
│       ├── App.css           # Main styles
│       ├── index.js          # Entry point for React app
│       └── ...               # Other components and assets
│
├── .gitignore                # Specifies intentionally untracked files that Git should ignore
├── backend_test.py           # Backend tests
├── README.md                 # This file
├── TODO_DETAILED.xml         # Detailed feature roadmap and task list
└── ...                       # Other configuration files (e.g., .gitconfig for the sandbox)
```

## 10. Contribution

Currently, this project is primarily for demonstration and individual use. If you wish to contribute:
1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes.
4.  Ensure any relevant tests pass (and add new ones if applicable).
5.  Submit a pull request with a clear description of your changes.

---

This README provides a comprehensive guide to understanding, setting up, and running the Consulting CRM application.
For further details on planned features, refer to `TODO_DETAILED.xml`.
```
