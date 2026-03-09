const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// ============================================================
// GET /api/dashboard/stats - Get dashboard statistics
// ============================================================
router.get("/stats", async (req, res) => {
    try {
        const userId = req.query.userId;

        // If no userId, return stats for all (demo-friendly)
        let userFilter = "";
        let params = [];
        if (userId) {
            userFilter = " WHERE uc.UserID = ?";
            params = [userId];
        }

        // Total courses
        const [courseRows] = await pool.execute(
            `SELECT COUNT(*) AS total FROM UserCourse uc${userFilter}`,
            params
        );

        // Total quizzes
        let quizQuery = "SELECT COUNT(*) AS total FROM Quiz";
        let quizParams = [];
        if (userId) {
            quizQuery += " WHERE CreatedBy = ?";
            quizParams = [userId];
        }
        const [quizRows] = await pool.execute(quizQuery, quizParams);

        // Total questions
        let questionQuery = "SELECT COUNT(*) AS total FROM QuestionPool";
        let questionParams = [];
        if (userId) {
            questionQuery += " WHERE CreatedBy = ?";
            questionParams = [userId];
        }
        const [questionRows] = await pool.execute(questionQuery, questionParams);

        // User info (XP + name)
        let firstName = "Teacher";
        let xp = 0;
        if (userId) {
            const [userRows] = await pool.execute(
                `SELECT up.FirstName, ud.ExperiencePoints 
                 FROM UserDiagram ud
                 LEFT JOIN UserProfile up ON ud.UserID = up.UserID
                 WHERE ud.UserID = ?`,
                [userId]
            );
            if (userRows.length > 0) {
                firstName = userRows[0].FirstName || "Teacher";
                xp = userRows[0].ExperiencePoints || 0;
            }
        }

        res.json({
            totalCourses: courseRows[0].total,
            totalQuizzes: quizRows[0].total,
            totalQuestions: questionRows[0].total,
            experiencePoints: xp,
            firstName: firstName
        });
    } catch (err) {
        console.error("Error loading dashboard stats:", err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;