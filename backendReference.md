# EduShare — Backend Reference

This document is a quick reference for the backend's database schema, API endpoints, and field naming conventions. Useful when working on the frontend or extending the backend.

---

## Stack

- **Runtime:** Node.js + Express
- **Database:** MySQL 8 (via `mysql2/promise`)
- **Auth:** bcrypt (with plain-text fallback for the demo account — see Known Issues in main README)
- **AI:** OpenAI GPT-4o mini via the `openai` npm package, mounted at `/api/ai`

The entire backend lives in `backend/server.js` (one file, all routes inline) plus `backend/ai-routes.js` for the AI generator. There is no `src/` or `routes/` folder structure. It's monolithic by design.

---

## Database Schema

### Tables (11 total)

| Table | What it holds |
|-------|---------------|
| `users` | Email, password hash, display name, role |
| `user_profiles` | Extended user info (name, address, school, subjects taught, etc.) |
| `user_courses` | A teacher's actual classes — links a user to a subject + course code + section |
| `subjects` | Top-level subject categories (English, Math, Science, etc.) |
| `hierarchy_nodes` | The drill-down tree (Category → Work → Act → Scene). Self-referencing. |
| `questions` | Question bank entries |
| `question_options` | Answer options for a question (newer schema — replaces `option_a-d`) |
| `quizzes` | Quiz metadata (title, description, public flag) |
| `quiz_questions` | Join table linking quizzes to questions, with order, points, line count |
| `course_codes` | Ontario course code reference (ENG1D, MPM2D, etc.) |
| `documents` | Uploaded teacher documents (PDFs/PPTs) — file_data stored as longblob |

### `hierarchy_nodes` — the drill-down tree

Self-referencing table for the Question Bank's drill-down navigation. Every Category, Work, Act, Scene is a row.

- `parent_id = NULL` → top-level node for that subject (depth 0)
- `depth` — 0 = Category, 1 = Work, 2 = Act, 3 = Scene (or whatever the teacher names them)
- `label` — display name for the level ("Category", "Work", "Act", "Scene")
- `subject_id` — denormalized on every row for easy querying

### `questions` — dual-schema during migration

The questions table currently supports BOTH the old flat schema and the newer hierarchy-based schema:

- **Old:** `topic` (varchar) + `option_a` through `option_d` columns inline on the row
- **New:** `node_id` (FK → hierarchy_nodes) + `question_options` table (one row per option)

New questions should always use `node_id` + `question_options`. The old columns remain for legacy data.

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/auth/register` | `{ email, password, displayName, role }` | `{ success, userId }` |
| POST | `/auth/login` | `{ email, password }` | `{ success, userId, userType, email, firstName, lastName, user }` |
| POST | `/auth/logout` | none | `{ success }` |

### User Profile

| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | `/user/profile` | `?userId=` | Profile object |
| POST | `/user/profile` | `{ userId, firstName, lastName, phone, street, city, province, postalCode, school, schoolCity, schoolCountry, subjects, grade, interests }` | `{ success }` |

### Subjects & Courses

| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | `/subjects` | none | `[{ id, name, description }]` |
| GET | `/courses` | none | `[{ CourseID, CourseName, SubjectName }]` *(legacy — returns subjects)* |
| GET | `/course-codes` | `?search=&subjectArea=&grade=` | `[{ id, code, name, subject_area, grade, pathway }]` |

### User Courses (the teacher's actual classes)

| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | `/user-courses` | `?userId=` | `[{ id, user_id, subject_id, course_code, section, nickname, subject_name }]` |
| POST | `/user-courses` | `{ userId, subjectId, courseCode, section, nickname }` | `{ success, id }` |
| DELETE | `/user-courses/:id` | none | `{ success }` |

### Hierarchy (drill-down tree)

| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | `/hierarchy/nodes` | `?subjectId=&parentId=` | Array of nodes |
| GET | `/hierarchy/nodes/:id` | none | Node with `breadcrumb` array |
| GET | `/hierarchy/nodes/:id/descendants` | none | `[id, id, ...]` (all descendant IDs) |
| POST | `/hierarchy/nodes` | `{ subjectId, parentId, name, label, description, createdBy }` | `{ success, node }` |
| DELETE | `/hierarchy/nodes/:id` | none | `{ success }` (cascades to children) |

### Questions

| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | `/questions` | `?userId=&subjectId=&grade=&nodeId=` | Array of questions |
| POST | `/questions` | `{ userId, subjectId, grade, topic, nodeId, questionText, questionType, optionA-D, correctAnswer, difficulty, options[] }` | `{ success, questionId }` |
| DELETE | `/questions/:id` | none | `{ success }` |

**`nodeId` filter:** When provided on GET, uses a recursive CTE to return questions for that node and all descendants.

**`options` array:** When creating a question with `options: [{ text, isCorrect }]`, they're saved to the `question_options` table. Supports any number of options.

### Quizzes

| Method | Endpoint | Body/Query | Returns |
|--------|----------|------------|---------|
| GET | `/quizzes` | `?userId=` | Quizzes with nested questions |
| GET | `/quizzes/recent` | `?userId=&limit=5` | Recent quizzes |
| GET | `/quizzes/community` | none | Public quizzes with `creator_name` |
| GET | `/quizzes/:id` | none | Single quiz with questions array |
| POST | `/quizzes` | `{ userId, title, description, subjectId, grade }` | `{ success, quizId }` |
| POST | `/quizzes/create` | same as above | duplicate endpoint, same behavior |
| PUT | `/quizzes/:id` | `{ title, description, is_public, questions: [{id, question_order, point_value, answer_space_lines}] }` | `{ success }` |
| DELETE | `/quizzes/:id` | none | `{ success }` |
| POST | `/quizzes/:id/duplicate` | none | `{ success, quizId }` |
| POST | `/quizzes/:id/questions` | `{ questionId }` | `{ success }` |
| DELETE | `/quizzes/:quizId/questions/:questionId` | none | `{ success }` |

### Dashboard

| Method | Endpoint | Query | Returns |
|--------|----------|-------|---------|
| GET | `/dashboard/stats` | `?userId=` | `{ totalCourses, totalQuizzes, totalQuestions, experiencePoints, firstName }` |

### AI Generation

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/ai/generate` | `{ subject, topic, subtopic, grade, bloomsLevel, types: [{type, count}], customPrompt }` | `{ success, questions, mode, count }` |

**Behavior:** If `OPENAI_API_KEY` is set in `.env`, calls GPT-4o mini. Otherwise falls back to mock questions.

**`bloomsLevel`** is optional. Accepts `Remember`, `Understand`, `Apply`, `Analyze`, `Evaluate`, or `Create`. When set, the AI prompt includes a directive to focus questions at that cognitive level.

**`types`** is an array like `[{ type: "MCQ", count: 3 }, { type: "TF", count: 2 }]`. Valid types: `MCQ`, `TF`, `SA`, `LA`.

### Topics & Grades (legacy)

| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/topics?subjectId=` | `[{ name }]` *(distinct values from questions.topic)* |
| GET | `/grades` | `[{ grade }]` |

These exist for the legacy schema. Newer code should query `hierarchy_nodes` directly.

---

## Field Naming Conventions

### Server expects **camelCase** in POST bodies:

```
questionText, questionType, optionA, optionB, optionC, optionD,
correctAnswer, subjectId, userId, displayName, nodeId, courseCode
```

### Server returns **snake_case** in GET responses (straight from MySQL):

```
question_text, question_type, option_a, option_b, option_c, option_d,
correct_answer, subject_id, user_id, display_name, subject_name,
question_count, total_points, is_public, created_at, course_code,
subject_area, node_id, parent_id, sort_order
```

This inconsistency is just how the codebase ended up. Frontend code already handles both — see `frontend/js/api-config.js` for the `apiRequest` helper.

---

## Frontend → Backend Contract

The frontend uses `frontend/js/api-config.js` to centralize the backend URL and provide a wrapped `fetch` (`apiRequest`). All API calls should go through `apiRequest()` rather than calling `fetch()` directly — it handles auth headers, JSON parsing, and error states.

To point the frontend at a different backend, edit `BASE_URL` at the top of `api-config.js`.

---

## Demo Account

Seeded automatically by `database/seed.sql`:

- **Email:** teacher@example.com
- **Password:** demo123
- **User ID:** 1
- **Role:** teacher