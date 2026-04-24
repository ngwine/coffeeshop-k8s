const express = require('express');
const router = express.Router();
const ProductRepository = require('../patterns/repository/ProductRepository');
const ProductController = require('../controllers/ProductController');

// Initialize repository and controller
const productRepository = new ProductRepository();
const productController = new ProductController(productRepository);

// Routes
router.get('/defaults', (req, res, next) => productController.getDefaults(req, res, next));
router.get('/', (req, res, next) => productController.getAll(req, res, next));
router.get('/:id/reviews', (req, res, next) => productController.getReviews(req, res, next));
router.get('/:id', (req, res, next) => productController.getOne(req, res, next));
router.post('/:id/reviews', (req, res, next) => productController.createReview(req, res, next));
router.post('/', (req, res, next) => productController.create(req, res, next));
router.put('/:id', (req, res, next) => productController.update(req, res, next));
router.delete('/:id', (req, res, next) => productController.delete(req, res, next));

module.exports = router;
