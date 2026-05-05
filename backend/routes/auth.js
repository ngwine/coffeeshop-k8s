// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer");
const AuthRepository = require("../patterns/repository/AuthRepository");
const AuthController = require("../controllers/AuthController");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";


/**
 * Middleware: verify JWT token
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const payload = jwt.verify(token, JWT_SECRET);

    // Accept both new tokens ({ sub }) and old tokens ({ id, _id })
    const userId = payload.sub || payload.id || payload._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.userId = userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Initialize Repository & Controller
const authRepository = new AuthRepository(Customer, JWT_SECRET);
const authController = new AuthController(authRepository);

// Routes
router.post("/register", (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/login", (req, res, next) =>
  authController.login(req, res, next)
);

router.get("/google", (req, res) =>
  authController.google(req, res)
);

router.get("/google/callback", (req, res, next) =>
  authController.googleCallback(req, res, next)
);

router.post("/forgot-password/request", (req, res, next) =>
  authController.forgotPasswordRequest(req, res, next)
);

router.post("/forgot-password/verify", (req, res, next) =>
  authController.forgotPasswordVerify(req, res, next)
);


/**
 * Middleware export: use in other routes to verify auth
 * Usage: router.get('/protected', authMiddleware, handler)
 */
module.exports = router;
module.exports.authMiddleware = authMiddleware;

/**
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  return res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.userId).select("-password");

    if (!customer) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(customer);
  } catch (err) {
    console.error("[auth/me] error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/change-password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Missing current password / new password",
      });
    }

    const customer = await Customer.findById(req.userId);
    if (!customer || !customer.password) {
      return res.status(400).json({
        message: "User not found or password not set",
      });
    }

    const ok = await bcrypt.compare(currentPassword, customer.password);
    if (!ok) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    customer.password = hash;
    await customer.save();

    res.json({ message: "Password changed" });
  } catch (err) {
    console.error("[auth/change-password] error:", err);
    res.status(500).json({
      message: "Change password failed",
      error: err.message,
    });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
