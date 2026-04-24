/**
 * API Routes Index
 * Tổng hợp tất cả các API endpoints và collection mapping
 * 
 * Database: CoffeeDB
 * Collections:
 * - products (từ Product model)
 * - customers (từ Customer model)
 * - orders (từ Order model)
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const productsRouter = require('./products');
const customersRouter = require('./customers');
const ordersRouter = require('./orders');
const addressesRouter = require('./addresses');
const categoriesRouter = require('./categories');
const uploadRouter = require('./upload');
const debugRouter = require('./debug');
const authRouter      = require('./auth');
const discountCodesRouter = require("./discountCodes");
const reviewsRouter = require('./review');

/**
 * API Endpoints Documentation
 * 
 * Products API (/api/products):
 * - GET    /api/products              - Lấy danh sách products (query: page, limit, status, category, stock, search)
 * - GET    /api/products/:id          - Lấy chi tiết một product
 * - PUT    /api/products/:id          - Cập nhật product
 * 
 * Customers API (/api/customers):
 * - GET    /api/customers             - Lấy danh sách customers (query: q, page, limit)
 * - GET    /api/customers/ping        - Health check
 * - GET    /api/customers/:id         - Lấy chi tiết customer
 * - GET    /api/customers/:id/orders  - Lấy orders của customer
 * 
 * Orders API (/api/orders):
 * - GET    /api/orders                - Lấy danh sách orders (query: q, status, email, page, limit)
 * - GET    /api/orders/:id            - Lấy chi tiết order
 * - PATCH  /api/orders/:id            - Cập nhật status của order
 * 
 * Debug API (/api/debug):
 * - GET    /api/debug/collections     - Liệt kê tất cả collections
 * - GET    /api/debug/db-info         - Thông tin database
 */

// Mount routes
router.use('/products', productsRouter);
router.use('/customers', customersRouter);
router.use('/orders', ordersRouter);
router.use('/addresses', addressesRouter);
router.use('/categories', categoriesRouter);
router.use('/upload', uploadRouter);
router.use('/debug', debugRouter);
router.use('/auth', authRouter); 
router.use("/discount-codes", discountCodesRouter);
router.use('/reviews', reviewsRouter);

// API Info endpoint - Tổng hợp thông tin về các API endpoints và collections
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'CoffeeDB API',
    database: 'CoffeeDB',
    collections: {
      products: {
        name: 'products',
        model: 'Product',
        endpoints: [
          'GET /api/products - Lấy danh sách products',
          'GET /api/products/:id - Lấy chi tiết product',
          'PUT /api/products/:id - Cập nhật product'
        ]
      },
      customers: {
        name: 'customers',
        model: 'Customer',
        endpoints: [
          'GET /api/customers - Lấy danh sách customers',
          'GET /api/customers/ping - Health check',
          'GET /api/customers/:id - Lấy chi tiết customer',
          'GET /api/customers/:id/orders - Lấy orders của customer'
        ]
      },
      orders: {
        name: 'orders',
        model: 'Order',
        endpoints: [
          'GET /api/orders - Lấy danh sách orders',
          'GET /api/orders/:id - Lấy chi tiết order',
          'PATCH /api/orders/:id - Cập nhật status của order'
        ]
      }
    },
    version: '1.0.0'
  });
});

module.exports = router;

