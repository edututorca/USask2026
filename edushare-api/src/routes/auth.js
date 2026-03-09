const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// ============================================================
// POST /api/auth/login - Login (simplified for demo)
// ============================================================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user by email
        const [users] = await pool.execute(
            "SELECT UserID, UserType, UserEmail, ExperiencePoints FROM UserDiagram WHERE UserEmail = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = users[0];

        // NOTE: In production, you'd compare hashed passwords here with bcrypt
        // For the demo/presentation, we accept any password for existing emails
        // TODO: Add bcrypt password verification: await bcrypt.compare(password, user.UserPassword)

        // Get user profile info
        const [profiles] = await pool.execute(
            "SELECT FirstName, LastName FROM UserProfile WHERE UserID = ?",
            [user.UserID]
        );

        const profile = profiles[0] || {};

        res.json({
            message: "Login successful",
            userId: user.UserID,
            userType: user.UserType,
            email: user.UserEmail,
            firstName: profile.FirstName || "User",
            lastName: profile.LastName || "",
            experiencePoints: user.ExperiencePoints || 0
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});

// ============================================================
// POST /api/auth/logout - Logout (clears session on client side)
// ============================================================
router.post("/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
});

module.exports = router;