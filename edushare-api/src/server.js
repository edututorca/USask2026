require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import route files
const documentsRoutes = require("./routes/documents");
const userRoutes = require("./routes/user");
const hierarchyRoutes = require("./routes/hierarchy");
const questionsRoutes = require("./routes/questions");
const quizzesRoutes = require("./routes/quizzes");
const dashboardRoutes = require("./routes/dashboard-routes");
const coursesRoutes = require("./routes/courses");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
const frontendPath = path.join(__dirname, "../../edushare-cosa-main");
app.use(express.static(frontendPath));

// Fallback for cleaner URLs
app.get("/user-area", (req, res) => {
  res.sendFile(path.join(frontendPath, "User-Area.html"));
});

app.get("/", (req, res) => {
  res.send("EduShare API is running");
});

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ============= API ROUTES ============= //
app.use("/api/documents", documentsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", hierarchyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` EduShare API running on http://localhost:${PORT}`);
});