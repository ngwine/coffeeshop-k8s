// backend/routes/categories.js
const express = require('express');
const Product = require('../models/Product');
const CategoryRepository = require('../patterns/repository/CategoryRepository');
const CategoryController = require('../controllers/CategoryController');

const router = express.Router();

// Initialize Repository & Controller
const categoryRepository = new CategoryRepository(Product);
const categoryController = new CategoryController(categoryRepository);

// Routes
router.get('/', (req, res, next) =>
  categoryController.getAll(req, res, next)
);

router.post('/', (req, res, next) =>
  categoryController.create(req, res, next)
);

router.get('/search/suggestions', (req, res, next) =>
  categoryController.getSuggestions(req, res, next)
);

router.get('/:categoryName/search', (req, res, next) =>
  categoryController.search(req, res, next)
);

router.get('/:categoryName', (req, res, next) =>
  categoryController.getByCategory(req, res, next)
);

router.patch('/:categoryName', (req, res, next) =>
  categoryController.update(req, res, next)
);

router.delete('/:categoryName', (req, res, next) =>
  categoryController.delete(req, res, next)
);

module.exports = router;
