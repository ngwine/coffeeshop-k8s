// backend/routes/discountCodes.js
const express = require('express');
const DiscountCode = require('../models/DiscountCode');
const DiscountCodeRepository = require('../patterns/repository/DiscountCodeRepository');
const DiscountCodeController = require('../controllers/DiscountCodeController');

const router = express.Router();

// Initialize Repository & Controller
const discountCodeRepository = new DiscountCodeRepository(DiscountCode);
const discountCodeController = new DiscountCodeController(discountCodeRepository);

// Public endpoints
router.post('/validate', (req, res, next) =>
  discountCodeController.validate(req, res, next)
);

router.get('/public', (req, res, next) =>
  discountCodeController.getPublic(req, res, next)
);

// Admin endpoints
router.get('/', (req, res, next) =>
  discountCodeController.getAll(req, res, next)
);

router.get('/stats', (req, res, next) =>
  discountCodeController.getStats(req, res, next)
);

router.post('/', (req, res, next) =>
  discountCodeController.create(req, res, next)
);

router.get('/:id', (req, res, next) =>
  discountCodeController.getOne(req, res, next)
);

router.patch('/:id', (req, res, next) =>
  discountCodeController.update(req, res, next)
);

router.delete('/:id', (req, res, next) =>
  discountCodeController.delete(req, res, next)
);

module.exports = router;
