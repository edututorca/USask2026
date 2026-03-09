const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// ============================================================
// GET /api/quizzes - Get all quizzes for a user (or all)
// ============================================================
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId;

        let query = `
            SELECT 
                q.QuizID, q.QuizName, q.QuizDescription, q.Status,
                q.CreatedAt, q.UpdatedAt, q.CourseID, q.CreatedBy,
                c.CourseName, c.CourseCode,
                COUNT(qq.QuizQuestionID) AS QuestionCount,
                COALESCE(SUM(qq.PointValue), 0) AS TotalPoints
            FROM Quiz q
            LEFT JOIN Course c ON q.CourseID = c.CourseID
            LEFT JOIN QuizQuestion qq ON q.QuizID = qq.QuizID
        `;
        const params = [];

        if (userId) {
            query += " WHERE q.CreatedBy = ?";
            params.push(userId);
        }

        query += " GROUP BY q.QuizID ORDER BY q.UpdatedAt DESC";

        const [quizzes] = await pool.execute(query, params);

        // For each quiz, also load its questions
        for (const quiz of quizzes) {
            const [questions] = await pool.execute(
                `SELECT qp.QuestionID, qp.QuestionText, qp.QuestionType, qp.Difficulty,
                        qq.OrderNumber, qq.PointValue, qq.AnswerSpaceLines
                 FROM QuizQuestion qq
                 INNER JOIN QuestionPool qp ON qq.QuestionID = qp.QuestionID
                 WHERE qq.QuizID = ?
                 ORDER BY qq.OrderNumber`,
                [quiz.QuizID]
            );

            // Load options for MCQ questions
            for (const question of questions) {
                if (question.QuestionType === 'Multiple Choice') {
                    const [options] = await pool.execute(
                        "SELECT OptionID, OptionText, IsCorrect FROM QuestionOption WHERE QuestionID = ?",
                        [question.QuestionID]
                    );
                    question.options = options;
                }
            }

            quiz.questions = questions;
        }

        res.json(quizzes);
    } catch (err) {
        console.error("Error loading quizzes:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ============================================================
// GET /api/quizzes/recent - Get most recent quizzes
// ============================================================
router.get("/recent", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const userId = req.query.userId;

        let query = `
            SELECT 
                q.QuizID, q.QuizName, q.QuizDescription, q.Status,
                q.CreatedAt, q.UpdatedAt,
                c.CourseName,
                COUNT(qq.QuizQuestionID) AS QuestionCount
            FROM Quiz q
            LEFT JOIN Course c ON q.CourseID = c.CourseID
            LEFT JOIN QuizQuestion qq ON q.QuizID = qq.QuizID
        `;
        const params = [];

        if (userId) {
            query += " WHERE q.CreatedBy = ?";
            params.push(userId);
        }

        query += ` GROUP BY q.QuizID ORDER BY q.UpdatedAt DESC LIMIT ${limit}`;

        const [quizzes] = await pool.execute(query, params);
        res.json(quizzes);
    } catch (err) {
        console.error("Error loading recent quizzes:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ============================================================
// GET /api/quizzes/community - Browse shared quizzes
// ============================================================
router.get("/community", async (req, res) => {
    try {
        const [quizzes] = await pool.execute(`
            SELECT 
                q.QuizID, q.QuizName, q.QuizDescription, q.Status,
                q.CreatedAt, q.UpdatedAt,
                c.CourseName,
                COUNT(qq.QuizQuestionID) AS QuestionCount,
                COALESCE(SUM(qq.PointValue), 0) AS TotalPoints
            FROM Quiz q
            LEFT JOIN Course c ON q.CourseID = c.CourseID
            LEFT JOIN QuizQuestion qq ON q.QuizID = qq.QuizID
            WHERE q.Status = 'Published'
            GROUP BY q.QuizID
            ORDER BY q.UpdatedAt DESC
        `);
        res.json(quizzes);
    } catch (err) {
        console.error("Error loading community quizzes:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ============================================================
// GET /api/quizzes/:id - Get single quiz with full details
// ============================================================
router.get("/:id", async (req, res) => {
    try {
        const quizId = req.params.id;

        // Get quiz info
        const [quizRows] = await pool.execute(
            `SELECT q.*, c.CourseName, c.CourseCode
             FROM Quiz q
             LEFT JOIN Course c ON q.CourseID = c.CourseID
             WHERE q.QuizID = ?`,
            [quizId]
        );

        if (quizRows.length === 0) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const quiz = quizRows[0];

        // Get questions with options
        const [questions] = await pool.execute(
            `SELECT qp.QuestionID, qp.QuestionText, qp.QuestionType, qp.Difficulty,
                    qq.OrderNumber, qq.PointValue, qq.AnswerSpaceLines
             FROM QuizQuestion qq
             INNER JOIN QuestionPool qp ON qq.QuestionID = qp.QuestionID
             WHERE qq.QuizID = ?
             ORDER BY qq.OrderNumber`,
            [quizId]
        );

        // Load options for each MCQ question
        for (const question of questions) {
            if (question.QuestionType === 'Multiple Choice') {
                const [options] = await pool.execute(
                    "SELECT OptionID, OptionText, IsCorrect FROM QuestionOption WHERE QuestionID = ?",
                    [question.QuestionID]
                );
                question.options = options;
            }
        }

        quiz.questions = questions;
        res.json(quiz);
    } catch (err) {
        console.error("Error loading quiz:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ============================================================
// POST /api/quizzes/create - Create a new quiz
// ============================================================
router.post("/create", async (req, res) => {
    try {
        const { quizName, courseId, description } = req.body;
        const userId = req.body.userId || req.query.userId || null;

        if (!quizName) {
            return res.status(400).json({ error: "Quiz name is required" });
        }

        const [result] = await pool.execute(
            `INSERT INTO Quiz (QuizName, QuizDescription, CourseID, CreatedBy, Status)
             VALUES (?, ?, ?, ?, 'Draft')`,
            [quizName, description || null, courseId || null, userId]
        );

        res.status(201).json({ quizId: result.insertId, message: "Quiz created successfully" });
    } catch (err) {
        console.error("Error creating quiz:", err);
        res.status(500).json({ error: "Failed to create quiz" });
    }
});

// ============================================================
// PUT /api/quizzes/:id - Update quiz (save questions, reorder, etc.)
// ============================================================
router.put("/:id", async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const quizId = req.params.id;
        const { quizName, description, status, questions } = req.body;

        // Update quiz metadata if provided
        if (quizName || description !== undefined || status) {
            const updates = [];
            const params = [];
            if (quizName) { updates.push("QuizName = ?"); params.push(quizName); }
            if (description !== undefined) { updates.push("QuizDescription = ?"); params.push(description); }
            if (status) { updates.push("Status = ?"); params.push(status); }
            params.push(quizId);

            if (updates.length > 0) {
                await connection.execute(
                    `UPDATE Quiz SET ${updates.join(", ")} WHERE QuizID = ?`,
                    params
                );
            }
        }

        // Update questions if provided
        if (questions && Array.isArray(questions)) {
            // Remove old question associations
            await connection.execute("DELETE FROM QuizQuestion WHERE QuizID = ?", [quizId]);

            // Insert updated questions
            for (const q of questions) {
                await connection.execute(
                    `INSERT INTO QuizQuestion (QuizID, QuestionID, OrderNumber, PointValue, AnswerSpaceLines)
                     VALUES (?, ?, ?, ?, ?)`,
                    [quizId, q.QuestionID, q.OrderNumber || 1, q.PointValue || 1, q.AnswerSpaceLines || 5]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Quiz updated successfully" });
    } catch (err) {
        await connection.rollback();
        console.error("Error updating quiz:", err);
        res.status(500).json({ error: "Failed to update quiz" });
    } finally {
        connection.release();
    }
});

// ============================================================
// POST /api/quizzes/:id/duplicate - Duplicate a quiz
// ============================================================
router.post("/:id/duplicate", async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const quizId = req.params.id;

        // Get original quiz
        const [original] = await connection.execute("SELECT * FROM Quiz WHERE QuizID = ?", [quizId]);
        if (original.length === 0) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const quiz = original[0];

        // Create copy
        const [result] = await connection.execute(
            `INSERT INTO Quiz (QuizName, QuizDescription, CourseID, CreatedBy, Status)
             VALUES (?, ?, ?, ?, 'Draft')`,
            [`${quiz.QuizName} (Copy)`, quiz.QuizDescription, quiz.CourseID, quiz.CreatedBy]
        );

        const newQuizId = result.insertId;

        // Copy questions
        const [questions] = await connection.execute(
            "SELECT * FROM QuizQuestion WHERE QuizID = ?", [quizId]
        );

        for (const q of questions) {
            await connection.execute(
                `INSERT INTO QuizQuestion (QuizID, QuestionID, OrderNumber, PointValue, AnswerSpaceLines)
                 VALUES (?, ?, ?, ?, ?)`,
                [newQuizId, q.QuestionID, q.OrderNumber, q.PointValue, q.AnswerSpaceLines]
            );
        }

        await connection.commit();
        res.status(201).json({ quizId: newQuizId, message: "Quiz duplicated successfully" });
    } catch (err) {
        await connection.rollback();
        console.error("Error duplicating quiz:", err);
        res.status(500).json({ error: "Failed to duplicate quiz" });
    } finally {
        connection.release();
    }
});

// ============================================================
// DELETE /api/quizzes/:id - Delete a quiz
// ============================================================
router.delete("/:id", async (req, res) => {
    try {
        const quizId = req.params.id;
        await pool.execute("DELETE FROM Quiz WHERE QuizID = ?", [quizId]);
        res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
        console.error("Error deleting quiz:", err);
        res.status(500).json({ error: "Failed to delete quiz" });
    }
});

module.exports = router;