require("dotenv").config();
const express = require("express");
const cors = require("cors");
const documentsRoutes = require("./routes/documents");
const userRoutes = require("./routes/user");
const hierarchyRoutes = require("./routes/hierarchy");
const questionsRoutes = require("./routes/questions");

const path = require("path");

const app = express();
app.use(cors());

app.use(express.json());

// Serve static files from the frontend directory
const frontendPath = path.join(__dirname, "../../edushare-cosa-main");
app.use(express.static(frontendPath));

// Fallback for cleaner URLs (optional but nice)
app.get("/user-area", (req, res) => {
  res.sendFile(path.join(frontendPath, "User-Area.html"));
});

app.get("/", (req, res) => {
  res.send("EduShare API is running");
});

// (opcional, ajuda a testar)
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/documents", documentsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api", hierarchyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` EduShare API running on http://localhost:${PORT}`);
});
