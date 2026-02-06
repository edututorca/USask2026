# EduShare

EduShare is a web-based educational platform that uses a MySQL database, a Node.js backend API, and a frontend served through a local web server.

This document explains how to set up and run the project locally.

---

## Prerequisites

Before starting, make sure you have the following installed:

* Node.js (v18 or later recommended)
* npm (comes with Node.js)
* MySQL Server
* MySQL Workbench
* Visual Studio Code (recommended)

---

## 1. Database Setup (MySQL)

Before running the application, the database must be created and populated.

1. Open **MySQL Workbench**.
2. Open the file **`database-schema-updated.sql`**, located in the root folder of the project.
3. Click the **Execute** button (lightning bolt icon).
4. This will:

   * Create the required tables
   * Insert the initial data

---

## 2. Backend Setup (API)

The backend API is responsible for communicating with the MySQL database and serving data to the frontend.

1. Open **Visual Studio Code**.
2. Open a terminal (`Ctrl + '`).
3. Navigate to the API folder:

   ```bash
   cd edushare-api
   ```
4. If this is your first time running the project, install dependencies:

   ```bash
   npm install
   ```
5. Start the API server:

   ```bash
   npm start
   ```

If the setup is successful, you should see a message similar to:

```
Server running on port 3000
```

---

## 3. Frontend Setup (Website)

Because the project uses modern JavaScript modules and file paths, the frontend must be served through a web server.

1. Open a **second terminal** in VS Code.
2. Navigate to the frontend folder:

   ```bash
   cd edushare-cosa-main
   ```
3. Start a local web server:

   ```bash
   npx -y http-server -p 8080
   ```
4. The frontend will be available at:

   ```
   http://127.0.0.1:8080
   ```

---

## 4. Running the Application

1. Make sure **both terminals are running**:

   * Backend API (`npm start`)
   * Frontend server (`http-server`)
2. Open your browser.
3. Go to:

   ```
   http://127.0.0.1:8080/home.html
   ```
4. Navigate to **`User-Area.html`** from the site.

---

## Quick Command Reference

```md
| Component   | Folder               | Command                     |
|------------|----------------------|-----------------------------|
| Backend API | edushare-api         | npm start                   |
| Frontend    | edushare-cosa-main   | npx http-server -p 8080     |
```

---

## Notes

* Do not open HTML files by double-clicking them.
* Always start the backend before using the frontend.
* Ensure MySQL is running before starting the API.

---

## Author / Project

Daniel Maia – Academic Project
