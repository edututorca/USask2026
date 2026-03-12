# EduShare - Master TODO List
# Updated: Feb 25, 2026

---

## PAGES COMPLETED ✅
- [x] Login (Login.html)
- [x] Dashboard (dashboard.html) — clickable stats, active classes, links
- [x] My Courses (my-courses.html) — expandable subjects, auto-expand from URL
- [x] Quiz Manager (quiz-manager.html) — expand, duplicate, share, delete
- [x] My Quiz Editor (my-quiz.html) — Trello drag-drop, edit modal, print, sticky footer
- [x] Create Quiz (create-quiz.html) — subject dropdown, success banner
- [x] Browse Quizzes (browse-quizzes.html) — search, filter, preview, copy
- [x] Question Creator (question-creator.html) — MCQ, T/F, Short Answer, Essay
- [x] Add Course (Add-course.html) — simplified: category + course code + section

## PAGES TO DO 🔧
- [ ] AI Question Creator (ai-question-creator.html) — teammate working on
- [ ] User Area / Question Bank (User-Area.html) — needs full rebuild
- [ ] Account Settings (Account.html)
- [ ] Profile (profile.html)
- [ ] Profile Setup (profile-setup.html)
- [ ] Help (help.html) — works, needs path fixes
- [ ] Home (home.html) — landing page
- [ ] Forgot Password (forgot-password.html)

## SERVER FIXES (ssh jobin@172.16.1.134)
- [ ] Fix field name mismatch: frontend sends snake_case, server expects camelCase on POST
- [ ] Add GET /api/course-codes endpoint
- [ ] Add POST /api/subjects endpoint (create new subject)
- [ ] Add POST /api/topics endpoint (create new topic)
- [ ] Add POST /api/user-courses endpoint (save teacher's class)
- [ ] Add POST /api/quizzes/:id/copy endpoint
- [ ] Run migration.sql (adds category column, course_codes + user_courses tables)

## CLIENT DECISIONS — PENDING
- [ ] Add Course flow — client wants simplified, reviewing options
- [ ] Where subjects/topics get added after course creation
- [ ] User Area page design