const mongoose = require('mongoose');

const variantOptionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
  },
  priceDelta: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { _id: false });

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [variantOptionSchema],
    default: [],
  },
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Boolean,
    default: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['Publish', 'Inactive', 'Draft'],
    default: 'Publish'
  },
 variants: {
    type: [variantSchema],
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update updatedAt before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
// Note: sku already has unique index, so we don't need to add it again
productSchema.index({ category: 1, status: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ status: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
