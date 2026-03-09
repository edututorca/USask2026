const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// ============================================================
// GET /api/courses - Get courses (optionally filtered by userId or status)
// ============================================================
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId;
        const status = req.query.status; // 'active' or 'archived' (future use)

        let query = `
            SELECT c.CourseID, c.CourseCode, c.CourseName, c.CourseDescription,
                   c.SubjectID, s.SubjectName
            FROM Course c
            LEFT JOIN Subject s ON c.SubjectID = s.SubjectID
        `;
        const params = [];

        if (userId) {
            query = `
                SELECT c.CourseID, c.CourseCode, c.CourseName, c.CourseDescription,
                       c.SubjectID, s.SubjectName, uc.EnrolledAt
                FROM UserCourse uc
                INNER JOIN Course c ON uc.CourseID = c.CourseID
                LEFT JOIN Subject s ON c.SubjectID = s.SubjectID
                WHERE uc.UserID = ?
            `;
            params.push(userId);
        }

        query += " ORDER BY c.CourseName";

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error loading courses:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;