const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// GET /api/user/profile?userId=...
router.get("/profile", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ error: "userId is required" });

        const [rows] = await pool.execute(
            "SELECT * FROM UserProfile WHERE UserID = ?",
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Profile not found" });

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/user/courses?userId=...
router.get("/courses", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ error: "userId is required" });

        const [rows] = await pool.execute(
            `SELECT c.*, s.SubjectName 
             FROM UserCourse uc
             INNER JOIN Course c ON uc.CourseID = c.CourseID
             LEFT JOIN Subject s ON c.SubjectID = s.SubjectID
             WHERE uc.UserID = ?`,
            [userId]
        );

        res.json({ courses: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
