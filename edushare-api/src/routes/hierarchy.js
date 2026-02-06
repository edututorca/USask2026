const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// GET /api/subjects
router.get("/subjects", async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM Subject ORDER BY SubjectName");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/topics?subjectId=...
router.get("/topics", async (req, res) => {
    try {
        const subjectId = req.query.subjectId || req.query.SubjectID;
        if (!subjectId) return res.status(400).json({ error: "subjectId is required" });

        const [rows] = await pool.execute(
            "SELECT * FROM Topic WHERE SubjectID = ? ORDER BY TopicName",
            [subjectId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/subtopics?topicId=...
router.get("/subtopics", async (req, res) => {
    try {
        const topicId = req.query.topicId || req.query.TopicID;
        if (!topicId) return res.status(400).json({ error: "topicId is required" });

        const [rows] = await pool.execute(
            "SELECT * FROM SubTopic WHERE TopicID = ? ORDER BY OrderNumber",
            [topicId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/sections?subtopicId=...
router.get("/sections", async (req, res) => {
    try {
        const subtopicId = req.query.subtopicId || req.query.subTopicId || req.query.SubTopicID;
        if (!subtopicId) return res.status(400).json({ error: "subtopicId is required" });

        const [rows] = await pool.execute(
            "SELECT * FROM Section WHERE SubTopicID = ? ORDER BY OrderNumber",
            [subtopicId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
