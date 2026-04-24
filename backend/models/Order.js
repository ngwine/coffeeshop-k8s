const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.Mixed,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  quantity: {
    type: Number,
    min: 1
  },
  variant: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const addressSchema = new Schema({
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
  }
}, { _id: false });

// Function to generate random 4-character alphanumeric code (0-9, a-z, A-Z)
const generateDisplayCode = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const orderSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  displayCode: {
    type: String,
    unique: true,
    default: generateDisplayCode,
    match: /^[0-9a-zA-Z]{4}$/ // 4 alphanumeric characters (0-9, a-z, A-Z)
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerName: String,
  customerPhone: String,
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsUsed: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Number of loyalty points used in this order'
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Number of loyalty points earned from this order (10% of orderTotal before discount)'
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  shippingActivity: [{
    status: String,
    description: String,
    date: String,
    time: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  notes: String,
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
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
// Note: id already has unique index, so we don't need to add it again
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

