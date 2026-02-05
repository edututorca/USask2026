const express = require("express");
const multer = require("multer");
const documentsController = require("../controllers/documentsController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Only PDF and PowerPoint files are allowed."));
    } else {
      cb(null, true);
    }
  },
});

// POST /api/documents
router.post("/", upload.single("pdf"), documentsController.uploadDocument);

// GET /api/documents/:id
router.get("/:id", documentsController.getDocument);

module.exports = router;
