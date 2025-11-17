const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const User = require("./models/user");

const {
  requireAuth,
  verifyAdmin,
  generateToken,
  activeSessions,
} = require("./middleware/auth");

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/STUDIOALJO")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log("Please make sure MongoDB is running on localhost:27017");
  });

// Landing page route (must be before static middleware to override index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/landing/index.html"));
});

// Login/Signup page route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Routes
const users = require("./routes/users");
app.use("/users", users);

// Admin login page (public access)
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/login.html"));
});

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

// Admin dashboard (protected)
app.get("/admin/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/admin.html"));
});

// Redirect /admin to login or dashboard based on auth
app.get("/admin", (req, res) => {
  res.redirect("/admin/login");
});

// Login route
app.post("/login", async (req, res) => {
  console.log("Received login request:", req.body); // Debug log
  const { email, password } = req.body;

  // Check if required fields are present
  if (!email || !password) {
    console.log("Missing email or password"); // Debug log
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email, password });
    console.log("User found:", user); // Debug log
    if (user) {
      res.json({
        message: "Login successful",
        user: { id: user._id, name: user.name, email: user.email },
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Login error:", error); // Debug log
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
