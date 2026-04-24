const express = require('express');
const AddressRepository = require('../patterns/repository/AddressRepository');
const AddressController = require('../controllers/AddressController');

const router = express.Router();

// Initialize repository and controller
const addressRepository = new AddressRepository();
const addressController = new AddressController(addressRepository);

/**
 * GET /api/addresses/countries - Get all countries
 */
router.get('/countries', (req, res, next) =>
  addressController.getCountries(req, res, next)
);

/**
 * GET /api/addresses/cities - Get cities/provinces by country
 * Query params: ?country=VN
 */
router.get('/cities', (req, res, next) =>
  addressController.getCities(req, res, next)
);

/**
 * GET /api/addresses/districts - Get districts by city
 * Query params: ?city=HO_CHI_MINH
 */
router.get('/districts', (req, res, next) =>
  addressController.getDistricts(req, res, next)
);

/**
 * GET /api/addresses/wards - Get wards by district
 * Query params: ?district=DISTRICT_1
 */
router.get('/wards', (req, res, next) =>
  addressController.getWards(req, res, next)
);

/**
 * POST /api/addresses/validate - Validate address components
 * Body: { country, city, district, ward }
 */
router.post('/validate', (req, res, next) =>
  addressController.validateAddress(req, res, next)
);

/**
 * GET /api/addresses/hierarchy - Get full address hierarchy
 * Query params: ?country=VN&city=HO_CHI_MINH&district=DISTRICT_1
 */
router.get('/hierarchy', (req, res, next) =>
  addressController.getHierarchy(req, res, next)
);

/**
 * GET /api/addresses/search - Search location
 * Query params: ?q=district+1
 */
router.get('/search', (req, res, next) =>
  addressController.searchLocation(req, res, next)
);

module.exports = router;
