// EduShare Backend API Server
// Node.js + Express + MySQL

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edushare',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log(' Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

// ============================================
// USER ENDPOINTS
// ============================================

// Get user profile
app.get('/api/user/profile', async (req, res) => {
    try {
        const userId = req.query.userId;
        
        const [rows] = await pool.query(
            'SELECT user_id, email, first_name, last_name, user_type, created_at, last_login FROM User WHERE user_id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ profile: rows[0] });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's courses
app.get('/api/user/courses', async (req, res) => {
    try {
        const userId = req.query.userId;
        
        // For demo, return all courses
        const [rows] = await pool.query(
            'SELECT c.course_id, c.course_name, c.description, cc.category_name FROM Course c JOIN CourseCategory cc ON c.category_id = cc.category_id WHERE c.is_active = TRUE'
        );
        
        res.json({ courses: rows });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// NEW RESTFUL HIERARCHY ENDPOINTS
// ============================================

// Get all course categories
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT category_id, category_name, description, is_active
            FROM CourseCategory
            WHERE is_active = TRUE
            ORDER BY category_name
        `);
        
        console.log('📚 Found categories:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get courses for a category
app.get('/api/categories/:categoryId/courses', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        
        console.log('📖 Fetching courses for category_id:', categoryId);
        
        const [rows] = await pool.query(`
            SELECT c.course_id, c.course_name, c.description, c.is_active, cc.category_name
            FROM Course c
            JOIN CourseCategory cc ON c.category_id = cc.category_id
            WHERE c.category_id = ? AND c.is_active = TRUE
            ORDER BY c.course_name
        `, [categoryId]);
        
        console.log('✅ Found courses:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// THIS IS THE ROUTE YOU NEEDED!
// Get subjects for a specific course
app.get('/api/courses/:courseId/subjects', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        console.log('📚 Fetching subjects for course_id:', courseId);
        
        const [rows] = await pool.query(`
            SELECT 
                s.subject_id,
                s.subject_name,
                s.description,
                s.is_active,
                COUNT(DISTINCT t.topic_id) as topic_count
            FROM Subject s
            LEFT JOIN Topic t ON s.subject_id = t.subject_id
            WHERE s.course_id = ? AND s.is_active = TRUE
            GROUP BY s.subject_id, s.subject_name, s.description, s.is_active
            ORDER BY s.subject_name
        `, [courseId]);
        
        console.log('✅ Found subjects:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching subjects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get topics for a specific subject
app.get('/api/subjects/:subjectId/topics', async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        
        console.log('📖 Fetching topics for subject_id:', subjectId);
        
        const [rows] = await pool.query(`
            SELECT 
                t.topic_id,
                t.topic_name,
                t.description,
                t.is_active,
                COUNT(DISTINCT st.subtopic_id) as subtopic_count
            FROM Topic t
            LEFT JOIN Subtopic st ON t.topic_id = st.topic_id
            WHERE t.subject_id = ? AND t.is_active = TRUE
            GROUP BY t.topic_id, t.topic_name, t.description, t.is_active
            ORDER BY t.topic_name
        `, [subjectId]);
        
        console.log('✅ Found topics:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching topics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get subtopics for a specific topic
app.get('/api/topics/:topicId/subtopics', async (req, res) => {
    try {
        const topicId = req.params.topicId;
        
        console.log('📄 Fetching subtopics for topic_id:', topicId);
        
        const [rows] = await pool.query(`
            SELECT 
                st.subtopic_id,
                st.subtopic_name,
                st.description,
                st.is_active,
                COUNT(DISTINCT sec.section_id) as section_count
            FROM Subtopic st
            LEFT JOIN Section sec ON st.subtopic_id = sec.subtopic_id
            WHERE st.topic_id = ? AND st.is_active = TRUE
            GROUP BY st.subtopic_id, st.subtopic_name, st.description, st.is_active
            ORDER BY st.subtopic_name
        `, [topicId]);
        
        console.log('✅ Found subtopics:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching subtopics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sections for a specific subtopic
app.get('/api/subtopics/:subtopicId/sections', async (req, res) => {
    try {
        const subtopicId = req.params.subtopicId;
        
        console.log('📃 Fetching sections for subtopic_id:', subtopicId);
        
        const [rows] = await pool.query(`
            SELECT 
                sec.section_id,
                sec.section_name,
                sec.description,
                sec.order_index,
                COUNT(DISTINCT qp.pool_id) as pool_count
            FROM Section sec
            LEFT JOIN QuestionPool qp ON sec.section_id = qp.section_id
            WHERE sec.subtopic_id = ?
            GROUP BY sec.section_id, sec.section_name, sec.description, sec.order_index
            ORDER BY sec.order_index
        `, [subtopicId]);
        
        console.log('✅ Found sections:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching sections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get question pools for a specific section
app.get('/api/sections/:sectionId/pools', async (req, res) => {
    try {
        const sectionId = req.params.sectionId;
        
        console.log('🎯 Fetching question pools for section_id:', sectionId);
        
        const [rows] = await pool.query(`
            SELECT 
                qp.pool_id,
                qp.pool_name,
                qp.description,
                COUNT(DISTINCT q.question_id) as question_count
            FROM QuestionPool qp
            LEFT JOIN Question q ON qp.pool_id = q.pool_id
            WHERE qp.section_id = ?
            GROUP BY qp.pool_id, qp.pool_name, qp.description
            ORDER BY qp.pool_name
        `, [sectionId]);
        
        console.log('✅ Found question pools:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error fetching question pools:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get questions for a specific pool
app.get('/api/pools/:poolId/questions', async (req, res) => {
    try {
        const poolId = req.params.poolId;
        
        console.log('❓ Fetching questions for pool_id:', poolId);
        
        // Get all questions
        const [questions] = await pool.query(`
            SELECT 
                q.question_id,
                q.question_type,
                q.question_text,
                q.correct_answer,
                q.explanation,
                q.difficulty_level,
                q.created_by_user_id,
                q.is_ai_generated,
                q.created_at,
                q.usage_count,
                u.first_name,
                u.last_name
            FROM Question q
            LEFT JOIN User u ON q.created_by_user_id = u.user_id
            WHERE q.pool_id = ?
            ORDER BY q.created_at DESC
        `, [poolId]);
        
        // For each multiple choice question, get its options
        for (let question of questions) {
            if (question.question_type === 'multiple_choice') {
                const [options] = await pool.query(`
                    SELECT 
                        option_id,
                        option_text,
                        is_correct,
                        option_order
                    FROM MultipleChoiceOption
                    WHERE question_id = ?
                    ORDER BY option_order
                `, [question.question_id]);
                
                question.options = options;
            }
        }
        
        console.log('✅ Found questions:', questions.length);
        res.json(questions);
    } catch (error) {
        console.error('❌ Error fetching questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// ORIGINAL QUERY PARAMETER ENDPOINTS
// (Keeping for backward compatibility)
// ============================================

// Get subjects (optionally filtered by course)
app.get('/api/subjects', async (req, res) => {
    try {
        const { userId, courseCategory, courseCode } = req.query;
        
        let query = `
            SELECT s.subject_id, s.subject_name, s.description, s.course_id
            FROM Subject s
            JOIN Course c ON s.course_id = c.course_id
            WHERE s.is_active = TRUE
        `;
        
        const params = [];
        
        if (courseCode) {
            query += ' AND c.course_name = ?';
            params.push(courseCode);
        } else if (courseCategory) {
            query += ` AND c.category_id = (
                SELECT category_id FROM CourseCategory WHERE category_name = ?
            )`;
            params.push(courseCategory);
        }
        
        const [rows] = await pool.query(query, params);
        res.json({ subjects: rows });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get topics for a subject
app.get('/api/topics', async (req, res) => {
    try {
        const subjectId = req.query.subjectId;
        
        const [rows] = await pool.query(
            'SELECT topic_id, topic_name, description FROM Topic WHERE subject_id = ? AND is_active = TRUE',
            [subjectId]
        );
        
        res.json({ topics: rows });
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get subtopics for a topic
app.get('/api/subtopics', async (req, res) => {
    try {
        const topicId = req.query.topicId;
        
        const [rows] = await pool.query(
            'SELECT subtopic_id, subtopic_name, description FROM Subtopic WHERE topic_id = ? AND is_active = TRUE',
            [topicId]
        );
        
        res.json({ subtopics: rows });
    } catch (error) {
        console.error('Error fetching subtopics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sections for a subtopic
app.get('/api/sections', async (req, res) => {
    try {
        const subtopicId = req.query.subtopicId;
        
        const [rows] = await pool.query(
            'SELECT section_id, section_name, description, order_index FROM Section WHERE subtopic_id = ? ORDER BY order_index',
            [subtopicId]
        );
        
        res.json({ sections: rows });
    } catch (error) {
        console.error('Error fetching sections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// QUESTION ENDPOINTS
// ============================================

// Get questions for a section
app.get('/api/questions', async (req, res) => {
    try {
        const sectionId = req.query.sectionId;
        
        // Get questions through QuestionPool
        const [questions] = await pool.query(`
            SELECT 
                q.question_id,
                q.question_type,
                q.question_text,
                q.correct_answer,
                q.explanation,
                q.difficulty_level,
                q.usage_count,
                q.is_ai_generated
            FROM Question q
            JOIN QuestionPool qp ON q.pool_id = qp.pool_id
            WHERE qp.section_id = ?
            ORDER BY q.question_id
        `, [sectionId]);
        
        // Get multiple choice options for each question
        for (let question of questions) {
            if (question.question_type === 'multiple_choice') {
                const [options] = await pool.query(
                    'SELECT option_id, option_text, is_correct, option_order FROM MultipleChoiceOption WHERE question_id = ? ORDER BY option_order',
                    [question.question_id]
                );
                question.options = options;
            }
        }
        
        res.json({ questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new question
app.post('/api/questions', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            poolId,
            questionType,
            questionText,
            correctAnswer,
            explanation,
            difficultyLevel,
            userId,
            options
        } = req.body;
        
        // Insert question
        const [result] = await connection.query(
            `INSERT INTO Question 
            (pool_id, question_type, question_text, correct_answer, explanation, difficulty_level, created_by_user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [poolId, questionType, questionText, correctAnswer, explanation, difficultyLevel || 1, userId]
        );
        
        const questionId = result.insertId;
        
        // Insert multiple choice options if applicable
        if (questionType === 'multiple_choice' && options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                await connection.query(
                    'INSERT INTO MultipleChoiceOption (question_id, option_text, is_correct, option_order) VALUES (?, ?, ?, ?)',
                    [questionId, options[i].text, options[i].is_correct, i + 1]
                );
            }
        }
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            questionId,
            message: 'Question created successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating question:', error);
        res.status(500).json({ error: 'Failed to create question' });
    } finally {
        connection.release();
    }
});

// Delete a question
app.delete('/api/questions/:questionId', async (req, res) => {
    try {
        const questionId = req.params.questionId;
        
        await pool.query('DELETE FROM Question WHERE question_id = ?', [questionId]);
        
        res.json({ 
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// Vote on a question (upvote/downvote)
app.post('/api/questions/vote', async (req, res) => {
    try {
        const { questionId, voteType } = req.body;
        
        // For demo purposes, just increment usage_count
        if (voteType === 'up') {
            await pool.query(
                'UPDATE Question SET usage_count = usage_count + 1 WHERE question_id = ?',
                [questionId]
            );
        }
        
        res.json({ 
            success: true,
            message: 'Vote recorded'
        });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// ============================================
// AUTH ENDPOINTS
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await pool.query(
            'SELECT user_id, email, first_name, last_name, user_type FROM User WHERE email = ? AND is_active = TRUE',
            [email]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // In production, verify password hash here
        // For demo, accept any password
        
        // Update last login
        await pool.query(
            'UPDATE User SET last_login = NOW() WHERE user_id = ?',
            [rows[0].user_id]
        );
        
        res.json({
            success: true,
            user: rows[0],
            token: 'demo_token_' + rows[0].user_id
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
    res.json({ success: true });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'EduShare API is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🎓 EduShare API Server Running!         ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log('');
    console.log('🧪 Test endpoints:');
    console.log(`   http://localhost:${PORT}/api/health`);
    console.log(`   http://localhost:${PORT}/api/courses/2/subjects`);
    console.log('');
    console.log('💡 Press Ctrl+C to stop the server');
    console.log('');
});

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database pool...');
    await pool.end();
    process.exit(0);
});