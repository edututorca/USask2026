const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// GET /api/questions?sectionId=...
router.get("/", async (req, res) => {
    try {
        const sectionId = req.query.sectionId;
        if (!sectionId) return res.status(400).json({ error: "sectionId is required" });

        const [rows] = await pool.execute(
            "SELECT * FROM QuestionPool WHERE SectionID = ? ORDER BY CreatedAt DESC",
            [sectionId]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/questions/mock
router.get("/mock", (req, res) => {
    const bank = {
        MCQ: [
            {
                text: "What does the character reveal about their motivation in this scene?",
                options: [
                    { text: "They are driven by a hidden desire for revenge.", correct: true },
                    { text: "They simply want to impress their peers.", correct: false },
                    { text: "They are confused and have no clear goal.", correct: false },
                    { text: "They want to leave the town immediately.", correct: false }
                ]
            },
            {
                text: "Which theme is most prominent in the dialogue between the protagonist and antagonist?",
                options: [
                    { text: "The corruption of power.", correct: true },
                    { text: "The beauty of nature.", correct: false },
                    { text: "The importance of technology.", correct: false },
                    { text: "The joy of childhood.", correct: false }
                ]
            },
            {
                text: "What is the significance of the prop introduced in this scene?",
                options: [
                    { text: "It symbolizes the character's lost innocence.", correct: true },
                    { text: "It serves no purpose other than decoration.", correct: false },
                    { text: "It is a distraction from the main plot.", correct: false },
                    { text: "It will be used as a weapon later.", correct: false }
                ]
            },
            {
                text: "How does the setting influence the mood of this scene?",
                options: [
                    { text: "The storm creates a sense of impending danger.", correct: true },
                    { text: "The sunny meadow makes everyone feel happy.", correct: false },
                    { text: "The crowded room creates a sense of community.", correct: false },
                    { text: "The setting is neutral and has no effect.", correct: false }
                ]
            }
        ],
        TF: [
            "This scene marks the turning point (climax) of the act.",
            "The protagonist lies to the antagonist in this scene.",
            "The tone of the scene is mostly humorous and lighthearted.",
            "A new major character is introduced in this scene."
        ],
        SA: [
            "Explain the mood of this scene in one or two sentences.",
            "Describe a key decision made by a character here.",
            "What is one theme that appears in this scene?",
            "How does the dialogue reveal the character's emotional state?"
        ],
        LA: [
            "Analyze how the dialogue builds tension in this scene. Provide specific evidence.",
            "Discuss how this scene contributes to the overall plot development of the play.",
            "Explain how a character’s actions here reflect their personality and long-term goals.",
            "Compare the relationship between the two main characters in this scene versus the previous act."
        ]
    };
    res.json(bank);
});

// POST /api/questions
router.post("/", async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { text, type, sectionId, difficulty, createdBy, options } = req.body;

        const [qResult] = await connection.execute(
            `INSERT INTO QuestionPool (SectionID, QuestionText, QuestionType, Difficulty, CreatedBy)
             VALUES (?, ?, ?, ?, ?)`,
            [sectionId, text, type, difficulty || 1, createdBy || null]
        );

        const questionId = qResult.insertId;

        if (options && Array.isArray(options) && options.length > 0) {
            for (const opt of options) {
                await connection.execute(
                    "INSERT INTO QuestionOption (QuestionID, OptionText, IsCorrect) VALUES (?, ?, ?)",
                    [questionId, opt.text, opt.correct ? 1 : 0]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ questionId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: "Failed to save question" });
    } finally {
        connection.release();
    }
});

module.exports = router;
