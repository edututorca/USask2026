-- EduShare Database Migration
-- Run: mysql -u root edushare < migration.sql

USE edushare;

-- Add category to subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL;
UPDATE subjects SET category = 'English' WHERE name IN ('Plays', 'Grammar', 'Novel', 'Literature');
UPDATE subjects SET category = 'Mathematics' WHERE name IN ('Algebra', 'Geometry');
UPDATE subjects SET category = 'Computer Science' WHERE name IN ('Java Basics', 'Python Fundamentals');

-- Ontario course codes
CREATE TABLE IF NOT EXISTS course_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    grade INT NOT NULL,
    course_type VARCHAR(50) NOT NULL,
    UNIQUE KEY unique_code (code)
);

INSERT IGNORE INTO course_codes (code, title, category, grade, course_type) VALUES
('ENG1D', 'English, Grade 9, Academic', 'English', 9, 'Academic'),
('ENG1P', 'English, Grade 9, Applied', 'English', 9, 'Applied'),
('ENG1W', 'English, Grade 9, Destreamed', 'English', 9, 'Destreamed'),
('ENG2D', 'English, Grade 10, Academic', 'English', 10, 'Academic'),
('ENG2P', 'English, Grade 10, Applied', 'English', 10, 'Applied'),
('ENG3U', 'English, Grade 11, University', 'English', 11, 'University'),
('ENG3C', 'English, Grade 11, College', 'English', 11, 'College'),
('ENG4U', 'English, Grade 12, University', 'English', 12, 'University'),
('ENG4C', 'English, Grade 12, College', 'English', 12, 'College'),
('MTH1W', 'Mathematics, Grade 9, Destreamed', 'Mathematics', 9, 'Destreamed'),
('MPM1D', 'Principles of Math, Grade 9, Academic', 'Mathematics', 9, 'Academic'),
('MPM2D', 'Principles of Math, Grade 10, Academic', 'Mathematics', 10, 'Academic'),
('MFM2P', 'Foundations of Math, Grade 10, Applied', 'Mathematics', 10, 'Applied'),
('MCR3U', 'Functions, Grade 11, University', 'Mathematics', 11, 'University'),
('MHF4U', 'Advanced Functions, Grade 12, University', 'Mathematics', 12, 'University'),
('MCV4U', 'Calculus & Vectors, Grade 12, University', 'Mathematics', 12, 'University'),
('MDM4U', 'Data Management, Grade 12, University', 'Mathematics', 12, 'University'),
('SNC1D', 'Science, Grade 9, Academic', 'Science', 9, 'Academic'),
('SNC1W', 'Science, Grade 9, Destreamed', 'Science', 9, 'Destreamed'),
('SNC2D', 'Science, Grade 10, Academic', 'Science', 10, 'Academic'),
('SBI3U', 'Biology, Grade 11, University', 'Science', 11, 'University'),
('SCH3U', 'Chemistry, Grade 11, University', 'Science', 11, 'University'),
('SPH3U', 'Physics, Grade 11, University', 'Science', 11, 'University'),
('SBI4U', 'Biology, Grade 12, University', 'Science', 12, 'University'),
('SCH4U', 'Chemistry, Grade 12, University', 'Science', 12, 'University'),
('SPH4U', 'Physics, Grade 12, University', 'Science', 12, 'University'),
('CGC1D', 'Geography of Canada, Grade 9, Academic', 'Geography', 9, 'Academic'),
('CHC2D', 'Canadian History Since WWI, Grade 10, Academic', 'History', 10, 'Academic'),
('CHV2O', 'Civics and Citizenship, Grade 10, Open', 'Social Studies', 10, 'Open'),
('FSF1D', 'Core French, Grade 9, Academic', 'French', 9, 'Academic'),
('FSF2D', 'Core French, Grade 10, Academic', 'French', 10, 'Academic'),
('ICS2O', 'Intro to Computer Studies, Grade 10, Open', 'Computer Science', 10, 'Open'),
('ICS3U', 'Intro to Computer Science, Grade 11, University', 'Computer Science', 11, 'University'),
('ICS4U', 'Computer Science, Grade 12, University', 'Computer Science', 12, 'University'),
('AVI1O', 'Visual Arts, Grade 9, Open', 'Art', 9, 'Open'),
('ADA1O', 'Drama, Grade 9, Open', 'Drama', 9, 'Open'),
('AMU1O', 'Music, Grade 9, Open', 'Music', 9, 'Open'),
('PPL1O', 'Health & Physical Education, Grade 9, Open', 'Physical Education', 9, 'Open'),
('BBI1O', 'Intro to Business, Grade 9, Open', 'Business', 9, 'Open'),
('CLU3M', 'Understanding Canadian Law, Grade 11, University/College', 'Law', 11, 'University/College'),
('HSP3U', 'Intro to Anthropology/Psych/Sociology, Grade 11, University', 'Social Studies', 11, 'University'),
('NAC1O', 'Expressing Aboriginal Cultures, Grade 9, Open', 'Indigenous Studies', 9, 'Open');

-- Teacher's personal classes
CREATE TABLE IF NOT EXISTS user_courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_code_id INT,
    course_code VARCHAR(10),
    section_tag VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

SELECT 'Migration complete!' AS status;