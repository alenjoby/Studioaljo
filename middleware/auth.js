// Fixed admin credentials
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "iamtheadmin",
};

// Simple token storage (in production, use proper session management or JWT)
const activeSessions = new Set();

// Generate simple session token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Verify admin credentials
function verifyAdmin(username, password) {
  return (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  );
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.query.token ||
    (req.body && req.body.token);

  if (token && activeSessions.has(token)) {
    req.adminToken = token;
    return next();
  }

  res.status(401).json({ error: "Authentication required" });
}

module.exports = {
  requireAuth,
  verifyAdmin,
  generateToken,
  activeSessions,
  ADMIN_CREDENTIALS,
};
