// backend/routes/account.js
const express = require('express');
const Customer = require('../models/Customer');
const AccountRepository = require('../patterns/repository/AccountRepository');
const AccountController = require('../controllers/AccountController');

const router = express.Router();

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
    const payload = jwt.verify(token, JWT_SECRET);

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
const accountRepository = new AccountRepository(Customer);
const accountController = new AccountController(accountRepository);

// Protected routes (require authentication)
router.get('/', authMiddleware, (req, res, next) =>
  accountController.getAccount(req, res, next)
);

router.get('/me', authMiddleware, (req, res, next) =>
  accountController.getAccount(req, res, next)
);

router.put('/', authMiddleware, (req, res, next) =>
  accountController.updateProfile(req, res, next)
);

router.put('/profile', authMiddleware, (req, res, next) =>
  accountController.updateProfile(req, res, next)
);

router.post('/avatar', authMiddleware, (req, res, next) =>
  accountController.updateAvatar(req, res, next)
);

router.put('/preferences', authMiddleware, (req, res, next) =>
  accountController.updatePreferences(req, res, next)
);

router.put('/consents', authMiddleware, (req, res, next) =>
  accountController.updateConsents(req, res, next)
);

router.get('/stats', authMiddleware, (req, res, next) =>
  accountController.getStats(req, res, next)
);

router.get('/addresses', authMiddleware, (req, res, next) =>
  accountController.getAddresses(req, res, next)
);

router.get('/payment-methods', authMiddleware, (req, res, next) =>
  accountController.getPaymentMethods(req, res, next)
);

router.get('/wishlist', authMiddleware, (req, res, next) =>
  accountController.getWishlist(req, res, next)
);

module.exports = router;
