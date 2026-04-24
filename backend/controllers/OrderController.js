const mongoose = require("mongoose");
const { DataExportService } = require('../patterns/strategy/export/DataExportService');
const PaymentProcessor = require('../patterns/strategy/payment/PaymentProcessor');
/**
 * OrderController - Business logic layer for Order operations
 */
class OrderController {
  constructor(orderRepository, mailer, loyaltyUtils) {
    this.orderRepository = orderRepository;
    this.mailer = mailer;
    this.loyaltyUtils = loyaltyUtils;
    this.exportService = new DataExportService();
    this.paymentProcessor = new PaymentProcessor();
  }

  /**
   * Format Vietnamese currency
   */
  _formatVnd(amount) {
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(amount || 0);
    } catch (e) {
      return `${amount} VND`;
    }
  }

  /**
   * Send order confirmation email
   */
  async _sendOrderConfirmationEmail(order) {
    if (!order || !order.customerEmail) return;

    const appName = process.env.APP_NAME || "Coffee Shop";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const from =
      process.env.FROM_EMAIL ||
      process.env.MAIL_FROM ||
      process.env.SMTP_USER ||
      "no-reply@example.com";

    const itemsHtml = (order.items || [])
      .map((it) => {
        const qty = Number(it.quantity || it.qty || 1);
        const price = Number(it.price || 0);
        const lineTotal = qty * price;
        const variant =
          it.variant && it.variant.value ? ` (${it.variant.value})` : "";
        return `
          <tr>
            <td style="padding:4px 8px;">${it.name}${variant}</td>
            <td style="padding:4px 8px;text-align:center;">${qty}</td>
            <td style="padding:4px 8px;text-align:right;">${this._formatVnd(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    const totalAmount =
      Number(order.totalAmount || order.total || 0) +
      Number(order.shippingFee || 0);

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#111827">
        <h2 style="font-size:18px;margin:0 0 8px;">Thank you for your order!</h2>
        <p style="margin:0 0 8px;">We have received your order ${order.displayCode || ""} at <strong>${appName}</strong>.</p>
        <p style="margin:0 0 12px;">Here is a summary:</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f9fafb;">
              <th align="left" style="padding:6px 8px;font-size:12px;text-transform:uppercase;color:#6b7280;">Item</th>
              <th align="center" style="padding:6px 8px;font-size:12px;text-transform:uppercase;color:#6b7280;">Qty</th>
              <th align="right" style="padding:6px 8px;font-size:12px;text-transform:uppercase;color:#6b7280;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <p style="margin:12px 0 4px;text-align:right;">
          <strong>Shipping fee:</strong> ${this._formatVnd(order.shippingFee || 0)}
        </p>
        <p style="margin:0 0 16px;text-align:right;">
          <strong>Grand total:</strong> ${this._formatVnd(totalAmount)}
        </p>
        <p style="margin:0 0 16px;">You can view your order details at any time:</p>
        <p style="margin:0 0 16px;">
          <a href="${frontendUrl}/orders${order._id ? "/" + order._id : ""}" style="display:inline-block;padding:8px 16px;border-radius:999px;background:#7c3aed;color:#fff;text-decoration:none;font-size:14px;">View order</a>
        </p>
      </div>
    `;

    try {
      await this.mailer.sendMail({
        from,
        to: order.customerEmail,
        subject: `Order ${order.displayCode || "#" + order._id} confirmed - ${appName}`,
        html,
      });
    } catch (err) {
      console.error("Error sending order confirmation email:", err.message);
      // Don't fail the order creation if email fails
    }
  }

  /**
   * GET /api/orders - List orders with pagination and filters
   */
  async getAll(req, res, next) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const { q, status, email, range, startDate, endDate } = req.query;

      // Build filters
      const filters = {};
      if (status) filters.status = status;

      if (email && String(email).trim() !== "") {
        filters.customerEmail = new RegExp(String(email), "i");
      }

      // Search by order code/displayCode (only if provided)
      if (q !== undefined && q !== null && String(q).trim() !== "") {
        let searchTerm = String(q).trim().replace(/^#+/, "");

        if (searchTerm) {
          const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          filters.displayCode = {
            $exists: true,
            $ne: null,
            $regex: `^${escapedTerm}`,
            $options: "i",
          };
        }
      }

      // Time range filtering
      const now = new Date();
      let rangeStart = null;
      let rangeEnd = null;

      if (range && typeof range === "string") {
        const r = range.toLowerCase();
        const startOfDay = (d) => {
          const x = new Date(d);
          x.setHours(0, 0, 0, 0);
          return x;
        };
        const startOfWeek = (d) => {
          const x = startOfDay(d);
          const day = x.getDay();
          const diff = (day + 6) % 7;
          x.setDate(x.getDate() - diff);
          return x;
        };
        const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
        const normalizeEnd = (d) => {
          if (!d) return null;
          const e = new Date(d);
          e.setHours(23, 59, 59, 999);
          return e;
        };

        if (r === "today") {
          rangeStart = startOfDay(now);
          rangeEnd = normalizeEnd(now);
        } else if (r === "yesterday") {
          const y = new Date(now);
          y.setDate(y.getDate() - 1);
          rangeStart = startOfDay(y);
          rangeEnd = normalizeEnd(y);
        } else if (r === "week") {
          rangeStart = startOfWeek(now);
          rangeEnd = normalizeEnd(now);
        } else if (r === "month") {
          rangeStart = startOfMonth(now);
          rangeEnd = normalizeEnd(now);
        } else if (r === "custom") {
          rangeStart = startDate ? new Date(startDate) : null;
          rangeEnd = endDate ? new Date(endDate) : null;
          if (rangeEnd) rangeEnd.setHours(23, 59, 59, 999);
        }
      }

      if (rangeStart || rangeEnd) {
        filters.createdAt = {};
        if (rangeStart) filters.createdAt.$gte = rangeStart;
        if (rangeEnd) filters.createdAt.$lte = rangeEnd;
      }

      // Fetch orders
      const options = {
        page,
        limit,
        sort: q && String(q).trim() ? { displayCode: 1 } : { createdAt: -1 },
      };

      const result = await this.orderRepository.findPaginated(filters, options);

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
   * GET /api/orders/:id - Get single order by ID
   */
  async getOne(req, res, next) {
    try {
      const { id } = req.params;

      let order = null;
      try {
        order = await this.orderRepository.findById(id);
      } catch (err) {
        if (err.name === 'CastError') {
          // Fallback to displayCode
          const orders = await this.orderRepository.findPaginated({ displayCode: id }, { limit: 1 });
          if (orders && orders.data && orders.data.length > 0) {
            order = orders.data[0];
          }
        } else {
          throw err;
        }
      }

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/user/:userId - Get user's orders
   */
  async getUserOrders(req, res, next) {
    try {
      const { userId } = req.params;
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

      const options = { page, limit, sort: "-createdAt" };
      const result = await this.orderRepository.findByCustomerId(userId, options);

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
   * POST /api/orders - Create new order
   */
  async create(req, res, next) {
    try {
      const { customerId, items, shippingAddress, discountCode, usePoints, paymentMethod, paymentDetails, customerEmail, customerName, customerPhone, shippingFee, note } = req.body;

      if (!customerId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Missing customerId or items",
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
            success: false,
            message: "Payment method is required",
        });
      }

      // Calculate order total
      let subtotal = 0;
      for (const item of items) {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        subtotal += quantity * price;
      }

      // Apply discount code if provided
      let discountAmount = 0;
      if (discountCode) {
        const discount = await this.orderRepository.validateDiscountCode(discountCode);
        if (discount) {
          discountAmount = Math.round(subtotal * (discount.discountPercent || 0) / 100);
          await this.orderRepository.incrementDiscountUsage(discount._id);
        }
      }

      // Apply loyalty points if enabled
      let pointsUsed = 0;
      if (usePoints) {
        // Validate customerId format before finding
        const isValidObjectId = mongoose.Types.ObjectId.isValid(customerId);
        if (isValidObjectId) {
          const customer = await this.orderRepository.Customer?.findById(customerId);
          if (customer && customer.loyalty?.currentPoints) {
            pointsUsed = Math.min(
              customer.loyalty.currentPoints,
              Math.floor(subtotal / 100) // 100 VND = 1 point
            );
            discountAmount += pointsUsed * 100;
          }
        }
      }
      console.log(`📦 [OrderController] Creating order for customer: ${customerId}`);
      console.log(`💳 [OrderController] Payment Method: ${paymentMethod}`);
      console.log(`🛒 [OrderController] Items: ${items?.length || 0}`);

      const totalAmount = subtotal - discountAmount;

      let paymentResult = { success: true, transactionId: null };

      if (paymentMethod !== "cod") {
        let pDetails = paymentDetails || {};
        
        // Chuẩn hóa tên phương thức để kiểm tra (vídụ: "Credit Card" -> "credit_card")
        const normalizedMethod = (paymentMethod || "").toLowerCase().trim().replace(/\s+/g, '_');

        // Luôn đắp dữ liệu mẫu nếu thiếu các trường bắt buộc của CreditCard
        if ((normalizedMethod === 'credit_card' || normalizedMethod === 'card' || normalizedMethod === 'creditcard') && !pDetails.cardholderName) {
          pDetails = { cardNumber: '1234567890123456', cardholderName: 'Mock User', expiryDate: '12/28', cvv: '123' };
        } 
        // Luôn đắp dữ liệu mẫu nếu thiếu các trường bắt buộc của BankTransfer
        else if ((normalizedMethod === 'bank_transfer' || normalizedMethod === 'bank' || normalizedMethod === 'banktransfer') && !pDetails.bankCode) {
          pDetails = { bankCode: 'TestBank', accountNumber: '123456789', accountHolderName: 'Mock User' };
        }
        // Các loại ví điện tử khác
        else if (['vnpay', 'momo', 'ewallet'].includes(normalizedMethod) && Object.keys(pDetails).length === 0) {
          pDetails = { walletType: normalizedMethod === 'vnpay' ? 'VNPay' : (normalizedMethod === 'momo' ? 'Momo' : 'PayPal'), walletEmail: 'customer@example.com' };
        }

        paymentResult = await this.paymentProcessor.processPayment(
          paymentMethod,
          pDetails,
          totalAmount
        );

        if (!paymentResult.success) {
          return res.status(400).json({
              success: false,
              message: "Payment failed",
              error: paymentResult.error,
          });
        }
      }

      // Generate display code (4-char alphanumeric)
      const displayCode = Math.random().toString(36).substring(2, 6).toUpperCase();

      const orderData = {
        id: displayCode, // required by Schema
        customerId,
        customerEmail: customerEmail || 'guest@example.com',
        customerName,
        customerPhone,
        items,
        shippingAddress: shippingAddress || {},
        discountCode: discountCode || null,
        discountAmount,
        pointsUsed,
        subtotal,
        totalAmount,
        total: totalAmount, // required by Schema
        shippingFee: shippingFee || 0,
        notes: note,
        status: "pending",
        displayCode,
        paymentMethod: paymentMethod,
        paymentStatus: paymentResult.success ? 'paid' : 'failed',
        paymentTransactionId: paymentResult.transactionId,
        createdAt: new Date(),
      };

      const order = await this.orderRepository.create(orderData);

      // Send confirmation email
      try {
        await this._sendOrderConfirmationEmail(order);
      } catch (err) {
        console.error("Error sending confirmation email:", err);
        // Don't fail order creation if email fails
      }

      return res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("❌ Order Creation Failed:", error.message);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          details: error.errors
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/orders/:id - Update order status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, paymentStatus, notes } = req.body;

      if (!status && !paymentStatus) {
        return res.status(400).json({
          success: false,
          message: "Missing status or paymentStatus",
        });
      }

      // Validate order status if provided
      if (status) {
        const validStatuses = ["pending", "processing", "completed", "cancelled"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          });
        }
      }

      const order = await this.orderRepository.updateStatus(id, { status, paymentStatus, notes });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("❌ Order Status Update Failed:", error.message);
      next(error);
    }
  }

  /**
   * PUT /api/orders/:id - Update entire order
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Prevent updating critical fields
      delete updateData._id;
      delete updateData.customerId;
      delete updateData.createdAt;

      const order = await this.orderRepository.update(id, updateData);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/orders/:id - Delete order (soft delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const order = await this.orderRepository.delete(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.json({
        success: true,
        message: "Order deleted successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/dashboard/metrics - Get dashboard statistics
   */
  async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await this.orderRepository.getDashboardMetrics();

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/orders/export - Export orders in various formats (Strategy Pattern)
   */
  async exportOrders(req, res, next) {
    try {
      const { status, dateFrom, dateTo, format = 'csv' } = req.query;

      // Validate format
      const supportedFormats = this.exportService.getSupportedFormats();
      if (!supportedFormats.includes(format.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Unsupported format. Supported formats: ${supportedFormats.join(', ')}`
        });
      }

      const filters = {
        status: status ? [status] : [],
        dateFrom,
        dateTo,
      };

      // Get data from repository
      const orders = await this.orderRepository.findForExport(filters);

      // Transform data for export
      const exportData = orders.map(order => ({
        'Order ID': order.displayCode || (order._id ? order._id.toString() : 'N/A'),
        'Customer Name': order.customerId ? order.customerId.fullName : 'N/A',
        'Customer Email': order.customerId ? order.customerId.email : 'N/A',
        'Total Amount': order.totalAmount || 0,
        'Status': order.status || 'N/A',
        'Created Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
        'Payment Method': order.paymentMethod || 'N/A'
      }));

      // Use Strategy Pattern to export in requested format
      const exportResult = await this.exportService.exportData(exportData, format);

      // Set response headers
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="orders.${exportResult.fileExtension}"`);

      return res.send(exportResult.data);
    } catch (error) {
      console.error('Export error:', error);
      return next(error);
    }
  }

  /**
   * GET /api/orders/export/debug - Debug export data structure
   */
  async debugExport(req, res, next) {
    try {
      const orders = await this.orderRepository.findForExport({}, "-createdAt", 1); // Get first order

      return res.json({
        success: true,
        data: orders[0], // Return first order for inspection
        customerId: orders[0]?.customerId,
        hasCustomerId: !!orders[0]?.customerId
      });
    } catch (error) {
      console.error('Debug export error:', error);
      return next(error);
    }
  }

  /**
   * GET /api/orders/export/formats - List supported export formats
   */
  async getExportFormats(req, res, next) {
    try {
      const supportedFormats = this.exportService.getSupportedFormats();
      return res.json({
        success: true,
        data: supportedFormats.map(format => ({
          format,
          description: this._getFormatDescription(format)
        }))
      });
    } catch (error) {
      console.error('Get export formats error:', error);
      return next(error);
    }
  }

  /**
   * GET /api/orders/export/test - Test export functionality
   */
  async testExport(req, res, next) {
    try {
      const { format = 'csv' } = req.query;

      const testData = [
        {
          'Order ID': 'ORD-001',
          'Customer Name': 'Nguyễn Văn A',
          'Customer Email': 'test@example.com',
          'Total Amount': 150000,
          'Status': 'completed',
          'Created Date': '2026-03-29',
          'Payment Method': 'cash'
        }
      ];

      const exportResult = await this.exportService.exportData(testData, format);

      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="test.${exportResult.fileExtension}"`);

      return res.send(exportResult.data);
    } catch (error) {
      console.error('Test export error:', error);
      return next(error);
    }
  }

  /**
   * Helper method to get format description
   */
  _getFormatDescription(format) {
    const descriptions = {
      csv: 'Comma-separated values, compatible with Excel and most spreadsheet applications',
      json: 'JavaScript Object Notation, suitable for APIs and data processing',
      xml: 'Extensible Markup Language, good for structured data exchange',
      excel: 'Microsoft Excel format, basic spreadsheet compatibility'
    };
    return descriptions[format] || 'Unknown format';
  }

  /**
   * Helper method to get format content type
   */
  _getFormatContentType(format) {
    const contentTypes = {
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
      excel: 'application/vnd.ms-excel'
    };
    return contentTypes[format] || 'application/octet-stream';
  }
}

module.exports = OrderController;
