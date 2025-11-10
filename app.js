const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const User = require('./models/user');

const auth = require('./middleware/auth');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/STUDIOALJO", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Routes
const users = require("./routes/users");
app.use("/users", users);

// Landing page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/landing/index.html"));
});

// Login/Signup page route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Admin routes with authentication
app.use("/admin", auth, express.static(path.join(__dirname, "public/admin")));
app.get("/admin", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/admin.html"));
});

// Login route
app.post("/login", async (req, res) => {
  console.log('Received login request:', req.body); // Debug log
  const { email, password } = req.body;
  
  // Check if required fields are present
  if (!email || !password) {
    console.log('Missing email or password'); // Debug log
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const user = await User.findOne({ email, password });
    console.log('User found:', user); // Debug log
    if (user) {
      res.json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.log('Login error:', error); // Debug log
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

