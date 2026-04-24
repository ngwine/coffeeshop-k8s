/**
 * backend/routes/reviews.js
 * Review API routes with PURE OBSERVER PATTERN integration
 */

const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const ReviewRepository = require('../patterns/repository/ReviewRepository');
const Review = require('../models/Review');
const ReviewObserver = require('../patterns/observer/ReviewObserver');

const reviewRepository = new ReviewRepository(Review);
const reviewObserver = ReviewObserver.getInstance();
const reviewController = new ReviewController(reviewRepository, reviewObserver);

// ✅ POST - Create review (OBSERVER BROADCASTS)
router.post('/', (req, res, next) => reviewController.create(req, res, next));

// GET - Reviews by product
router.get('/product/:productId', (req, res, next) =>
  reviewController.getByProductId(req, res, next)
);

// GET - Product rating
router.get('/product/:productId/rating', (req, res, next) =>
  reviewController.getProductRating(req, res, next)
);

// GET - Rating distribution
router.get('/product/:productId/distribution', (req, res, next) =>
  reviewController.getRatingDistribution(req, res, next)
);

// GET - Single review
router.get('/:id', (req, res, next) => reviewController.getById(req, res, next));

// ✅ PUT - Update review (OBSERVER BROADCASTS)
router.put('/:id', (req, res, next) => reviewController.update(req, res, next));

// ✅ DELETE - Delete review (OBSERVER BROADCASTS)
router.delete('/:id', (req, res, next) => reviewController.delete(req, res, next));

module.exports = router;