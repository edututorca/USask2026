-- ===================================================== --
-- ========== EDUSHARE DATABASE SCHEMA (UPDATED) ======= --
-- ===================================================== --
-- Based on your latest ERD diagram
-- Recommended: MySQL 8.0+ or PostgreSQL 13+

CREATE DATABASE IF NOT EXISTS edushare_db;
USE edushare_db;

-- ============= USER TABLES ============= --

CREATE TABLE UserDiagram (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    UserType ENUM('Student', 'Teacher', 'Admin') NOT NULL,
    UserEmail VARCHAR(255) NOT NULL UNIQUE,
    UserPassword VARCHAR(255) NOT NULL,
    ExperiencePoints INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (UserEmail),
    INDEX idx_type (UserType)
);

CREATE TABLE UserProfile (
    ProfileID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(20),
    Address TEXT,
    City VARCHAR(100),
    Province VARCHAR(100),
    PostalCode VARCHAR(20),
    School VARCHAR(255),
    SchoolCity VARCHAR(100),
    SchoolCountry VARCHAR(100),
    Subjects TEXT,
    Grade VARCHAR(50),
    Interests TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES UserDiagram(UserID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_profile (UserID),
    INDEX idx_user (UserID)
);

-- ============= SUBJECT/TOPIC HIERARCHY ============= --

CREATE TABLE Subject (
    SubjectID INT AUTO_INCREMENT PRIMARY KEY,
    SubjectName VARCHAR(255) NOT NULL UNIQUE,
    SubjectDescription TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (SubjectName)
);

CREATE TABLE Topic (
    TopicID INT AUTO_INCREMENT PRIMARY KEY,
    SubjectID INT NOT NULL,
    TopicName VARCHAR(255) NOT NULL,
    TopicDescription TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SubjectID) REFERENCES Subject(SubjectID) ON DELETE CASCADE,
    INDEX idx_subject (SubjectID),
    INDEX idx_name (TopicName)
);

CREATE TABLE SubTopic (
    SubTopicID INT AUTO_INCREMENT PRIMARY KEY,
    TopicID INT NOT NULL,
    SubTopicName VARCHAR(255) NOT NULL,
    SubTopicDescription TEXT,
    OrderNumber INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TopicID) REFERENCES Topic(TopicID) ON DELETE CASCADE,
    INDEX idx_topic (TopicID),
    INDEX idx_name (SubTopicName),
    INDEX idx_order (OrderNumber)
);

CREATE TABLE Section (
    SectionID INT AUTO_INCREMENT PRIMARY KEY,
    SubTopicID INT NOT NULL,
    SectionName VARCHAR(255) NOT NULL,
    SectionDescription TEXT,
    OrderNumber INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SubTopicID) REFERENCES SubTopic(SubTopicID) ON DELETE CASCADE,
    INDEX idx_subtopic (SubTopicID),
    INDEX idx_name (SectionName),
    INDEX idx_order (OrderNumber)
);

-- ============= COURSE TABLES ============= --

CREATE TABLE Course (
    CourseID INT AUTO_INCREMENT PRIMARY KEY,
    CourseName VARCHAR(255) NOT NULL,
    CourseDescription TEXT,
    SubjectID INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SubjectID) REFERENCES Subject(SubjectID) ON DELETE SET NULL,
    INDEX idx_subject (SubjectID),
    INDEX idx_name (CourseName)
);

CREATE TABLE UserCourse (
    UserCourseID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    CourseID INT NOT NULL,
    EnrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES UserDiagram(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (UserID, CourseID),
    INDEX idx_user (UserID),
    INDEX idx_course (CourseID)
);

-- ============= QUESTION POOL TABLE ============= --

CREATE TABLE QuestionPool (
    QuestionID INT AUTO_INCREMENT PRIMARY KEY,
    SectionID INT NOT NULL,
    QuestionText TEXT NOT NULL,
    QuestionType ENUM('Multiple Choice', 'True/False', 'Short Answer') NOT NULL,
    Difficulty INT DEFAULT 1 CHECK (Difficulty BETWEEN 1 AND 5),
    StandardID VARCHAR(50),
    Upvotes INT DEFAULT 0,
    Downvotes INT DEFAULT 0,
    CreatedBy INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SectionID) REFERENCES Section(SectionID) ON DELETE CASCADE,
    FOREIGN KEY (CreatedBy) REFERENCES UserDiagram(UserID) ON DELETE SET NULL,
    INDEX idx_section (SectionID),
    INDEX idx_type (QuestionType),
    INDEX idx_difficulty (Difficulty),
    INDEX idx_created (CreatedAt),
    INDEX idx_votes (Upvotes, Downvotes)
);

CREATE TABLE QuestionOption (
    OptionID INT AUTO_INCREMENT PRIMARY KEY,
    QuestionID INT NOT NULL,
    OptionText TEXT NOT NULL,
    IsCorrect BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (QuestionID) REFERENCES QuestionPool(QuestionID) ON DELETE CASCADE,
    INDEX idx_question (QuestionID)
);

-- ============= USER INTERACTIONS ============= --

CREATE TABLE UserQuestion (
    UserQuestionID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    QuestionID INT NOT NULL,
    Vote BOOLEAN, -- TRUE = upvote, FALSE = downvote, NULL = no vote
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES UserDiagram(UserID) ON DELETE CASCADE,
    FOREIGN KEY (QuestionID) REFERENCES QuestionPool(QuestionID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_question (UserID, QuestionID),
    INDEX idx_user (UserID),
    INDEX idx_question (QuestionID),
    INDEX idx_vote (Vote)
);

-- ============= INSERT SAMPLE DATA ============= --

-- Sample Subjects
INSERT INTO Subject (SubjectName, SubjectDescription) VALUES
('Plays', 'Classic and contemporary theatrical works'),
('Novel', 'Full-length fiction works'),
('Grammar', 'English grammar and composition'),
('Project', 'Project-based learning activities'),
('Speech', 'Public speaking and presentation skills');

-- Get Subject IDs
SET @playsID = (SELECT SubjectID FROM Subject WHERE SubjectName = 'Plays');
SET @novelID = (SELECT SubjectID FROM Subject WHERE SubjectName = 'Novel');

-- Sample Topics (Plays)
INSERT INTO Topic (SubjectID, TopicName, TopicDescription) VALUES
(@playsID, 'Romeo & Juliet', 'Shakespeare''s tragic tale of star-crossed lovers'),
(@playsID, 'Julius Caesar', 'Shakespeare''s political drama'),
(@playsID, 'Macbeth', 'Shakespeare''s tragedy of ambition'),
(@playsID, 'The Crucible', 'Arthur Miller''s drama about the Salem witch trials');

-- Sample Topics (Novels)
INSERT INTO Topic (SubjectID, TopicName, TopicDescription) VALUES
(@novelID, 'To Kill a Mockingbird', 'Harper Lee''s classic novel'),
(@novelID, 'The Great Gatsby', 'F. Scott Fitzgerald''s masterpiece');

-- Get Topic ID for Romeo & Juliet
SET @romeoID = (SELECT TopicID FROM Topic WHERE TopicName = 'Romeo & Juliet');

-- Sample SubTopics (Acts for Romeo & Juliet)
INSERT INTO SubTopic (TopicID, SubTopicName, OrderNumber) VALUES
(@romeoID, 'Act 1', 1),
(@romeoID, 'Act 2', 2),
(@romeoID, 'Act 3', 3),
(@romeoID, 'Act 4', 4),
(@romeoID, 'Act 5', 5);

-- Get SubTopic ID for Act 3
SET @act3ID = (SELECT SubTopicID FROM SubTopic WHERE TopicID = @romeoID AND SubTopicName = 'Act 3');

-- Sample Sections (Scenes for Act 3)
INSERT INTO Section (SubTopicID, SectionName, OrderNumber) VALUES
(@act3ID, 'Scene 1', 1),
(@act3ID, 'Scene 2', 2),
(@act3ID, 'Scene 3', 3),
(@act3ID, 'Scene 4', 4),
(@act3ID, 'Scene 5', 5);

-- Get Section ID for Scene 4
SET @scene4ID = (SELECT SectionID FROM Section WHERE SubTopicID = @act3ID AND SectionName = 'Scene 4');

-- Sample Teacher User
INSERT INTO UserDiagram (UserType, UserEmail, UserPassword, ExperiencePoints) 
VALUES ('Teacher', 'teacher@example.com', '$2b$10$dummyhashedpassword', 142);

SET @teacherID = LAST_INSERT_ID();

INSERT INTO UserProfile (UserID, FirstName, LastName, School, Subjects) 
VALUES (@teacherID, 'Daniel', 'Maia', 'Regina High School', 'English Literature');

-- Sample Course
INSERT INTO Course (CourseName, CourseDescription, SubjectID) VALUES
('English 9', 'Grade 9 English Literature', @playsID),
('Math 10', 'Grade 10 Mathematics', NULL),
('Science 11', 'Grade 11 Science', NULL);

-- Enroll teacher in courses
INSERT INTO UserCourse (UserID, CourseID) VALUES
(@teacherID, 1),
(@teacherID, 2),
(@teacherID, 3);

-- Sample Questions for Act 3, Scene 4
INSERT INTO QuestionPool (SectionID, QuestionText, QuestionType, Difficulty, StandardID, Upvotes, Downvotes, CreatedBy) VALUES
(@scene4ID, 'What does Capulet tell his wife to say to Juliet?', 'Multiple Choice', 1, 'ELA 9.1', 4, 0, @teacherID),
(@scene4ID, 'As Romeo is preparing to leave Juliet, what argument does she use to convince him to stay?', 'Short Answer', 2, 'ELA 9.1', 8, 0, @teacherID),
(@scene4ID, 'Tybalt and Mercutio fight because Mercutio seeks to protect Romeo''s honour.', 'True/False', 1, 'ELA 9.2', 10, 0, @teacherID),
(@scene4ID, 'When Lady Capulet threatens to send someone to Mantua to poison Romeo, what does Juliet say?', 'Multiple Choice', 1, 'ELA 9.1', 5, 0, @teacherID),
(@scene4ID, 'In Act 3, Scene 4, Capulet informs Paris of what?', 'Multiple Choice', 1, 'ELA 9.1', 5, 0, @teacherID);

-- Sample options for first multiple choice question
SET @q1ID = (SELECT QuestionID FROM QuestionPool WHERE QuestionText LIKE 'What does Capulet tell his wife%' LIMIT 1);

INSERT INTO QuestionOption (QuestionID, OptionText, IsCorrect) VALUES
(@q1ID, 'That she will marry Paris on Thursday', TRUE),
(@q1ID, 'That she must leave Verona immediately', FALSE),
(@q1ID, 'That Romeo has been banished', FALSE),
(@q1ID, 'That Tybalt''s funeral will be held tomorrow', FALSE);

-- Sample vote
INSERT INTO UserQuestion (UserID, QuestionID, Vote) 
VALUES (@teacherID, @q1ID, TRUE);

-- ============= USEFUL QUERIES ============= --

-- Get all questions for a specific section with vote counts
/*
SELECT 
    qp.QuestionID,
    qp.QuestionText,
    qp.QuestionType,
    qp.Difficulty,
    qp.StandardID,
    qp.Upvotes,
    qp.Downvotes,
    s.SectionName,
    st.SubTopicName,
    t.TopicName,
    sub.SubjectName
FROM QuestionPool qp
INNER JOIN Section s ON qp.SectionID = s.SectionID
INNER JOIN SubTopic st ON s.SubTopicID = st.SubTopicID
INNER JOIN Topic t ON st.TopicID = t.TopicID
INNER JOIN Subject sub ON t.SubjectID = sub.SubjectID
WHERE qp.SectionID = 1
ORDER BY qp.Upvotes DESC, qp.CreatedAt DESC;
*/

-- Get user's courses
/*
SELECT 
    c.CourseID,
    c.CourseName,
    c.CourseDescription,
    s.SubjectName,
    uc.EnrolledAt
FROM UserCourse uc
INNER JOIN Course c ON uc.CourseID = c.CourseID
LEFT JOIN Subject s ON c.SubjectID = s.SubjectID
WHERE uc.UserID = 1
ORDER BY uc.EnrolledAt DESC;
*/

-- Get topics for a subject
/*
SELECT 
    TopicID,
    TopicName,
    TopicDescription
FROM Topic
WHERE SubjectID = 1
ORDER BY TopicName;
*/