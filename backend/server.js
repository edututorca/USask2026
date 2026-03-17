const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const aiRoutes = require('./ai-routes');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'EduShare API is running!' });
});

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, displayName, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, displayName, role || 'teacher']
        );
        res.json({ success: true, userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = users[0];

        // Support both bcrypt-hashed and plain-text passwords (for demo accounts)
        let validPassword = false;
        if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
            validPassword = await bcrypt.compare(password, user.password_hash);
        } else {
            validPassword = (password === user.password_hash);
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const nameParts = (user.display_name || 'Teacher').split(' ');

        res.json({
            success: true,
            userId: user.id,
            userType: user.role,
            email: user.email,
            firstName: nameParts[0] || 'Teacher',
            lastName: nameParts.slice(1).join(' ') || '',
            user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ============ USER PROFILE ROUTES ============

// Get user profile
app.get('/api/user/profile', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const [profiles] = await db.execute(
            `SELECT up.*, u.email, u.display_name, u.role
             FROM user_profiles up
             JOIN users u ON up.user_id = u.id
             WHERE up.user_id = ?`,
            [userId]
        );

        if (profiles.length === 0) {
            // Return basic user info if no profile exists yet
            const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
            if (users.length === 0) return res.status(404).json({ error: 'User not found' });
            return res.json({ user_id: users[0].id, email: users[0].email, display_name: users[0].display_name, role: users[0].role });
        }

        res.json(profiles[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create/update user profile
app.post('/api/user/profile', async (req, res) => {
    try {
        const { userId, firstName, lastName, phone, street, city, province, postalCode, school, schoolCity, schoolCountry, subjects, grade, interests } = req.body;

        if (!userId || !firstName || !lastName) {
            return res.status(400).json({ error: 'userId, firstName, and lastName are required' });
        }

        // Upsert — insert or update if exists
        const [existing] = await db.execute('SELECT id FROM user_profiles WHERE user_id = ?', [userId]);

        if (existing.length > 0) {
            await db.execute(
                `UPDATE user_profiles SET first_name=?, last_name=?, phone=?, street=?, city=?, province=?,
                 postal_code=?, school=?, school_city=?, school_country=?, subjects=?, grade=?, interests=?
                 WHERE user_id=?`,
                [firstName, lastName, phone, street, city, province, postalCode, school, schoolCity, schoolCountry, subjects, grade, interests, userId]
            );
        } else {
            await db.execute(
                `INSERT INTO user_profiles (user_id, first_name, last_name, phone, street, city, province,
                 postal_code, school, school_city, school_country, subjects, grade, interests)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, firstName, lastName, phone, street, city, province, postalCode, school, schoolCity, schoolCountry, subjects, grade, interests]
            );
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ SUBJECTS ROUTES ============

app.get('/api/subjects', async (req, res) => {
    try {
        const [subjects] = await db.execute('SELECT * FROM subjects ORDER BY name');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ COURSES ROUTE (uses subjects) ============

app.get('/api/courses', async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT id AS CourseID, name AS CourseName, name AS SubjectName FROM subjects ORDER BY name"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ USER COURSES ROUTES ============

// Get user's courses (for sidebar)
app.get('/api/user-courses', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const [courses] = await db.execute(
            `SELECT uc.*, s.name as subject_name
             FROM user_courses uc
             JOIN subjects s ON uc.subject_id = s.id
             WHERE uc.user_id = ?
             ORDER BY s.name, uc.course_code, uc.section`,
            [userId]
        );
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a course for user
app.post('/api/user-courses', async (req, res) => {
    try {
        const { userId, subjectId, courseCode, section, nickname } = req.body;
        if (!userId || !subjectId || !courseCode) {
            return res.status(400).json({ error: 'userId, subjectId, and courseCode are required' });
        }

        const [result] = await db.execute(
            'INSERT INTO user_courses (user_id, subject_id, course_code, section, nickname) VALUES (?, ?, ?, ?, ?)',
            [userId, subjectId, courseCode, section || null, nickname || null]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'This course and section already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete a user course
app.delete('/api/user-courses/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM user_courses WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ COURSE CODES ROUTES ============

// Get Ontario course codes (reference table, for Add Course search)
app.get('/api/course-codes', async (req, res) => {
    try {
        const { search, subjectArea, grade } = req.query;
        let query = 'SELECT * FROM course_codes WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (code LIKE ? OR name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (subjectArea) {
            query += ' AND subject_area = ?';
            params.push(subjectArea);
        }
        if (grade) {
            query += ' AND grade = ?';
            params.push(grade);
        }

        query += ' ORDER BY code';
        const [codes] = await db.execute(query, params);
        res.json(codes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ HIERARCHY ROUTES ============

// Get nodes (children of a parent, or top-level for a subject)
app.get('/api/hierarchy/nodes', async (req, res) => {
    try {
        const { subjectId, parentId } = req.query;

        if (!subjectId) {
            return res.status(400).json({ error: 'subjectId is required' });
        }

        let query, params;

        if (parentId) {
            // Get children of a specific node
            query = `SELECT * FROM hierarchy_nodes WHERE subject_id = ? AND parent_id = ? ORDER BY sort_order, name`;
            params = [subjectId, parentId];
        } else {
            // Get top-level nodes (categories) for a subject
            query = `SELECT * FROM hierarchy_nodes WHERE subject_id = ? AND parent_id IS NULL ORDER BY sort_order, name`;
            params = [subjectId];
        }

        const [nodes] = await db.execute(query, params);
        res.json(nodes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single node with its full path (breadcrumb)
app.get('/api/hierarchy/nodes/:id', async (req, res) => {
    try {
        const [nodes] = await db.execute('SELECT * FROM hierarchy_nodes WHERE id = ?', [req.params.id]);
        if (nodes.length === 0) return res.status(404).json({ error: 'Node not found' });

        const node = nodes[0];

        // Build breadcrumb path using recursive CTE
        const [path] = await db.execute(`
            WITH RECURSIVE path AS (
                SELECT id, parent_id, name, label, depth
                FROM hierarchy_nodes WHERE id = ?
                UNION ALL
                SELECT h.id, h.parent_id, h.name, h.label, h.depth
                FROM hierarchy_nodes h
                JOIN path p ON h.id = p.parent_id
            )
            SELECT * FROM path ORDER BY depth ASC
        `, [req.params.id]);

        res.json({ ...node, breadcrumb: path });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all descendants of a node (for question filtering)
app.get('/api/hierarchy/nodes/:id/descendants', async (req, res) => {
    try {
        const [descendants] = await db.execute(`
            WITH RECURSIVE tree AS (
                SELECT id FROM hierarchy_nodes WHERE id = ?
                UNION ALL
                SELECT h.id FROM hierarchy_nodes h
                JOIN tree t ON h.parent_id = t.id
            )
            SELECT id FROM tree
        `, [req.params.id]);

        res.json(descendants.map(d => d.id));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new node
app.post('/api/hierarchy/nodes', async (req, res) => {
    try {
        const { subjectId, parentId, name, label, description, createdBy } = req.body;

        if (!subjectId || !name) {
            return res.status(400).json({ error: 'subjectId and name are required' });
        }

        // Calculate depth from parent
        let depth = 0;
        if (parentId) {
            const [parent] = await db.execute('SELECT depth FROM hierarchy_nodes WHERE id = ?', [parentId]);
            if (parent.length === 0) return res.status(400).json({ error: 'Parent node not found' });
            depth = parent[0].depth + 1;
        }

        // Get next sort_order among siblings
        let sortQuery, sortParams;
        if (parentId) {
            sortQuery = 'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM hierarchy_nodes WHERE parent_id = ?';
            sortParams = [parentId];
        } else {
            sortQuery = 'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM hierarchy_nodes WHERE subject_id = ? AND parent_id IS NULL';
            sortParams = [subjectId];
        }
        const [orderResult] = await db.execute(sortQuery, sortParams);
        const sortOrder = orderResult[0].next_order;

        const [result] = await db.execute(
            `INSERT INTO hierarchy_nodes (subject_id, parent_id, name, label, description, depth, sort_order, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [subjectId, parentId || null, name, label || 'Level', description || null, depth, sortOrder, createdBy || null]
        );

        // Return the created node
        const [created] = await db.execute('SELECT * FROM hierarchy_nodes WHERE id = ?', [result.insertId]);
        res.json({ success: true, node: created[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a node (cascades to children)
app.delete('/api/hierarchy/nodes/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM hierarchy_nodes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ DASHBOARD ROUTES ============

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const userId = req.query.userId || 1;

        const [subjectRows] = await db.execute("SELECT COUNT(*) AS total FROM subjects");
        const [quizRows] = await db.execute(
            "SELECT COUNT(*) AS total FROM quizzes WHERE user_id = ?", [userId]
        );
        const [questionRows] = await db.execute(
            "SELECT COUNT(*) AS total FROM questions WHERE user_id = ?", [userId]
        );
        const [userRows] = await db.execute(
            "SELECT display_name FROM users WHERE id = ?", [userId]
        );

        const displayName = userRows.length > 0 ? userRows[0].display_name : "Teacher";
        const firstName = displayName ? displayName.split(" ")[0] : "Teacher";

        res.json({
            totalCourses: subjectRows[0].total,
            totalQuizzes: quizRows[0].total,
            totalQuestions: questionRows[0].total,
            experiencePoints: 142,
            firstName: firstName
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ QUESTIONS ROUTES ============

// Get all questions (with optional filters — now supports node_id)
app.get('/api/questions', async (req, res) => {
    try {
        const { userId, subjectId, grade, nodeId } = req.query;
        let query = `
            SELECT q.*, s.name as subject_name
            FROM questions q
            LEFT JOIN subjects s ON q.subject_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (userId) {
            query += ' AND q.user_id = ?';
            params.push(userId);
        }
        if (subjectId) {
            query += ' AND q.subject_id = ?';
            params.push(subjectId);
        }
        if (grade) {
            query += ' AND q.grade = ?';
            params.push(grade);
        }
        if (nodeId) {
            // Get this node and all its descendants, then filter questions
            query += ` AND q.node_id IN (
                WITH RECURSIVE tree AS (
                    SELECT id FROM hierarchy_nodes WHERE id = ?
                    UNION ALL
                    SELECT h.id FROM hierarchy_nodes h
                    JOIN tree t ON h.parent_id = t.id
                )
                SELECT id FROM tree
            )`;
            params.push(nodeId);
        }

        query += ' ORDER BY q.created_at DESC';

        const [questions] = await db.execute(query, params);

        // Load options from question_options table for each question
        for (const q of questions) {
            const [options] = await db.execute(
                'SELECT * FROM question_options WHERE question_id = ? ORDER BY sort_order',
                [q.id]
            );
            // If question has options in the new table, use those
            // Otherwise fall back to inline option_a-d
            if (options.length > 0) {
                q.options = options;
            }
        }

        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create question (now supports node_id and question_options)
app.post('/api/questions', async (req, res) => {
    try {
        const { userId, subjectId, grade, topic, nodeId, questionText, questionType,
                optionA, optionB, optionC, optionD, correctAnswer, difficulty, options } = req.body;

        const [result] = await db.execute(
            `INSERT INTO questions (user_id, subject_id, grade, topic, node_id, question_text, question_type,
             option_a, option_b, option_c, option_d, correct_answer, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, subjectId, grade, topic || null, nodeId || null, questionText, questionType,
             optionA || null, optionB || null, optionC || null, optionD || null, correctAnswer || null, difficulty || 'medium']
        );

        const questionId = result.insertId;

        // If options array provided, save to question_options table
        if (options && Array.isArray(options) && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                await db.execute(
                    'INSERT INTO question_options (question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?)',
                    [questionId, opt.text || opt.option_text, opt.isCorrect || opt.is_correct ? 1 : 0, i]
                );
            }
        }

        res.json({ success: true, questionId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete question
app.delete('/api/questions/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM questions WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ QUIZZES ROUTES ============

// Get user's quizzes (with full question details)
app.get('/api/quizzes', async (req, res) => {
    try {
        const { userId } = req.query;
        let query = `
            SELECT qz.*, s.name as subject_name,
                   (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = qz.id) as question_count,
                   (SELECT COALESCE(SUM(point_value), 0) FROM quiz_questions WHERE quiz_id = qz.id) as total_points
            FROM quizzes qz
            LEFT JOIN subjects s ON qz.subject_id = s.id
        `;
        const params = [];

        if (userId) {
            query += ' WHERE qz.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY qz.created_at DESC';

        const [quizzes] = await db.execute(query, params);

        // Load questions for each quiz
        for (const quiz of quizzes) {
            const [questions] = await db.execute(
                `SELECT q.*, qq.question_order, qq.point_value, qq.answer_space_lines
                 FROM quiz_questions qq
                 JOIN questions q ON qq.question_id = q.id
                 WHERE qq.quiz_id = ?
                 ORDER BY qq.question_order`,
                [quiz.id]
            );
            quiz.questions = questions;
        }

        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recent quizzes
app.get('/api/quizzes/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const userId = req.query.userId;

        let query = `
            SELECT qz.*, s.name as subject_name,
                   (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = qz.id) as question_count
            FROM quizzes qz
            LEFT JOIN subjects s ON qz.subject_id = s.id
        `;
        const params = [];

        if (userId) {
            query += ' WHERE qz.user_id = ?';
            params.push(userId);
        }

        query += ` ORDER BY qz.created_at DESC LIMIT ${limit}`;

        const [quizzes] = await db.execute(query, params);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get community (public) quizzes
app.get('/api/quizzes/community', async (req, res) => {
    try {
        const [quizzes] = await db.execute(`
            SELECT qz.*, s.name as subject_name,
                   (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = qz.id) as question_count,
                   (SELECT COALESCE(SUM(point_value), 0) FROM quiz_questions WHERE quiz_id = qz.id) as total_points,
                   u.display_name as creator_name
            FROM quizzes qz
            LEFT JOIN subjects s ON qz.subject_id = s.id
            LEFT JOIN users u ON qz.user_id = u.id
            WHERE qz.is_public = 1
            ORDER BY qz.created_at DESC
        `);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single quiz with questions (MUST be before /:id to not conflict)
app.get('/api/quizzes/:id', async (req, res) => {
    try {
        const [quizzes] = await db.execute(
            `SELECT qz.*, s.name as subject_name
             FROM quizzes qz
             LEFT JOIN subjects s ON qz.subject_id = s.id
             WHERE qz.id = ?`,
            [req.params.id]
        );

        if (quizzes.length === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        const [questions] = await db.execute(
            `SELECT q.*, qq.question_order, qq.point_value, qq.answer_space_lines
             FROM quiz_questions qq
             JOIN questions q ON qq.question_id = q.id
             WHERE qq.quiz_id = ?
             ORDER BY qq.question_order`,
            [req.params.id]
        );

        res.json({ ...quizzes[0], questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create quiz (supports both /api/quizzes and /api/quizzes/create)
app.post('/api/quizzes', async (req, res) => {
    try {
        const { userId, title, description, subjectId, grade, quizName, courseId } = req.body;
        const [result] = await db.execute(
            'INSERT INTO quizzes (user_id, title, description, subject_id, grade) VALUES (?, ?, ?, ?, ?)',
            [userId || 1, title || quizName, description, subjectId || courseId, grade]
        );
        res.json({ success: true, quizId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/quizzes/create', async (req, res) => {
    try {
        const { userId, title, description, subjectId, grade, quizName, courseId } = req.body;
        const [result] = await db.execute(
            'INSERT INTO quizzes (user_id, title, description, subject_id, grade) VALUES (?, ?, ?, ?, ?)',
            [userId || 1, title || quizName, description, subjectId || courseId, grade]
        );
        res.json({ success: true, quizId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update quiz (save questions, reorder, change point values)
app.put('/api/quizzes/:id', async (req, res) => {
    try {
        const quizId = req.params.id;
        const { title, description, is_public, questions } = req.body;

        // Update quiz metadata if provided
        if (title || description !== undefined || is_public !== undefined) {
            const updates = [];
            const params = [];
            if (title) { updates.push("title = ?"); params.push(title); }
            if (description !== undefined) { updates.push("description = ?"); params.push(description); }
            if (is_public !== undefined) { updates.push("is_public = ?"); params.push(is_public ? 1 : 0); }
            params.push(quizId);

            if (updates.length > 0) {
                await db.execute(`UPDATE quizzes SET ${updates.join(", ")} WHERE id = ?`, params);
            }
        }

        // Update questions if provided
        if (questions && Array.isArray(questions)) {
            await db.execute("DELETE FROM quiz_questions WHERE quiz_id = ?", [quizId]);

            for (const q of questions) {
                await db.execute(
                    `INSERT INTO quiz_questions (quiz_id, question_id, question_order, point_value, answer_space_lines)
                     VALUES (?, ?, ?, ?, ?)`,
                    [quizId, q.id || q.QuestionID, q.question_order || q.OrderNumber || 1, q.point_value || q.PointValue || 1, q.answer_space_lines || q.AnswerSpaceLines || 5]
                );
            }
        }

        res.json({ success: true, message: "Quiz updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Duplicate quiz
app.post('/api/quizzes/:id/duplicate', async (req, res) => {
    try {
        const quizId = req.params.id;

        const [original] = await db.execute("SELECT * FROM quizzes WHERE id = ?", [quizId]);
        if (original.length === 0) return res.status(404).json({ error: "Quiz not found" });

        const quiz = original[0];
        const [result] = await db.execute(
            'INSERT INTO quizzes (user_id, title, description, subject_id, grade, is_public) VALUES (?, ?, ?, ?, ?, 0)',
            [quiz.user_id, `${quiz.title} (Copy)`, quiz.description, quiz.subject_id, quiz.grade]
        );

        const newQuizId = result.insertId;
        const [questions] = await db.execute("SELECT * FROM quiz_questions WHERE quiz_id = ?", [quizId]);

        for (const q of questions) {
            await db.execute(
                'INSERT INTO quiz_questions (quiz_id, question_id, question_order, point_value, answer_space_lines) VALUES (?, ?, ?, ?, ?)',
                [newQuizId, q.question_id, q.question_order, q.point_value, q.answer_space_lines]
            );
        }

        res.json({ success: true, quizId: newQuizId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add question to quiz
app.post('/api/quizzes/:id/questions', async (req, res) => {
    try {
        const { questionId } = req.body;
        const [orderResult] = await db.execute(
            'SELECT COALESCE(MAX(question_order), 0) + 1 as nextOrder FROM quiz_questions WHERE quiz_id = ?',
            [req.params.id]
        );
        await db.execute(
            'INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (?, ?, ?)',
            [req.params.id, questionId, orderResult[0].nextOrder]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove question from quiz
app.delete('/api/quizzes/:quizId/questions/:questionId', async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM quiz_questions WHERE quiz_id = ? AND question_id = ?',
            [req.params.quizId, req.params.questionId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete quiz
app.delete('/api/quizzes/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ TOPIC ROUTES ============

app.get('/api/topics', async (req, res) => {
    try {
        const { subjectId } = req.query;
        let query = 'SELECT DISTINCT topic FROM questions WHERE topic IS NOT NULL AND topic != ""';
        const params = [];

        if (subjectId) {
            query += ' AND subject_id = ?';
            params.push(subjectId);
        }

        query += ' ORDER BY topic';
        const [topics] = await db.execute(query, params);
        res.json(topics.map(t => ({ name: t.topic })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/grades', async (req, res) => {
    try {
        const [grades] = await db.execute(
            'SELECT DISTINCT grade FROM questions WHERE grade IS NOT NULL ORDER BY grade'
        );
        res.json(grades.map(g => ({ grade: g.grade })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ START SERVER ============

const PORT = process.env.PORT || 3000;
app.use('/api/ai', aiRoutes);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test it: http://localhost:${PORT}`);
});