const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { OAuth2Client } = require("google-auth-library");

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==========================================
// USER ROUTES
// ==========================================

router.post("/", async (req, res) => {
  console.log("Received signup request:", req.body);
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be 6+ chars" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already exists" });

    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    res.json(await User.find());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GOOGLE OAUTH ROUTES
// ==========================================

// Google OAuth - Regular User Login/Signup
router.post("/google-auth", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists by email (migrating existing account)
      user = await User.findOne({ email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.profilePicture = picture; // Update profile picture
        await user.save();
      } else {
        // Create new user
        user = new User({
          name,
          email,
          googleId,
          profilePicture: picture,
          password: Math.random().toString(36), // Random password for Google users
        });
        await user.save();
      }
    } else {
      // Update profile picture for existing Google user
      user.profilePicture = picture;
    }

    // Update last active
    user.lastActive = Date.now();
    await user.save();

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid Google token",
    });
  }
});

// Google OAuth - Admin Login
router.post("/google-admin-auth", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email } = payload;

    // Check if email is in admin whitelist
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim());

    if (!adminEmails.includes(email)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. This Google account is not authorized as an admin.",
      });
    }

    // Generate admin token (you can use JWT or any secure method)
    const adminToken = Buffer.from(`${email}:${Date.now()}`).toString("base64");

    res.json({
      success: true,
      token: adminToken,
      email: email,
    });
  } catch (error) {
    console.error("Google admin auth error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid Google token",
    });
  }
});

module.exports = router;
