const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new mongoose.Schema({
  label: String,
  type: {
    type: String,
    enum: ['shipping', 'billing'],
    default: 'shipping'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  fullName: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  ward: String,
  district: String,
  city: String,
  provinceCode: String,
  postalCode: String,
  country: {
    type: String,
    default: 'VN'
  },
  notes: String
}, { _id: false });

const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cash', 'card', 'bank', 'momo', 'zaloPay'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  provider: String,
  accountNumber: String,
  accountName: String,
  brand: String,
  last4: String,
  card: {
    brand: String,
    last4: String
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
  type: String,
  required: false,   // để không bị lỗi với dữ liệu cũ
},

  phone: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  dateOfBirth: Date,
  avatarUrl: String,
  addresses: [addressSchema],
  paymentMethods: [paymentMethodSchema],
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  loyalty: {
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Total points earned throughout lifetime'
    },
    currentPoints: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Current available points'
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    lastAccrualAt: Date,
    history: [{
      orderId: {
        type: String,
        required: true
      },
      orderDate: {
        type: Date,
        required: true
      },
      type: {
        type: String,
        enum: ['earned', 'used'],
        required: true
      },
      points: {
        type: Number,
        required: true
      },
      description: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  wishlist: [{
    productId: {
      type: Schema.Types.Mixed,
      required: true,
      comment: 'Product ID (can be number or string)'
    },
    dateAdded: {
      type: Date,
      default: Date.now,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordOtp: { type: String },      // mã OTP (6 số)
    resetPasswordExpires: { type: Date },    // hết hạn
}, {
  timestamps: true
});

// Update updatedAt before saving
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
// Note: email already has unique index, so we don't need to add it again
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ fullName: 1 });

// Đảm bảo collection name là 'customers' trong database 'CoffeeDB'
const Customer = mongoose.model('Customer', customerSchema, 'customers');

module.exports = Customer;

