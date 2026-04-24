/**
 * DiscountCodeController - Business logic layer for Discount Code operations
 */
class DiscountCodeController {
  constructor(discountCodeRepository) {
    this.discountCodeRepository = discountCodeRepository;
  }

  /**
   * POST /api/discount-codes/validate - Validate a discount code
   */
  async validate(req, res, next) {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Missing 'code' parameter",
        });
      }

      const result = await this.discountCodeRepository.validate(code);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.reason || "Invalid discount code",
        });
      }

      return res.json({
        success: true,
        data: {
          code: result.discount.code,
          discountPercent: result.discount.discountPercent,
          description: result.discount.description,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/discount-codes/public - Get public discount codes
   */
  async getPublic(req, res, next) {
    try {
      const codes = await this.discountCodeRepository.findPublic();

      return res.json({
        success: true,
        data: codes.map((code) => ({
          code: code.code,
          discountPercent: code.discountPercent,
          description: code.description,
          expiryDate: code.expiryDate,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/discount-codes - Get all discount codes (admin only)
   */
  async getAll(req, res, next) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

      const options = {
        page,
        limit,
        sort: req.query.sort || "-createdAt",
      };

      const result = await this.discountCodeRepository.findAll(options);

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/discount-codes/:id - Get single discount code (admin only)
   */
  async getOne(req, res, next) {
    try {
      const { id } = req.params;

      const code = await this.discountCodeRepository.findById(id);

      if (!code) {
        return res.status(404).json({
          success: false,
          message: "Discount code not found",
        });
      }

      return res.json({
        success: true,
        data: code,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/discount-codes - Create new discount code (admin only)
   */
  async create(req, res, next) {
    try {
      const {
        code,
        discountPercent,
        description,
        expiryDate,
        maxUsageLimit,
      } = req.body;

      if (!code || discountPercent === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields (code, discountPercent)",
        });
      }

      if (discountPercent < 0 || discountPercent > 100) {
        return res.status(400).json({
          success: false,
          message: "Discount percent must be between 0 and 100",
        });
      }

      // Check if code already exists
      const existing = await this.discountCodeRepository.findByCode(code);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Discount code "${code}" already exists`,
        });
      }

      const codeData = {
        code: code.toUpperCase(),
        discountPercent,
        description: description || "",
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxUsageLimit: maxUsageLimit || null,
        isActive: true,
        usageCount: 0,
      };

      const newCode = await this.discountCodeRepository.create(codeData);

      return res.status(201).json({
        success: true,
        data: newCode,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/discount-codes/:id - Update discount code (admin only)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Prevent updating these fields
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.usageCount;
      delete updateData.code;

      const code = await this.discountCodeRepository.update(id, updateData);

      if (!code) {
        return res.status(404).json({
          success: false,
          message: "Discount code not found",
        });
      }

      return res.json({
        success: true,
        data: code,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/discount-codes/:id - Delete discount code (admin only)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const code = await this.discountCodeRepository.delete(id);

      if (!code) {
        return res.status(404).json({
          success: false,
          message: "Discount code not found",
        });
      }

      return res.json({
        success: true,
        message: "Discount code deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/discount-codes/stats - Get discount statistics (admin only)
   */
  async getStats(req, res, next) {
    try {
      // Deactivate expired codes
      await this.discountCodeRepository.deactivateExpiredCodes();

      // Get stats
      const stats = await this.discountCodeRepository.getStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DiscountCodeController;
