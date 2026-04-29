# EduShare

A web platform for educators to create, organize, and share quiz questions, with AI-powered question generation.

---

## Tech Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript (no framework)
- **Backend:** Node.js + Express
- **Database:** MySQL 8
- **AI:** OpenAI GPT-4o mini (via the `openai` npm package)
- **Auth:** bcrypt for password hashing

---

## Project Structure

```
EduShare/
├── frontend/              ← all HTML, CSS, JS, and images
│   ├── *.html             ← every page lives at the top level
│   ├── css/
│   ├── js/
│   └── assets/
├── backend/               ← Express server + AI routes
│   ├── server.js          ← main server (all DB routes inline)
│   ├── ai-routes.js       ← /api/ai/generate endpoint
│   ├── _env.template      ← copy to .env and fill in
│   └── package.json
├── database/
│   ├── schema.sql         ← create tables
│   └── seed.sql           ← demo data (subjects, questions, etc.)
├── README.md
└── backendReference.md    ← detailed API and DB reference
```

---

## Quick Start

### 1. Set up the database

Make sure MySQL is installed and running, then:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p edushare < database/seed.sql
```

You'll also want to create a database user the backend can use:

```sql
CREATE USER 'edushare_user'@'localhost' IDENTIFIED BY 'edushare_pass';
GRANT ALL PRIVILEGES ON edushare.* TO 'edushare_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Set up the backend

```bash
cd backend
npm install
cp _env.template .env
```

Then open `.env` and fill in your values. The two important ones:

- **Database credentials** — match whatever you set up in step 1
- **`OPENAI_API_KEY`** — get one at https://platform.openai.com/api-keys (required for AI question generation; without it, the backend falls back to mock questions)

Start the server:

```bash
node server.js
```

You should see something like `Server running on port 3000`.

### 3. Serve the frontend

The `frontend/` folder is just static files — any local web server works. A few options:

- VS Code's **Live Server** extension
- `npx http-server frontend/ -p 8080`
- `python3 -m http.server 8080` (run from inside `frontend/`)

Then visit the URL it gives you and open `Login.html`.

### 4. Point the frontend at your backend

If your backend isn't on `localhost:3000`, edit `frontend/js/api-config.js` and change the `BASE_URL` value at the top. Comments in that file explain the options.

### 5. Log in

Demo account in the seed data:

- **Email:** teacher@example.com
- **Password:** demo123

---

## Known Issues / Quirks

- **Demo account password is plain text.** The backend supports bcrypt comparison, but the seed data stores `demo123` as plain text. Production use should hash all passwords.
- **Old questions use legacy schema.** A handful of seed questions use the original `topic` + `option_a-d` columns. Newer questions use `node_id` + the `question_options` table. Both are supported, but consolidating would simplify the codebase.
- **Add Course "New Subject" uses a browser prompt.** The "Add New Subject" flow on the Add Course page uses the native browser `prompt()` dialog. Functional but inconsistent with the rest of the UI.

---

## Notes

- The backend's `server.js` is one big monolithic file with all the routes inline. Not pretty, but it works. If someone wants to break it into modules later, that'd be a nice cleanup.
- The AI generation endpoint (`/api/ai/generate`) gracefully falls back to mock questions if `OPENAI_API_KEY` isn't set — useful for development.
- Don't commit `.env` files. The `.gitignore` is set up to keep them out.
- See `backendReference.md` for full API documentation and database schema details.