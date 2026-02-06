const pool = require("../db/pool");

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." });

        const title = (req.body.title || "").trim();
        if (!title) return res.status(400).json({ error: "Title is required." });

        const sectionId = req.body.sectionId ? Number(req.body.sectionId) : null;
        const uploadedBy = req.body.uploadedBy ? Number(req.body.uploadedBy) : null;

        const [result] = await pool.execute(
            `INSERT INTO Document
       (Title, FileName, MimeType, FileSize, FileData, SectionID, UploadedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                req.file.buffer,
                sectionId,
                uploadedBy,
            ]
        );

        res.status(201).json({ documentId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed", detail: err.message });
    }
};

exports.getDocument = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [rows] = await pool.execute(
            `SELECT FileName, MimeType, FileData
       FROM Document
       WHERE DocumentID = ?`,
            [id]
        );

        if (!rows.length) return res.status(404).send("Not found.");

        const doc = rows[0];
        res.setHeader("Content-Type", doc.MimeType);
        res.setHeader("Content-Disposition", `inline; filename="${doc.FileName}"`);
        res.send(doc.FileData);
    } catch (err) {
        console.error(err);
        res.status(500).send("Download failed.");
    }
};
