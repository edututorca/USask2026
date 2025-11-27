-- EduShare Database Schema and Demo Data
-- Drop existing database and recreate
DROP DATABASE IF EXISTS edushare;
CREATE DATABASE edushare;
USE edushare;

-- CourseCategory Table
CREATE TABLE CourseCategory (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Course Table
CREATE TABLE Course (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    course_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES CourseCategory(category_id)
);

-- Subject Table
CREATE TABLE Subject (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

-- Topic Table
CREATE TABLE Topic (
    topic_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (subject_id) REFERENCES Subject(subject_id)
);

-- Subtopic Table
CREATE TABLE Subtopic (
    subtopic_id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL,
    subtopic_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (topic_id) REFERENCES Topic(topic_id)
);

-- Section Table
CREATE TABLE Section (
    section_id INT PRIMARY KEY AUTO_INCREMENT,
    subtopic_id INT NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    order_index INT DEFAULT 0,
    description TEXT,
    FOREIGN KEY (subtopic_id) REFERENCES Subtopic(subtopic_id)
);

-- QuestionPool Table
CREATE TABLE QuestionPool (
    pool_id INT PRIMARY KEY AUTO_INCREMENT,
    section_id INT NOT NULL,
    pool_name VARCHAR(100) NOT NULL,
    description TEXT,
    FOREIGN KEY (section_id) REFERENCES Section(section_id)
);

-- User Table
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_type ENUM('admin', 'teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Question Table
CREATE TABLE Question (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    pool_id INT NOT NULL,
    question_type ENUM('multiple_choice', 'short_answer', 'true_false') NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT,
    explanation TEXT,
    difficulty_level INT DEFAULT 1,
    created_by_user_id INT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    usage_count INT DEFAULT 0,
    FOREIGN KEY (pool_id) REFERENCES QuestionPool(pool_id),
    FOREIGN KEY (created_by_user_id) REFERENCES User(user_id)
);

-- MultipleChoiceOption Table
CREATE TABLE MultipleChoiceOption (
    option_id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES Question(question_id) ON DELETE CASCADE
);

-- Test Table
CREATE TABLE Test (
    test_id INT PRIMARY KEY AUTO_INCREMENT,
    created_by_user_id INT NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    time_limit_minutes INT,
    FOREIGN KEY (created_by_user_id) REFERENCES User(user_id)
);

-- TestQuestion Table
CREATE TABLE TestQuestion (
    test_question_id INT PRIMARY KEY AUTO_INCREMENT,
    test_id INT NOT NULL,
    question_id INT NOT NULL,
    question_order INT DEFAULT 0,
    points_value DECIMAL(5,2) DEFAULT 1.00,
    FOREIGN KEY (test_id) REFERENCES Test(test_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Question(question_id)
);

-- AIPromptHistory Table
CREATE TABLE AIPromptHistory (
    prompt_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pool_id INT,
    prompt_text TEXT NOT NULL,
    questions_generated INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_used VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (pool_id) REFERENCES QuestionPool(pool_id)
);

-- ============================================
-- DEMO DATA INSERTION
-- ============================================

-- Insert Course Categories
INSERT INTO CourseCategory (category_name, description) VALUES
('English', 'English Language Arts courses'),
('Mathematics', 'Mathematics courses at all levels'),
('Computer Science', 'Programming and computer science courses');

-- Insert Courses
INSERT INTO Course (category_id, course_name, description) VALUES
(1, 'ENG 010', 'English Fundamentals'),
(1, 'ENG 101', 'English I (Grade 9)'),
(1, 'ENG 102', 'English II (Grade 10)'),
(2, 'MATH 101', 'Algebra I (Grade 9)'),
(2, 'MATH 102', 'Geometry (Grade 10)'),
(3, 'CS-PROG-101', 'Java Programming'),
(3, 'CS-PROG-102', 'Python Programming');

-- Insert Subjects for English courses
INSERT INTO Subject (course_id, subject_name, description) VALUES
(1, 'Grammar', 'English grammar fundamentals'),
(2, 'Plays', 'Shakespeare and classic plays'),
(2, 'Novel', 'Novel study and analysis'),
(3, 'Literature', 'Literary analysis');

-- Insert Subjects for Math courses
INSERT INTO Subject (course_id, subject_name, description) VALUES
(4, 'Algebra', 'Algebraic concepts and equations'),
(5, 'Geometry', 'Shapes, proofs, and spatial reasoning');

-- Insert Subjects for CS courses
INSERT INTO Subject (course_id, subject_name, description) VALUES
(6, 'Java Basics', 'Introduction to Java programming'),
(7, 'Python Fundamentals', 'Python programming basics');

-- Insert Topics for Plays Subject (subject_id = 2)
INSERT INTO Topic (subject_id, topic_name, description) VALUES
(2, 'Romeo & Juliet', 'Shakespeares tragic love story'),
(2, 'Macbeth', 'Shakespeares Scottish tragedy'),
(2, 'Julius Caesar', 'Shakespeares Roman political drama'),
(2, 'The Crucible', 'Arthur Millers American classic');

-- Insert Topics for Algebra Subject (subject_id = 5)
INSERT INTO Topic (subject_id, topic_name, description) VALUES
(5, 'Linear Equations', 'Solving linear equations'),
(5, 'Quadratic Equations', 'Working with quadratics');

-- Insert Subtopics for Romeo & Juliet (topic_id = 1)
INSERT INTO Subtopic (topic_id, subtopic_name, description) VALUES
(1, 'Act 1', 'Introduction and meeting of Romeo and Juliet'),
(1, 'Act 2', 'The balcony scene and secret marriage'),
(1, 'Act 3', 'The turning point - Mercutio and Tybalts deaths'),
(1, 'Act 4', 'Juliets fake death'),
(1, 'Act 5', 'The tragic ending');

-- Insert Subtopics for Macbeth (topic_id = 2)
INSERT INTO Subtopic (topic_id, subtopic_name, description) VALUES
(2, 'Act 1', 'The witches prophecy'),
(2, 'Act 2', 'Duncan is murdered'),
(2, 'Act 3', 'Banquo is killed');

-- Insert Sections for Romeo & Juliet Act 3 (subtopic_id = 3)
INSERT INTO Section (subtopic_id, section_name, order_index, description) VALUES
(3, 'Scene 1', 1, 'The fight scene - Mercutio and Tybalt die'),
(3, 'Scene 2', 2, 'Juliet learns of Tybalts death'),
(3, 'Scene 3', 3, 'Romeo is banished'),
(3, 'Scene 4', 4, 'Paris asks to marry Juliet'),
(3, 'Scene 5', 5, 'Romeo and Juliet part');

-- Insert Question Pools
INSERT INTO QuestionPool (section_id, pool_name, description) VALUES
(1, 'Act 3 Scene 1 Questions', 'Questions about the fight scene'),
(2, 'Act 3 Scene 2 Questions', 'Questions about Juliets reaction'),
(3, 'Act 3 Scene 3 Questions', 'Questions about Romeos banishment');

-- Insert Demo Users
INSERT INTO User (email, password_hash, first_name, last_name, user_type) VALUES
('teacher@school.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Jane', 'Smith', 'teacher'),
('student@school.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'John', 'Doe', 'student'),
('admin@school.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Admin', 'User', 'admin');

-- Insert Questions for Romeo & Juliet Act 3 Scene 1
INSERT INTO Question (pool_id, question_type, question_text, difficulty_level, created_by_user_id, usage_count) VALUES
(1, 'multiple_choice', 'Who kills Mercutio in Act 3, Scene 1?', 1, 1, 15),
(1, 'multiple_choice', 'Why does Romeo fight Tybalt?', 2, 1, 12),
(1, 'true_false', 'Romeo initially refuses to fight Tybalt.', 1, 1, 20),
(1, 'short_answer', 'What is the significance of Mercutios dying words, "A plague o both your houses"?', 3, 1, 8),
(1, 'multiple_choice', 'What does the Prince decree as punishment for Romeo?', 2, 1, 18);

INSERT INTO Question (pool_id, question_type, question_text, difficulty_level, created_by_user_id, usage_count) VALUES
(2, 'multiple_choice', 'How does Juliet initially react when she hears that Romeo has killed Tybalt?', 2, 1, 10),
(2, 'true_false', 'Juliet immediately forgives Romeo for killing Tybalt.', 1, 1, 14),
(2, 'short_answer', 'Explain the conflict Juliet feels between her love for Romeo and her loyalty to her family.', 3, 1, 6);

-- Insert Multiple Choice Options
INSERT INTO MultipleChoiceOption (question_id, option_text, is_correct, option_order) VALUES
(1, 'Tybalt', 1, 1),
(1, 'Romeo', 0, 2),
(1, 'Benvolio', 0, 3),
(1, 'Paris', 0, 4);

INSERT INTO MultipleChoiceOption (question_id, option_text, is_correct, option_order) VALUES
(2, 'To avenge Mercutios death', 1, 1),
(2, 'Because Tybalt insulted him', 0, 2),
(2, 'To prove his bravery', 0, 3),
(2, 'Because Juliet asked him to', 0, 4);

INSERT INTO MultipleChoiceOption (question_id, option_text, is_correct, option_order) VALUES
(5, 'Death', 0, 1),
(5, 'Banishment from Verona', 1, 2),
(5, 'Imprisonment', 0, 3),
(5, 'A fine', 0, 4);

INSERT INTO MultipleChoiceOption (question_id, option_text, is_correct, option_order) VALUES
(6, 'She is angry and calls Romeo a villain', 1, 1),
(6, 'She immediately defends Romeo', 0, 2),
(6, 'She faints', 0, 3),
(6, 'She runs away', 0, 4);

-- Add more questions for variety
INSERT INTO Question (pool_id, question_type, question_text, difficulty_level, created_by_user_id, usage_count) VALUES
(1, 'multiple_choice', 'What is the setting of Act 3, Scene 1?', 1, 1, 25),
(1, 'true_false', 'Benvolio tries to prevent the fight between Mercutio and Tybalt.', 1, 1, 22),
(1, 'multiple_choice', 'What does Romeo call himself after killing Tybalt?', 2, 1, 11);

INSERT INTO MultipleChoiceOption (question_id, option_text, is_correct, option_order) VALUES
(9, 'A public square in Verona', 1, 1),
(9, 'The Capulet mansion', 0, 2),
(9, 'Friar Lawrences cell', 0, 3),
(9, 'Juliets balcony', 0, 4);

INSERT INTO MultipleChoiceOption (question_id, option_text, is_correct, option_order) VALUES
(11, 'Fortunes fool', 1, 1),
(11, 'A coward', 0, 2),
(11, 'A hero', 0, 3),
(11, 'A murderer', 0, 4);

-- Correct answers for True/False questions
UPDATE Question SET correct_answer = 'True' WHERE question_id = 3;
UPDATE Question SET correct_answer = 'False' WHERE question_id = 7;
UPDATE Question SET correct_answer = 'True' WHERE question_id = 10;

-- Add explanations for short answer questions
UPDATE Question SET explanation = 'Mercutio curses both families for their feud, which he sees as the cause of his death. This foreshadows the tragic consequences of the family conflict.' WHERE question_id = 4;
UPDATE Question SET explanation = 'Juliet experiences a profound internal conflict between her love for Romeo and her grief over her cousins death, showing the complexity of love and loyalty.' WHERE question_id = 8;

COMMIT;