/**
 * CustomerController - Business logic layer for Customer operations
 */
class CustomerController {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
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

    const normalizedEmail = String(plain.email || "").toLowerCase().trim();
    const userRole =
      plain.role ||
      (normalizedEmail === "admin@gmail.com" ? "admin" : "customer");

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
      tags: Array.isArray(plain.tags) ? plain.tags : [],
      status: plain.status || "active",
      role: userRole,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  /**
   * GET /api/customers/ping - Health check
   */
  ping(req, res) {
    return res.json({ success: true, message: "pong" });
  }

  /**
   * GET /api/customers/stats/new-users - Get new user statistics
   */
  async getNewUserStats(req, res, next) {
    try {
      const { period = "month" } = req.query;
      const now = new Date();
      let startDate, endDate = now;

      if (period === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const stats = await this.customerRepository.getNewUserStats(startDate, endDate);

      return res.json({
        success: true,
        data: stats,
        period,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customers - List all customers
   */
  async getAll(req, res, next) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const search = req.query.search || "";

      const options = {
        page,
        limit,
        sort: req.query.sort || "-createdAt",
        search,
      };

      const result = await this.customerRepository.findAll(options);

      return res.json({
        success: true,
        data: result.data.map((c) => this._toUserPayload(c)),
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
   * Helper to resolve customer by ID or Email
   */
  async _resolveCustomer(idOrEmail) {
    if (idOrEmail && idOrEmail.includes("@")) {
      return await this.customerRepository.findByEmail(idOrEmail);
    }
    try {
      return await this.customerRepository.findById(idOrEmail);
    } catch (error) {
      if (error.name === "CastError") return null;
      throw error;
    }
  }

  /**
   * GET /api/customers/:id - Get customer by ID
   */
  async getOne(req, res, next) {
    try {
      const { id } = req.params;

      const customer = await this._resolveCustomer(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customers/:id/orders - Get customer's orders
   */
  async getOrders(req, res, next) {
    try {
      const { id } = req.params;

      // Resolve actual ID if email is passed
      const resolvedCustomer = await this._resolveCustomer(id);
      if (!resolvedCustomer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      const customer = await this.customerRepository.findWithOrders(resolvedCustomer._id || resolvedCustomer.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: customer.orders || [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/customers - Create new customer
   */
  async create(req, res, next) {
    try {
      const {
        email,
        firstName,
        lastName,
        fullName,
        phone,
        gender,
        dateOfBirth,
        status = "active",
      } = req.body;

      if (!email || (!firstName && !fullName)) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields (email, firstName/fullName)",
        });
      }

      // Check if email exists
      const existing = await this.customerRepository.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      const customerData = {
        email: email.toLowerCase(),
        firstName: firstName || (fullName ? fullName.split(" ")[0] : ""),
        lastName: lastName || (fullName ? fullName.split(" ").slice(1).join(" ") : ""),
        fullName: fullName || `${firstName} ${lastName}`.trim(),
        phone,
        gender,
        dateOfBirth,
        status,
        addresses: [],
        paymentMethods: [],
        wishlist: [],
      };

      const customer = await this.customerRepository.create(customerData);

      return res.status(201).json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/customers/:id - Update customer information
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const resolved = await this._resolveCustomer(id);
      if (!resolved) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      const customer = await this.customerRepository.update(resolved._id || resolved.id, updateData);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/customers/:id - Delete customer
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const resolved = await this._resolveCustomer(id);
      if (!resolved) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      const customer = await this.customerRepository.delete(resolved._id || resolved.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/customers/:id/addresses - Add address
   */
  async addAddress(req, res, next) {
    try {
      const { id } = req.params;
      const addressData = req.body;

      const customer = await this.customerRepository.addAddress(id, addressData);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/customers/:id/addresses/:addressId - Update address
   */
  async updateAddress(req, res, next) {
    try {
      const { id, addressId } = req.params;
      const addressData = req.body;

      const customer = await this.customerRepository.updateAddress(id, addressId, addressData);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer or address not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/customers/:id/addresses/:addressId - Delete address
   */
  async deleteAddress(req, res, next) {
    try {
      const { id, addressId } = req.params;

      const customer = await this.customerRepository.deleteAddress(id, addressId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/customers/:id/payment-methods - Add payment method
   */
  async addPaymentMethod(req, res, next) {
    try {
      const { id } = req.params;
      const methodData = req.body;

      const customer = await this.customerRepository.addPaymentMethod(id, methodData);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/customers/:id/payment-methods/:methodId - Delete payment method
   */
  async deletePaymentMethod(req, res, next) {
    try {
      const { id, methodId } = req.params;

      const customer = await this.customerRepository.deletePaymentMethod(id, methodId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/customers/:id/wishlist/:productId - Add to wishlist
   */
  async addToWishlist(req, res, next) {
    try {
      const { id, productId } = req.params;

      const customer = await this.customerRepository.addToWishlist(id, productId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/customers/:id/wishlist/:productId - Remove from wishlist
   */
  async removeFromWishlist(req, res, next) {
    try {
      const { id, productId } = req.params;

      const customer = await this.customerRepository.removeFromWishlist(id, productId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        data: this._toUserPayload(customer),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customers/dashboard/stats - Get dashboard statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await this.customerRepository.getDashboardStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customers/search - Search customers
   */
  async search(req, res, next) {
    try {
      const { q, limit } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Missing search query",
        });
      }

      const results = await this.customerRepository.search(q, limit || 10);

      return res.json({
        success: true,
        data: results.map((c) => this._toUserPayload(c)),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CustomerController;
