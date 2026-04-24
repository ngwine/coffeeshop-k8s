// backend/routes/orders.js
const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const DiscountCode = require('../models/DiscountCode');
const OrderRepository = require('../patterns/repository/OrderRepository');
const OrderController = require('../controllers/OrderController');
const mailer = require('../config/mailer');

const router = express.Router();

// Initialize Repository & Controller
const orderRepository = new OrderRepository(Order, Customer, DiscountCode);
const orderController = new OrderController(orderRepository, mailer);

// Routes
router.get('/', (req, res, next) =>
  orderController.getAll(req, res, next)
);

router.post('/', (req, res, next) =>
  orderController.create(req, res, next)
);

router.get('/dashboard/metrics', (req, res, next) =>
  orderController.getDashboardMetrics(req, res, next)
);

// Export routes - must be before :id route
router.get('/export', (req, res, next) =>
  orderController.exportOrders(req, res, next)
);

router.get('/export/formats', (req, res, next) =>
  orderController.getExportFormats(req, res, next)
);

router.get('/export/debug', (req, res, next) =>
  orderController.debugExport(req, res, next)
);

router.get('/user/:userId', (req, res, next) =>
  orderController.getUserOrders(req, res, next)
);

router.get('/:id', (req, res, next) =>
  orderController.getOne(req, res, next)
);

router.patch('/:id', (req, res, next) =>
  orderController.updateStatus(req, res, next)
);

router.put('/:id', (req, res, next) =>
  orderController.update(req, res, next)
);

router.delete('/:id', (req, res, next) =>
  orderController.delete(req, res, next)
);

module.exports = router;
