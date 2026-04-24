// routes/account.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

/**
 * Auth middleware riêng cho account route
 * (copy logic từ auth.js để không đụng code cũ)
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Chuẩn hoá user trả về cho FE (giống trong auth.js)
function toUserPayload(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  delete plain.password;
  delete plain.__v;
  if (!plain.id && plain._id) plain.id = String(plain._id);
  return plain;
}

/**
 * PUT /api/account/profile
 * Body có thể chứa:
 *  - fullName, phone, gender, dateOfBirth
 *  - addresses: []
 *  - paymentMethods: []
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      fullName,
      phone,
      gender,
      dateOfBirth,
      addresses,
      paymentMethods,
      wishlist,
      avatarUrl,
    } = req.body || {};


    const update = {};

    // cập nhật họ tên => tách firstName / lastName
    if (typeof fullName === "string") {
      const trimmed = fullName.trim();
      update.fullName = trimmed;
      if (trimmed) {
        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) {
          update.firstName = parts[0];
          update.lastName = parts[0];
        } else {
          update.lastName = parts[parts.length - 1];
          update.firstName = parts.slice(0, -1).join(" ");
        }
      }
    }

    if (phone !== undefined) update.phone = phone;
    if (gender !== undefined) update.gender = gender || null;

    if (dateOfBirth !== undefined) {
      update.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    if (Array.isArray(addresses)) {
      update.addresses = addresses;
    }

    if (Array.isArray(paymentMethods)) {
      update.paymentMethods = paymentMethods;
    }
    if (Array.isArray(wishlist)) {
      update.wishlist = wishlist;
    }
    if (avatarUrl !== undefined) {
      update.avatarUrl = avatarUrl || null;
    }


    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(toUserPayload(customer));
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Update profile failed", error: err.message });
  }
});

module.exports = router;
