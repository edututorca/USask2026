# EduShare - Master TODO List
# Updated: Feb 24, 2026

---

## PAGES COMPLETED ✅

### Login (Login.html)
- [x] Login form works with demo credentials (teacher@example.com / demo123)
- [x] Redirects to dashboard on success

### Dashboard (dashboard.html)
- [x] Stat cards clickable (Total Courses → my-courses, Total Quizzes → quiz-manager, Questions → User-Area)
- [x] XP card commented out (not implemented)
- [x] Active Classes show "Grade 9-12" subtitle
- [x] Active Classes onclick → my-courses.html?course=CourseName
- [x] "View All →" links to my-courses.html
- [x] Sidebar "My Courses" → my-courses.html
- [x] All paths fixed (js/, css/, assets/)

### My Courses (my-courses.html) — NEW PAGE
- [x] Shows subjects with expandable dropdown arrows
- [x] Expanded view shows quizzes under each subject
- [x] Quiz count + question count per subject
- [x] Quizzes clickable → my-quiz.html for editing
- [x] Auto-expand from URL param (?course=Art)
- [x] Action buttons: Create Quiz, AI Generate Questions

### Quiz Manager (quiz-manager.html)
- [x] 3 quizzes load correctly
- [x] Expand/collapse works
- [x] View/Edit → my-quiz.html
- [x] Question count, total points, avg difficulty
- [x] Published status badge
- [x] Duplicate, Share, Delete buttons
- [x] Create New Quiz button → create-quiz.html

### My Quiz Edit (my-quiz.html)
- [x] Trello-style drag-drop with visual placeholder
- [x] Auto-scroll while dragging near edges
- [x] Edit modal (question text, type, difficulty, options, answer)
- [x] Create new question modal (server-first, local fallback)
- [x] Add Questions modal with search bar
- [x] Print Student Version + Print Answer Key
- [x] Sticky footer (question count, points, save, print)
- [x] Save banner (green "Saved!" slide-down)
- [x] Column-aligned controls: [lines] [pts] [edit] [delete]
- [x] Number inputs instead of dropdowns
- [x] Info tooltip on "lines"
- [x] Fixed SVG icons (pencil, trash)

### Create Quiz (create-quiz.html)
- [x] Subject dropdown from /api/subjects (was broken — loaded /api/courses)
- [x] Added nav/sidebar to match app
- [x] Fixed all paths
- [x] "Make public" checkbox
- [x] Success banner + redirect to my-quiz.html
- [x] Supports ?subject=ID URL param
- [x] Back link → quiz-manager.html

---

## PAGES TO DO 🔧

### AI Question Creator (ai-question-creator.html) ⭐ STAR FEATURE
- [ ] Test thoroughly — this is the main selling point
- [ ] Verify subject/topic selection works
- [ ] Test AI generation (Claude API) + mock fallback
- [ ] Review generated question quality
- [ ] Test save-to-database flow
- [ ] Fix paths if needed (js/, css/, assets/)
- [ ] Add nav/sidebar if missing

### Browse Quizzes (browse-quizzes.html)
- [ ] Test community quiz listing
- [ ] Verify /api/quizzes/community endpoint
- [ ] Check if login required to view
- [ ] Fix paths if needed
- [ ] Add nav/sidebar if missing

### Question Creator (question-creator.html)
- [ ] Test standalone question creation
- [ ] Determine: which subject/section does a standalone question belong to?
- [ ] Fix paths if needed
- [ ] Add nav/sidebar if missing

### User Area / Question Bank (User-Area.html)
- [ ] Currently loads blank
- [ ] Should show all user's questions with filters
- [ ] Needs server endpoint that returns questions by user (not just by sectionId)
- [ ] Fix paths if needed

### Add Course (Add-course.html)
- [ ] Test course/subject creation
- [ ] May need updating since we simplified to subjects
- [ ] Fix paths if needed

### Account Settings (Account.html)
- [ ] Basic page exists but needs review
- [ ] Email, password change, etc.
- [ ] Fix paths if needed

### Profile (profile.html)
- [ ] Review and test
- [ ] Fix paths if needed

### Profile Setup (profile-setup.html)
- [ ] Review — first-time setup flow
- [ ] Fix paths if needed

### Help (help.html)
- [ ] Appears to work
- [ ] Quick review for paths

### Home (home.html)
- [ ] Landing page for non-logged-in users
- [ ] Review and test

### Forgot Password (forgot-password.html)
- [ ] Review — likely just UI (no email service)
- [ ] Fix paths if needed

### Add Play (add-play.html)
- [ ] Unclear purpose — may be deprecated
- [ ] Check if still needed

---

## SERVER FIXES (laptop: ssh jobin@172.16.1.134)

### Must Fix
- [ ] POST /api/questions — field names mismatch (server expects: text, type, sectionId | frontend sends: question_text, question_type, subject_id). Frontend has fallback, just fix server.
- [ ] GET /api/questions — currently requires sectionId, needs to support subjectId or return all user questions
- [ ] POST /api/quizzes/create — verify accepts: title, subject_id, description, is_public
- [ ] Password hashing — demo uses plain "demo123", should use bcrypt

### Nice to Have
- [ ] Add /api/courses endpoint (or confirm subjects-only approach)
- [ ] Add user question count to dashboard stats
- [ ] Rate limiting on AI endpoint

---

## FUTURE FEATURES
- [ ] Experience Points system
- [ ] PDF upload for AI question generation (extract text → feed to AI)
- [ ] Content moderation for community quizzes
- [ ] Student accounts (take quizzes, view scores)

---

## QUICK REFERENCE
- **SSH to laptop:** `ssh jobin@172.16.1.134`
- **Server path:** `/home/jobin/edushare-server/`
- **PM2 commands:** `pm2 status`, `pm2 restart 0`, `pm2 logs`
- **Frontend path:** edushare-cosa-main/ (VS Code machine)
- **File structure:** root=HTML, js/=JavaScript, css/=CSS, assets/=images
- **Demo login:** teacher@example.com / demo123
- **Color scheme:** Navy #17325f/#22345b, Orange #ffa321/#ff6b35