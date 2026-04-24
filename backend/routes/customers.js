// backend/routes/customers.js
const express = require('express');
const Customer = require('../models/Customer');
const CustomerRepository = require('../patterns/repository/CustomerRepository');
const CustomerController = require('../controllers/CustomerController');

const router = express.Router();

// Initialize Repository & Controller
const customerRepository = new CustomerRepository(Customer);
const customerController = new CustomerController(customerRepository);

// Health check
router.get('/ping', (req, res) =>
  customerController.ping(req, res)
);

// Statistics
router.get('/stats/new-users', (req, res, next) =>
  customerController.getNewUserStats(req, res, next)
);

router.get('/dashboard/stats', (req, res, next) =>
  customerController.getDashboardStats(req, res, next)
);

// Search
router.get('/search', (req, res, next) =>
  customerController.search(req, res, next)
);

// Customer CRUD
router.get('/', (req, res, next) =>
  customerController.getAll(req, res, next)
);

router.post('/', (req, res, next) =>
  customerController.create(req, res, next)
);

router.get('/:id', (req, res, next) =>
  customerController.getOne(req, res, next)
);

router.get('/:id/orders', (req, res, next) =>
  customerController.getOrders(req, res, next)
);

router.patch('/:id', (req, res, next) =>
  customerController.update(req, res, next)
);

router.delete('/:id', (req, res, next) =>
  customerController.delete(req, res, next)
);

// Address management
router.post('/:id/addresses', (req, res, next) =>
  customerController.addAddress(req, res, next)
);

router.put('/:id/addresses/:addressId', (req, res, next) =>
  customerController.updateAddress(req, res, next)
);

router.delete('/:id/addresses/:addressId', (req, res, next) =>
  customerController.deleteAddress(req, res, next)
);

// Payment methods
router.post('/:id/payment-methods', (req, res, next) =>
  customerController.addPaymentMethod(req, res, next)
);

router.delete('/:id/payment-methods/:methodId', (req, res, next) =>
  customerController.deletePaymentMethod(req, res, next)
);

// Wishlist
router.post('/:id/wishlist/:productId', (req, res, next) =>
  customerController.addToWishlist(req, res, next)
);

router.delete('/:id/wishlist/:productId', (req, res, next) =>
  customerController.removeFromWishlist(req, res, next)
);

module.exports = router;
