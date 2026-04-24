// backend/models/DiscountCode.js
const mongoose = require("mongoose");

const DiscountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      minlength: 5,
      maxlength: 5,
      uppercase: true,
      trim: true,
    },

    // "percent" = giảm theo %, "amount" = trừ thẳng tiền VND
    type: {
      type: String,
      enum: ["percent", "amount"],
    },

    // Dùng khi type = "percent"
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Dùng khi type = "amount" (VND)
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxUses: {
      type: Number,
      default: 10,
      min: 1,
      max: 10,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscountCode", DiscountCodeSchema);