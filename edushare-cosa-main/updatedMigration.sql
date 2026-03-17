-- ============================================================
-- EduShare Migration Script
-- Run on laptop: mysql -u edushare_user -pedushare_pass edushare < migration.sql
-- 
-- SAFE: Only adds new tables/columns. Does NOT drop or modify
-- existing data. Can be run multiple times (IF NOT EXISTS).
-- ============================================================

USE edushare;

-- ============================================================
-- STEP 1: Modify existing tables
-- ============================================================

-- Add description to subjects
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS description TEXT AFTER name;

-- Add node_id to questions (links to hierarchy)
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS node_id INT AFTER topic;

-- ============================================================
-- STEP 2: Create hierarchy_nodes table
-- ============================================================

CREATE TABLE IF NOT EXISTS hierarchy_nodes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    subject_id  INT NOT NULL,
    parent_id   INT DEFAULT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    label       VARCHAR(100) DEFAULT 'Level',
    depth       INT NOT NULL DEFAULT 0,
    sort_order  INT DEFAULT 0,
    created_by  INT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES hierarchy_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_subject (subject_id),
    INDEX idx_parent (parent_id),
    INDEX idx_depth (depth)
);

-- Now add FK from questions to hierarchy_nodes
-- (done separately because hierarchy_nodes must exist first)
ALTER TABLE questions
ADD CONSTRAINT fk_questions_node
FOREIGN KEY (node_id) REFERENCES hierarchy_nodes(id)
ON DELETE SET NULL;

-- ============================================================
-- STEP 3: Create question_options table
-- ============================================================

CREATE TABLE IF NOT EXISTS question_options (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct  TINYINT(1) DEFAULT 0,
    sort_order  INT DEFAULT 0,

    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
);

-- ============================================================
-- STEP 4: Create user_courses table
-- ============================================================

CREATE TABLE IF NOT EXISTS user_courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    subject_id  INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    section     VARCHAR(50) DEFAULT NULL,
    nickname    VARCHAR(100) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,

    UNIQUE KEY unique_user_course_section (user_id, course_code, section),
    INDEX idx_user (user_id)
);

-- ============================================================
-- STEP 5: Create user_profiles table
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    street          VARCHAR(255),
    city            VARCHAR(100),
    province        VARCHAR(100),
    postal_code     VARCHAR(20),
    school          VARCHAR(255),
    school_city     VARCHAR(100),
    school_country  VARCHAR(100),
    subjects        TEXT,
    grade           VARCHAR(50),
    interests       TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_profile (user_id),
    INDEX idx_user (user_id)
);

-- ============================================================
-- STEP 6: Create course_codes reference table
-- ============================================================

CREATE TABLE IF NOT EXISTS course_codes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(20) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    subject_area VARCHAR(100),
    grade       INT,
    pathway     VARCHAR(50)
);

-- Populate Ontario course codes
INSERT IGNORE INTO course_codes (code, name, subject_area, grade, pathway) VALUES
-- English
('ENG1D', 'English, Grade 9, Academic', 'English', 9, 'Academic'),
('ENG1P', 'English, Grade 9, Applied', 'English', 9, 'Applied'),
('ENG1L', 'English, Grade 9, Locally Developed', 'English', 9, 'Locally Developed'),
('ENG2D', 'English, Grade 10, Academic', 'English', 10, 'Academic'),
('ENG2P', 'English, Grade 10, Applied', 'English', 10, 'Applied'),
('ENG2L', 'English, Grade 10, Locally Developed', 'English', 10, 'Locally Developed'),
('ENG3U', 'English, Grade 11, University Preparation', 'English', 11, 'University'),
('ENG3C', 'English, Grade 11, College Preparation', 'English', 11, 'College'),
('ENG3E', 'English, Grade 11, Workplace Preparation', 'English', 11, 'Workplace'),
('ENG4U', 'English, Grade 12, University Preparation', 'English', 12, 'University'),
('ENG4C', 'English, Grade 12, College Preparation', 'English', 12, 'College'),
('ENG4E', 'English, Grade 12, Workplace Preparation', 'English', 12, 'Workplace'),
('EMS3O', 'Media Studies, Grade 11, Open', 'English', 11, 'Open'),
('EWC4U', 'The Writer''s Craft, Grade 12, University Preparation', 'English', 12, 'University'),
('OLC4O', 'Ontario Secondary School Literacy Course, Grade 12, Open', 'English', 12, 'Open'),

-- Mathematics
('MPM1D', 'Principles of Mathematics, Grade 9, Academic', 'Mathematics', 9, 'Academic'),
('MFM1P', 'Foundations of Mathematics, Grade 9, Applied', 'Mathematics', 9, 'Applied'),
('MAT1L', 'Mathematics, Grade 9, Locally Developed', 'Mathematics', 9, 'Locally Developed'),
('MPM2D', 'Principles of Mathematics, Grade 10, Academic', 'Mathematics', 10, 'Academic'),
('MFM2P', 'Foundations of Mathematics, Grade 10, Applied', 'Mathematics', 10, 'Applied'),
('MAT2L', 'Mathematics, Grade 10, Locally Developed', 'Mathematics', 10, 'Locally Developed'),
('MCR3U', 'Functions, Grade 11, University Preparation', 'Mathematics', 11, 'University'),
('MCF3M', 'Functions and Applications, Grade 11, University/College', 'Mathematics', 11, 'University/College'),
('MBF3C', 'Foundations for College Mathematics, Grade 11, College', 'Mathematics', 11, 'College'),
('MEL3E', 'Mathematics for Work and Everyday Life, Grade 11, Workplace', 'Mathematics', 11, 'Workplace'),
('MHF4U', 'Advanced Functions, Grade 12, University Preparation', 'Mathematics', 12, 'University'),
('MCV4U', 'Calculus and Vectors, Grade 12, University Preparation', 'Mathematics', 12, 'University'),
('MDM4U', 'Mathematics of Data Management, Grade 12, University Preparation', 'Mathematics', 12, 'University'),
('MAP4C', 'Foundations for College Mathematics, Grade 12, College', 'Mathematics', 12, 'College'),
('MEL4E', 'Mathematics for Work and Everyday Life, Grade 12, Workplace', 'Mathematics', 12, 'Workplace'),

-- Science
('SNC1D', 'Science, Grade 9, Academic', 'Science', 9, 'Academic'),
('SNC1P', 'Science, Grade 9, Applied', 'Science', 9, 'Applied'),
('SNC1L', 'Science, Grade 9, Locally Developed', 'Science', 9, 'Locally Developed'),
('SNC2D', 'Science, Grade 10, Academic', 'Science', 10, 'Academic'),
('SNC2P', 'Science, Grade 10, Applied', 'Science', 10, 'Applied'),
('SNC2L', 'Science, Grade 10, Locally Developed', 'Science', 10, 'Locally Developed'),
('SBI3U', 'Biology, Grade 11, University Preparation', 'Science', 11, 'University'),
('SBI3C', 'Biology, Grade 11, College Preparation', 'Science', 11, 'College'),
('SCH3U', 'Chemistry, Grade 11, University Preparation', 'Science', 11, 'University'),
('SPH3U', 'Physics, Grade 11, University Preparation', 'Science', 11, 'University'),
('SVN3M', 'Environmental Science, Grade 11, University/College', 'Science', 11, 'University/College'),
('SBI4U', 'Biology, Grade 12, University Preparation', 'Science', 12, 'University'),
('SCH4U', 'Chemistry, Grade 12, University Preparation', 'Science', 12, 'University'),
('SPH4U', 'Physics, Grade 12, University Preparation', 'Science', 12, 'University'),
('SES4U', 'Earth and Space Science, Grade 12, University Preparation', 'Science', 12, 'University'),

-- Canadian & World Studies (History, Geography, etc.)
('CGC1D', 'Issues in Canadian Geography, Grade 9, Academic', 'Canadian & World Studies', 9, 'Academic'),
('CGC1P', 'Issues in Canadian Geography, Grade 9, Applied', 'Canadian & World Studies', 9, 'Applied'),
('CHC2D', 'Canadian History Since World War I, Grade 10, Academic', 'Canadian & World Studies', 10, 'Academic'),
('CHC2P', 'Canadian History Since World War I, Grade 10, Applied', 'Canadian & World Studies', 10, 'Applied'),
('CHV2O', 'Civics and Citizenship, Grade 10, Open', 'Canadian & World Studies', 10, 'Open'),
('CHW3M', 'World History to the End of the 15th Century, Grade 11, University/College', 'Canadian & World Studies', 11, 'University/College'),
('CHA3U', 'American History, Grade 11, University Preparation', 'Canadian & World Studies', 11, 'University'),
('CLU3M', 'Understanding Canadian Law, Grade 11, University/College', 'Canadian & World Studies', 11, 'University/College'),
('CHY4U', 'World History Since the 15th Century, Grade 12, University Preparation', 'Canadian & World Studies', 12, 'University'),
('CPW4U', 'Canadian and International Politics, Grade 12, University Preparation', 'Canadian & World Studies', 12, 'University'),
('CGW4U', 'World Issues: A Geographic Analysis, Grade 12, University Preparation', 'Canadian & World Studies', 12, 'University'),
('CLN4U', 'Canadian and International Law, Grade 12, University Preparation', 'Canadian & World Studies', 12, 'University'),

-- French
('FSF1D', 'Core French, Grade 9, Academic', 'French', 9, 'Academic'),
('FSF1P', 'Core French, Grade 9, Applied', 'French', 9, 'Applied'),
('FSF2D', 'Core French, Grade 10, Academic', 'French', 10, 'Academic'),
('FSF3U', 'Core French, Grade 11, University Preparation', 'French', 11, 'University'),
('FSF4U', 'Core French, Grade 12, University Preparation', 'French', 12, 'University'),
('FIF1D', 'French Immersion, Grade 9, Academic', 'French', 9, 'Academic'),
('FIF2D', 'French Immersion, Grade 10, Academic', 'French', 10, 'Academic'),

-- The Arts
('ADA1O', 'Drama, Grade 9, Open', 'The Arts', 9, 'Open'),
('ADA2O', 'Drama, Grade 10, Open', 'The Arts', 10, 'Open'),
('AMU1O', 'Music, Grade 9, Open', 'The Arts', 9, 'Open'),
('AMU2O', 'Music, Grade 10, Open', 'The Arts', 10, 'Open'),
('AVI1O', 'Visual Arts, Grade 9, Open', 'The Arts', 9, 'Open'),
('AVI2O', 'Visual Arts, Grade 10, Open', 'The Arts', 10, 'Open'),
('AVI3M', 'Visual Arts, Grade 11, University/College', 'The Arts', 11, 'University/College'),
('AVI4M', 'Visual Arts, Grade 12, University/College', 'The Arts', 12, 'University/College'),

-- Business Studies
('BBI1O', 'Introduction to Business, Grade 9, Open', 'Business Studies', 9, 'Open'),
('BBI2O', 'Introduction to Business, Grade 10, Open', 'Business Studies', 10, 'Open'),
('BAF3M', 'Financial Accounting Fundamentals, Grade 11, University/College', 'Business Studies', 11, 'University/College'),
('BBB4M', 'International Business Fundamentals, Grade 12, University/College', 'Business Studies', 12, 'University/College'),

-- Computer Studies
('ICS2O', 'Introduction to Computer Studies, Grade 10, Open', 'Computer Studies', 10, 'Open'),
('ICS3U', 'Introduction to Computer Science, Grade 11, University Preparation', 'Computer Studies', 11, 'University'),
('ICS3C', 'Introduction to Computer Science, Grade 11, College Preparation', 'Computer Studies', 11, 'College'),
('ICS4U', 'Computer Science, Grade 12, University Preparation', 'Computer Studies', 12, 'University'),

-- Health & Physical Education
('PPL1O', 'Healthy Active Living Education, Grade 9, Open', 'Health & Physical Education', 9, 'Open'),
('PPL2O', 'Healthy Active Living Education, Grade 10, Open', 'Health & Physical Education', 10, 'Open'),
('PPL3O', 'Healthy Active Living Education, Grade 11, Open', 'Health & Physical Education', 11, 'Open'),
('PPL4O', 'Healthy Active Living Education, Grade 12, Open', 'Health & Physical Education', 12, 'Open'),
('PSK4U', 'Introductory Kinesiology, Grade 12, University Preparation', 'Health & Physical Education', 12, 'University');

-- ============================================================
-- STEP 7: Create documents table
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    node_id     INT DEFAULT NULL,
    title       VARCHAR(255) NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    file_size   INT NOT NULL,
    file_data   LONGBLOB NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_node (node_id)
);

-- ============================================================
-- STEP 8: Seed hierarchy data for English
-- ============================================================

-- Get English subject ID
SET @engID = (SELECT id FROM subjects WHERE name = 'English');

-- Top-level categories (depth 0)
INSERT INTO hierarchy_nodes (subject_id, parent_id, name, label, depth, sort_order) VALUES
(@engID, NULL, 'Plays', 'Category', 0, 1),
(@engID, NULL, 'Novels', 'Category', 0, 2),
(@engID, NULL, 'Poetry', 'Category', 0, 3),
(@engID, NULL, 'Essays', 'Category', 0, 4),
(@engID, NULL, 'Short Stories', 'Category', 0, 5),
(@engID, NULL, 'Grammar', 'Category', 0, 6);

-- Get category IDs
SET @playsID = (SELECT id FROM hierarchy_nodes WHERE subject_id = @engID AND name = 'Plays' AND depth = 0);
SET @novelsID = (SELECT id FROM hierarchy_nodes WHERE subject_id = @engID AND name = 'Novels' AND depth = 0);
SET @poetryID = (SELECT id FROM hierarchy_nodes WHERE subject_id = @engID AND name = 'Poetry' AND depth = 0);

-- Works under Plays (depth 1)
INSERT INTO hierarchy_nodes (subject_id, parent_id, name, label, depth, sort_order) VALUES
(@engID, @playsID, 'Romeo and Juliet', 'Work', 1, 1),
(@engID, @playsID, 'Macbeth', 'Work', 1, 2),
(@engID, @playsID, 'Julius Caesar', 'Work', 1, 3),
(@engID, @playsID, 'The Crucible', 'Work', 1, 4);

-- Works under Novels (depth 1)
INSERT INTO hierarchy_nodes (subject_id, parent_id, name, label, depth, sort_order) VALUES
(@engID, @novelsID, 'The Great Gatsby', 'Work', 1, 1),
(@engID, @novelsID, 'To Kill a Mockingbird', 'Work', 1, 2);

-- Poets under Poetry (depth 1)
INSERT INTO hierarchy_nodes (subject_id, parent_id, name, label, depth, sort_order) VALUES
(@engID, @poetryID, 'Robert Frost', 'Poet', 1, 1),
(@engID, @poetryID, 'Shakespeare Sonnets', 'Poet', 1, 2);

-- Acts under Romeo and Juliet (depth 2)
SET @romeoID = (SELECT id FROM hierarchy_nodes WHERE subject_id = @engID AND name = 'Romeo and Juliet' AND depth = 1);

INSERT INTO hierarchy_nodes (subject_id, parent_id, name, label, depth, sort_order) VALUES
(@engID, @romeoID, 'Act 1', 'Act', 2, 1),
(@engID, @romeoID, 'Act 2', 'Act', 2, 2),
(@engID, @romeoID, 'Act 3', 'Act', 2, 3),
(@engID, @romeoID, 'Act 4', 'Act', 2, 4),
(@engID, @romeoID, 'Act 5', 'Act', 2, 5);

-- Scenes under Act 3 (depth 3) — just as a demo
SET @act3ID = (SELECT id FROM hierarchy_nodes WHERE subject_id = @engID AND parent_id = @romeoID AND name = 'Act 3');

INSERT INTO hierarchy_nodes (subject_id, parent_id, name, label, depth, sort_order) VALUES
(@engID, @act3ID, 'Scene 1', 'Scene', 3, 1),
(@engID, @act3ID, 'Scene 2', 'Scene', 3, 2),
(@engID, @act3ID, 'Scene 3', 'Scene', 3, 3),
(@engID, @act3ID, 'Scene 4', 'Scene', 3, 4),
(@engID, @act3ID, 'Scene 5', 'Scene', 3, 5);

-- ============================================================
-- STEP 9: Seed demo user_courses
-- ============================================================

INSERT INTO user_courses (user_id, subject_id, course_code, section) VALUES
(1, @engID, 'ENG1D', 'Sec A'),
(1, @engID, 'ENG1D', 'Sec B'),
(1, @engID, 'ENG2D', 'Sec A'),
(1, (SELECT id FROM subjects WHERE name = 'Math'), 'MPM2D', 'Sec A'),
(1, (SELECT id FROM subjects WHERE name = 'Science'), 'SNC1D', 'Sec A');

-- ============================================================
-- STEP 10: Create demo user_profile for existing user
-- ============================================================

INSERT IGNORE INTO user_profiles (user_id, first_name, last_name, school, school_city, school_country, subjects)
VALUES (1, 'Daniel', 'Maia', 'Regina High School', 'Regina', 'Canada', 'English Literature');

-- ============================================================
-- DONE! Verify with:
--   SHOW TABLES;
--   SELECT COUNT(*) FROM hierarchy_nodes;
--   SELECT COUNT(*) FROM course_codes;
--   SELECT * FROM user_courses;
-- ============================================================