require("dotenv").config(); // Must be at the very top
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const User = require("./models/user");
const usersRouter = require("./routes/users"); // Import routes once
const aiRouter = require("./routes/ai");
const {
  requireAuth,
  verifyAdmin,
  generateToken,
  activeSessions,
} = require("./middleware/auth");

// 1. Initialize the App FIRST (Before using app.use)
const app = express();
const port = process.env.PORT || 3500;

// 2. Middleware
// CRITICAL: Increased limit to 50mb to handle Image Uploads (Base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 3. Connect Routes
// This connects your Gemini 2.5 logic and User logic
app.use("/users", usersRouter);
// Support both legacy /api and current /api/images paths
app.use("/api", aiRouter);
app.use("/api/images", aiRouter);

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/STUDIOALJO";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log("Please make sure MongoDB is running on localhost:27017");
  });

// ==========================
// PAGE ROUTES
// ==========================

// Landing page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/landing/index.html"));
});

// Login/Signup page route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Admin login page (public access)
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/login.html"));
});

// Admin dashboard (protected)
app.get("/admin/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/admin.html"));
});

// User dashboard (protected)
app.get("/dashboard", (req, res) => {
  const cookie = req.headers.cookie || "";
  const hasAuthCookie = cookie
    .split(";")
    .some((c) => c.trim().startsWith("studioaljo_auth=true"));
  if (!hasAuthCookie) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "public/dashboard/dashboard.html"));
});

// Redirect /admin to login
app.get("/admin", (req, res) => {
  res.redirect("/admin/login");
});

// Block direct access to protected HTML files
app.use((req, res, next) => {
  // Block direct access to dashboard.html and admin.html
  if (
    req.path === "/dashboard/dashboard.html" ||
    req.path === "/admin/admin.html"
  ) {
    return res.status(403).send("Access denied. Please use the proper route.");
  }
  next();
});

// Serve static files AFTER route definitions to prevent index.html override
app.use(express.static(path.join(__dirname, "public")));

// ==========================
// API ROUTES (AUTH)
// ==========================

// Admin login endpoint
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  if (verifyAdmin(username, password)) {
    const token = generateToken();
    activeSessions.add(token);
    res.json({
      message: "Login successful",
      token: token,
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Admin logout endpoint
app.post("/admin/logout", (req, res) => {
  const token =
    req.headers.authorization?.replace("Bearer ", "") || req.body.token;
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ message: "Logged out successfully" });
});

// User Login route
app.post("/login", async (req, res) => {
  console.log("Received login request:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email, password });
    if (user) {
      res.json({
        message: "Login successful",
        user: { id: user._id, name: user.name, email: user.email },
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// 404 ERROR HANDLER (MUST BE LAST)
// ==========================
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "public/404.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
