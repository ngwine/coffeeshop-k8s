/**
 * AddressController - Business logic layer for Address/Geographic data
 */
class AddressController {
  constructor(addressRepository) {
    this.addressRepository = addressRepository;
  }

  /**
   * GET /api/addresses/countries - Get all countries
   */
  async getCountries(req, res, next) {
    try {
      const countries = await this.addressRepository.getCountries();

      return res.json({
        success: true,
        data: countries,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addresses/cities - Get cities/provinces
   */
  async getCities(req, res, next) {
    try {
      const { country } = req.query;

      const cities = await this.addressRepository.getCities(country);

      return res.json({
        success: true,
        data: cities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addresses/districts - Get districts
   */
  async getDistricts(req, res, next) {
    try {
      const { city } = req.query;

      if (!city) {
        return res.status(400).json({
          success: false,
          message: "Missing 'city' parameter",
        });
      }

      const districts = await this.addressRepository.getDistricts(city);

      return res.json({
        success: true,
        data: districts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addresses/wards - Get wards
   */
  async getWards(req, res, next) {
    try {
      const { district } = req.query;

      if (!district) {
        return res.status(400).json({
          success: false,
          message: "Missing 'district' parameter",
        });
      }

      const wards = await this.addressRepository.getWards(district);

      return res.json({
        success: true,
        data: wards,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/addresses/validate - Validate address
   */
  async validateAddress(req, res, next) {
    try {
      const { country, city, district, ward } = req.body;

      if (!country || !city || !district || !ward) {
        return res.status(400).json({
          success: false,
          message: "Missing required address fields",
        });
      }

      const result = await this.addressRepository.validateAddress(
        country,
        city,
        district,
        ward
      );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      return res.json({
        success: true,
        message: "Address is valid",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addresses/hierarchy - Get full address hierarchy
   */
  async getHierarchy(req, res, next) {
    try {
      const { country, city, district } = req.query;

      const hierarchy = await this.addressRepository.getFullHierarchy(
        country,
        city,
        district
      );

      return res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addresses/search - Search location
   */
  async searchLocation(req, res, next) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters",
        });
      }

      const results = await this.addressRepository.searchLocation(q);

      return res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AddressController;
