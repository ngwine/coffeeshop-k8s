/**
 * AccountController - Business logic layer for Account operations
 */
class AccountController {
  constructor(accountRepository) {
    this.accountRepository = accountRepository;
  }

  /**
   * Normalize user document for API response
   */
  _toUserPayload(doc) {
    if (!doc) return null;
    
    const plain = doc.toObject ? doc.toObject() : { ...doc };
    delete plain.password;
    delete plain.__v;

    const fullName =
      plain.fullName ||
      [plain.firstName, plain.lastName].filter(Boolean).join(" ");

    return {
      id: String(plain._id || plain.id),
      email: plain.email,
      fullName,
      firstName: plain.firstName,
      lastName: plain.lastName,
      avatarUrl: plain.avatarUrl,
      phone: plain.phone || null,
      gender: plain.gender || null,
      dateOfBirth: plain.dateOfBirth || null,
      addresses: Array.isArray(plain.addresses) ? plain.addresses : [],
      paymentMethods: Array.isArray(plain.paymentMethods) ? plain.paymentMethods : [],
      wishlist: Array.isArray(plain.wishlist) ? plain.wishlist : [],
      loyalty: plain.loyalty || null,
      preferences: plain.preferences || null,
      consents: plain.consents || null,
      status: plain.status || "active",
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  /**
   * GET /api/account - Get current user account info
   */
  async getAccount(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - missing user ID",
        });
      }

      const account = await this.accountRepository.getAccount(req.userId);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(account),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/account - Update account profile
   */
  async updateProfile(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const profileData = req.body;

      // Prevent updating sensitive fields
      delete profileData._id;
      delete profileData.email;
      delete profileData.password;
      delete profileData.role;
      delete profileData.createdAt;

      const updated = await this.accountRepository.updateProfile(
        req.userId,
        profileData
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(updated),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/account/avatar - Update avatar
   */
  async updateAvatar(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        return res.status(400).json({
          success: false,
          message: "Missing avatarUrl",
        });
      }

      const updated = await this.accountRepository.updateAvatar(
        req.userId,
        avatarUrl
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(updated),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/account/preferences - Update preferences
   */
  async updatePreferences(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const preferences = req.body;

      const updated = await this.accountRepository.updatePreferences(
        req.userId,
        preferences
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.json({
        success: true,
        data: { preferences: updated.preferences || {} },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/account/consents - Update consents
   */
  async updateConsents(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const consents = req.body;

      const updated = await this.accountRepository.updateConsents(
        req.userId,
        consents
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.json({
        success: true,
        data: { consents: updated.consents || {} },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/account/stats - Get account statistics
   */
  async getStats(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const stats = await this.accountRepository.getAccountStats(req.userId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/account/addresses - Get account addresses
   */
  async getAddresses(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const addresses = await this.accountRepository.getAddresses(req.userId);

      return res.json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/account/payment-methods - Get payment methods
   */
  async getPaymentMethods(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const methods = await this.accountRepository.getPaymentMethods(req.userId);

      return res.json({
        success: true,
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/account/wishlist - Get wishlist
   */
  async getWishlist(req, res, next) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const wishlist = await this.accountRepository.getWishlist(req.userId);

      return res.json({
        success: true,
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AccountController;
