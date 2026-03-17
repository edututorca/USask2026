 # EduShare - Complete Backend & Infrastructure Reference
# Last Updated: Mar 16, 2026

---

## HARDWARE SETUP

### Development Machine (Main PC)
- **OS:** Windows 10
- **Role:** Frontend development, SSH into laptop
- **Tools:** VS Code with Live Server, PowerShell for SSH
- **Frontend path:** edushare-cosa-main/ folder

### Server Machine (Laptop)
- **OS:** Ubuntu 24.04 LTS (GNU/Linux 6.17.0-14-generic x86_64)
- **Model:** Acer Aspire A315-31
- **Role:** Runs Express server + MySQL database + ngrok tunnel
- **IP:** 172.16.1.134 (local network — may change if router reassigns)
- **Username:** jobin
- **Server path:** /home/jobin/edushare-server/

### SSH Access (from Windows PC)
```bash
ssh jobin@172.16.1.134
```
- Password: (enter laptop's Linux password, characters won't show as you type)
- If "connection timed out" — laptop is off or IP changed. On laptop run `hostname -I` to check

---

## SERVER STACK

- **Runtime:** Node.js with Express.js
- **Database:** MySQL 8.0.45 (mysql2/promise package)
- **Auth:** bcrypt for password hashing
- **Process Manager:** PM2 (auto-restart on boot, runs with lid closed)
- **Tunneling:** ngrok (free tier — URL changes every restart)
- **AI:** OpenAI GPT-4o mini (school-provided key) — route exists in ai-routes.js

### PM2 Commands (run on laptop via SSH)
```bash
pm2 status              # Check if server + ngrok are running
pm2 restart 0           # Restart the Express server (id=0)
pm2 restart 1           # Restart ngrok tunnel (id=1)
pm2 logs                # View live server logs
pm2 logs 0              # Server logs only
pm2 logs --lines 50     # Last 50 lines
pm2 start server.js     # Start server if not running
pm2 save                # Save current process list for auto-restart
```

### ngrok
- Free tier account — URL changes every time ngrok restarts
- Current URL: `https://dewitt-paraffinoid-helene.ngrok-free.dev`
- After restarting ngrok, update BASE_URL in api-config.js
- To get the current ngrok URL:
```bash
curl http://localhost:4040/api/tunnels
```
- Or check PM2 logs: `pm2 logs 1`

---

## DATABASE

### Connection Details
```
Host: localhost
User: edushare_user
Password: edushare_pass
Database: edushare
Port: 3306
```

### .env file on laptop (/home/jobin/edushare-server/.env)
```
DB_HOST=localhost
DB_USER=edushare_user
DB_PASSWORD=edushare_pass
DB_NAME=edushare
PORT=3000
ANTHROPIC_API_KEY=
```

### MySQL Commands (run on laptop via SSH)
```bash
mysql -u edushare_user -pedushare_pass edushare              # Connect to database
mysql -u edushare_user -pedushare_pass edushare -e "SHOW TABLES;"
mysql -u edushare_user -pedushare_pass edushare -e "DESCRIBE questions;"
mysql -u edushare_user -pedushare_pass edushare -e "SELECT * FROM users;"
mysql -u edushare_user -pedushare_pass edushare -e "SELECT COUNT(*) FROM hierarchy_nodes;"
```

### Current Tables (11 total)
```
users              — id, email, password_hash, display_name, role, created_at
user_profiles      — id, user_id, first_name, last_name, phone, street, city, province, postal_code, school, school_city, school_country, subjects, grade, interests
user_courses       — id, user_id, subject_id, course_code, section, nickname, created_at
subjects           — id, name, description
hierarchy_nodes    — id, subject_id, parent_id, name, description, label, depth, sort_order, created_by, created_at
questions          — id, user_id, subject_id, grade, topic, node_id, question_text, question_type, option_a-d, correct_answer, difficulty, created_at
question_options   — id, question_id, option_text, is_correct, sort_order
quizzes            — id, user_id, title, description, subject_id, grade, is_public, created_at
quiz_questions     — id, quiz_id, question_id, question_order, point_value, answer_space_lines
course_codes       — id, code, name, subject_area, grade, pathway
documents          — id, user_id, node_id, title, file_name, mime_type, file_size, file_data, created_at
```

### hierarchy_nodes explained
Self-referencing tree table for the drill-down UI. Every category, work, act, scene is a row.
- `parent_id = NULL` means top-level (Category) for that subject
- `depth` is the level: 0=Category, 1=Work, 2=Act, 3=Scene (or whatever teachers name them)
- `label` is what the drill-down bar is called ("Category", "Work", "Act", "Scene", etc.)
- `subject_id` on every row for easy querying

### questions — dual-path fields (migration in progress)
- `topic` (VARCHAR) — old flat string, used by the original 5 questions
- `node_id` (INT, FK → hierarchy_nodes) — new, links question to a spot in the hierarchy
- `option_a` through `option_d` — old inline options
- `question_options` table — new, supports unlimited options per question
- **New questions should use `node_id` + `question_options` table**
- **TODO:** Migrate old questions to nodes, then drop `topic` and `option_a-d` columns

### Demo Account
```
Email: teacher@example.com
Password: demo123 (stored as plain text — bcrypt comparison also supported)
User ID: 1
Display Name: Daniel Maia
Role: teacher
```

### Seed Data (as of Mar 16, 2026)
- 6 subjects: English, Math, Science, Computer Science, History, Art
- 24 hierarchy nodes for English (Plays → Romeo & Juliet → Acts → Scenes, Novels, Poetry, etc.)
- 85 Ontario course codes in course_codes table
- 5 demo courses for user 1 (ENG1D Sec A, ENG1D Sec B, ENG2D Sec A, MPM2D Sec A, SNC1D Sec A)
- 5 original questions (using old topic/option_a-d format)
- 1 user profile for Daniel Maia

---

## SERVER.JS — FULL ROUTE MAP

The server.js on the laptop is a single monolithic file (~650 lines). Here's every endpoint:

### Auth
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | /api/auth/register | `{ email, password, displayName, role }` | `{ success, userId }` |
| POST | /api/auth/login | `{ email, password }` | `{ success, userId, userType, email, firstName, lastName, user }` |
| POST | /api/auth/logout | none | `{ success }` |

### User Profile
| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | /api/user/profile | `?userId=` | Profile object with user info |
| POST | /api/user/profile | `{ userId, firstName, lastName, phone, street, city, province, postalCode, school, schoolCity, schoolCountry, subjects, grade, interests }` | `{ success }` |

### Subjects
| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | /api/subjects | `[{ id, name, description }]` |

### Courses (legacy — returns subjects as courses)
| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | /api/courses | `[{ CourseID, CourseName, SubjectName }]` |

### User Courses (sidebar data)
| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | /api/user-courses | `?userId=` | `[{ id, user_id, subject_id, course_code, section, nickname, subject_name }]` |
| POST | /api/user-courses | `{ userId, subjectId, courseCode, section, nickname }` | `{ success, id }` |
| DELETE | /api/user-courses/:id | none | `{ success }` |

### Course Codes (Ontario reference table)
| Method | Endpoint | Query | Returns |
|--------|----------|-------|---------|
| GET | /api/course-codes | `?search=&subjectArea=&grade=` | `[{ id, code, name, subject_area, grade, pathway }]` |

### Hierarchy (drill-down tree)
| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | /api/hierarchy/nodes | `?subjectId=&parentId=` | `[{ id, subject_id, parent_id, name, label, depth, sort_order }]` |
| GET | /api/hierarchy/nodes/:id | none | Node object with `breadcrumb` array |
| GET | /api/hierarchy/nodes/:id/descendants | none | `[id, id, id, ...]` (all descendant IDs) |
| POST | /api/hierarchy/nodes | `{ subjectId, parentId, name, label, description, createdBy }` | `{ success, node }` |
| DELETE | /api/hierarchy/nodes/:id | none | `{ success }` (cascades to children) |

### Dashboard
| Method | Endpoint | Query | Returns |
|--------|----------|-------|---------|
| GET | /api/dashboard/stats | `?userId=1` | `{ totalCourses, totalQuizzes, totalQuestions, experiencePoints, firstName }` |

### Questions
| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | /api/questions | `?userId=&subjectId=&grade=&nodeId=` | Array of questions (with options from question_options if available, falls back to option_a-d) |
| POST | /api/questions | `{ userId, subjectId, grade, topic, nodeId, questionText, questionType, optionA-D, correctAnswer, difficulty, options[] }` | `{ success, questionId }` |
| DELETE | /api/questions/:id | none | `{ success }` |

**nodeId filter:** When `nodeId` is provided, the GET endpoint uses a recursive CTE to find the node and all its descendants, returning questions at any depth below that node.

**options array:** When creating a question with `options: [{ text, isCorrect }]`, they are saved to the `question_options` table. Supports any number of options (2 for T/F, 4-8 for MCQ).

### Quizzes
| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | /api/quizzes | `?userId=` | Array of quizzes with nested questions |
| GET | /api/quizzes/recent | `?userId=&limit=5` | Recent quizzes |
| GET | /api/quizzes/community | none | Public quizzes with creator_name |
| GET | /api/quizzes/:id | none | Single quiz with questions array |
| POST | /api/quizzes | `{ userId, title, description, subjectId, grade }` | `{ success, quizId }` |
| POST | /api/quizzes/create | Same as above | Same (duplicate endpoint) |
| PUT | /api/quizzes/:id | `{ title, description, is_public, questions: [{id, question_order, point_value, answer_space_lines}] }` | `{ success }` |
| DELETE | /api/quizzes/:id | none | `{ success }` |
| POST | /api/quizzes/:id/duplicate | none | `{ success, quizId }` |
| POST | /api/quizzes/:id/questions | `{ questionId }` | `{ success }` |
| DELETE | /api/quizzes/:quizId/questions/:questionId | none | `{ success }` |

### Topics & Grades (legacy — from DISTINCT values in questions)
| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | /api/topics?subjectId= | `[{ name }]` |
| GET | /api/grades | `[{ grade }]` |

### AI Routes
- Mounted at /api/ai
- Defined in separate ai-routes.js file (teammate working on this)
- Currently has Anthropic key in .env but will switch to OpenAI GPT-4o mini

---

## FIELD NAME CONVENTIONS

### Server POST expects camelCase:
```
questionText, questionType, optionA, optionB, optionC, optionD,
correctAnswer, subjectId, userId, displayName, nodeId, courseCode
```

### Server GET returns snake_case (from database):
```
question_text, question_type, option_a, option_b, option_c, option_d,
correct_answer, subject_id, user_id, display_name, subject_name,
question_count, total_points, is_public, created_at, course_code,
subject_area, node_id, parent_id, sort_order
```

---

## FRONTEND CONFIGURATION

### api-config.js
```javascript
const API_CONFIG = {
    BASE_URL: 'https://YOUR-NGROK-URL.ngrok-free.dev/api',
    // For local development:
    // BASE_URL: 'http://localhost:3000/api',
};
```

### Important: ngrok header
All API requests include `'ngrok-skip-browser-warning': 'true'` header via apiRequest().

### File Structure
```
edushare-cosa-main/
├── *.html              ← All HTML pages in root
├── js/                 ← All JavaScript files
│   ├── api-config.js       ← Centralized API config + helpers
│   ├── question-bank.js    ← NEW: Question Bank page logic
│   ├── dashboard.js        ← Dashboard (uses userId)
│   ├── nav.js              ← Shared nav (hamburger pages)
│   ├── profile-setup.js    ← Registration wizard
│   └── ...
├── css/                ← All CSS files
│   ├── user-area.css       ← Question Bank page styles
│   ├── Nav.css             ← Shared nav styles
│   └── ...
└── assets/             ← Images
    └── EduShare_Logo.png
```

---

## COLOR SCHEME
- **Navy:** #17325f / #1f2f57 / #22345b / #2a3d69 / #3b5183
- **Orange:** #ffa321 / #ff6b35
- **Light backgrounds:** #f5f7fb / #f8f9fc
- **Border/muted:** #cfd9ef / #dfe4ef / #e8ecf4
- **Text muted:** #6073a0 / #9aa5c4
- **Success green:** #2e7d32
- **Error red:** #e53935 / #f44336

---

## PAGES STATUS

### Complete ✅
- Login (Login.html) — stores userId/firstName in sessionStorage
- Dashboard (dashboard.html) — per-user stats, active classes from user_courses
- Question Bank (User-Area.html) — persistent sidebar, drill-down hierarchy, question cards
- My Courses (my-courses.html)
- Quiz Manager (quiz-manager.html)
- My Quiz Editor (my-quiz.html) — Trello drag-drop, edit modal, print
- Create Quiz (create-quiz.html)
- Browse Community Quizzes (browse-quizzes.html)
- Question Creator (question-creator.html)

### Working but needs polish 🔧
- Profile Setup / Registration (profile-setup.html) — creates account + profile in DB, has confirm password
- Add Course (Add-course.html) — client reviewing simplified flow
- Home (home.html) — landing page, links to Account.html

### Not Started / Low Priority
- Account Settings (Account.html) — role selection page, may be redundant
- Profile (profile.html)
- Help (help.html) — works, needs path fixes
- Forgot Password (forgot-password.html)
- AI Question Creator (ai-question-creator.html) — teammate working on, frontend ready

---

## WHAT'S STILL TODO

### Backend
- [ ] Wire up /api/ai/generate with OpenAI GPT-4o mini key
- [ ] Migrate old 5 questions to use node_id + question_options
- [ ] Drop legacy columns (topic, option_a-d, correct_answer) after migration
- [ ] Add password hashing to demo account (currently plain text)

### Frontend
- [ ] Question Bank: edit question modal
- [ ] Question Bank: add-to-quiz picker modal
- [ ] Add Course page: wire to user_courses + course_codes endpoints
- [ ] Rename User-Area.html → question-bank.html (update all links)
- [ ] Fix Active Classes on dashboard to link to correct course in Question Bank
- [ ] Review validation on profile-setup (tighten field patterns)

### Client Decisions Pending
- [ ] Home → Account.html flow — redundant role selection?
- [ ] Add Course page simplified flow
- [ ] Difficulty feature — keep or remove?

---

## QUICK REFERENCE
- **SSH to laptop:** `ssh jobin@172.16.1.134`
- **MySQL login:** `mysql -u edushare_user -pedushare_pass edushare`
- **Server path:** `/home/jobin/edushare-server/`
- **Server backup:** `/home/jobin/edushare-server/server.js.bak`
- **PM2 commands:** `pm2 status`, `pm2 restart 0`, `pm2 logs 0`
- **ngrok URL check:** `pm2 logs 1 --lines 5`
- **Demo login:** teacher@example.com / demo123