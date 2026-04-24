// backend/routes/discountCodes.js
const express = require("express");
const DiscountCode = require("../models/DiscountCode");

const router = express.Router();

// POST /api/discount-codes/validate
// body: { code, subtotal, shippingFee }
router.post("/validate", async (req, res) => {
  try {
    const { code, subtotal, shippingFee } = req.body || {};

    if (!code) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Discount code is required.",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    // 5 ký tự chữ + số
    const codeRegex = /^[A-Z0-9]{5}$/;
    if (!codeRegex.test(normalizedCode)) {
      return res.status(200).json({
        success: true,
        valid: false,
        message: "Code must be 5 alphanumeric characters.",
      });
    }

    const voucher = await DiscountCode.findOne({ code: normalizedCode }).lean();

    if (
      !voucher ||
      voucher.isActive === false ||
      voucher.usedCount >= voucher.maxUses
    ) {
      let msg = "This discount code is not valid.";
      if (voucher && voucher.usedCount >= voucher.maxUses) {
        msg = "This discount code has reached its usage limit.";
      }

      return res.status(200).json({
        success: true,
        valid: false,
        message: msg,
      });
    }

        const base = Number(subtotal || 0) + Number(shippingFee || 0);
    const type = voucher.type || "percent";

    let percent = 0;
    let discountAmount = 0;

    if (type === "amount") {
      // Mã trừ thẳng tiền, vd: TRU20 => 20.000đ
      discountAmount = Math.min(
        Number(voucher.discountAmount || 0),
        base
      );
    } else {
      // Mặc định: giảm theo %
      percent =
        typeof voucher.discountPercent === "number"
          ? voucher.discountPercent
          : 10;

      discountAmount = Math.floor((base * percent) / 100);
    }

    return res.json({
      success: true,
      valid: true,
      code: voucher.code,
      type,                // 👈 thêm type cho FE
      discountPercent: percent,
      discountAmount,
      maxUses: voucher.maxUses,
      usedCount: voucher.usedCount,
      remainingUses: Math.max(
        0,
        voucher.maxUses - voucher.usedCount
      ),
      message:
        type === "amount"
          ? `Code is valid: -${discountAmount.toLocaleString("vi-VN")}₫.`
          : `Code is valid: ${percent}% off (-${discountAmount.toLocaleString(
              "vi-VN"
            )}₫).`,
    });
    
  } catch (err) {
    console.error("[discount-codes/validate] error:", err);
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Failed to validate code.",
    });
  }
});

// GET /api/discount-codes/public
// Trả về các mã đang active và còn số lượt sử dụng
router.get("/public", async (req, res) => {
  try {
    const codes = await DiscountCode.find({
      isActive: true,
      $expr: { $lt: ["$usedCount", "$maxUses"] },
    })
      .select("code type discountPercent discountAmount maxUses usedCount")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: codes });
  } catch (err) {
    console.error("[discount-codes/public] error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load discount codes.",
    });
  }
});

module.exports = router;
