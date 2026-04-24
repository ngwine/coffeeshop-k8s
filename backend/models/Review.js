// server/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true,
      index: true
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    title: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true // tự sinh createdAt / updatedAt
  }
);

module.exports = mongoose.model('Review', reviewSchema);
