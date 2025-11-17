const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Create a new user
router.post("/", async (req, res) => {
  console.log("Received signup request:", req.body); // Debug log
  const { name, email, password } = req.body;

  // Check if required fields are present
  if (!name || !email || !password) {
    console.log("Missing required fields"); // Debug log
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password length
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const newUser = new User({ name, email, password });
    console.log("Creating new user:", newUser); // Debug log
    await newUser.save();
    console.log("User created successfully:", newUser); // Debug log
    res.status(201).json(newUser);
  } catch (error) {
    console.log("Error creating user:", error); // Debug log
    if (error.code === 11000) {
      res.status(400).json({ error: "User with this email already exists" });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user
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

// Delete a user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
