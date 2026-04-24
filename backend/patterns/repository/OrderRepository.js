/**
 * OrderRepository - PURE VERSION
 * Organized into patterns/repository
 */

const MongooseRepositoryAdapter = require('../adapter/MongooseRepositoryAdapter');
const { OrderDAO, DAOFactory } = require('../../services/DataStorageService');

class OrderRepository {
  constructor(OrderModel, CustomerModel, DiscountCodeModel) {
const Order = OrderModel || require('../../models/Order');
    const Customer = CustomerModel || require('../../models/Customer');
    const DiscountCode = DiscountCodeModel || require('../../models/DiscountCode');
    
    this.adapter = new MongooseRepositoryAdapter(Order);
    this.Order = Order;
    this.Customer = Customer;
    this.DiscountCode = DiscountCode;
    this.daoFactory = new DAOFactory();
    this.orderDAO = this.daoFactory.createDAO('Order', Order, Customer);
  }

  async findPaginated(filters = {}, options = {}) {
    const { page = 1, limit = 10, searchTerm = '', status = [], sort = '-createdAt' } = options;
    const criteria = this._buildOrderCriteria(filters, searchTerm, status);
    const result = await this.adapter.find(criteria, { page, limit, sort });

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: result.pages,
    };
  }

  /**
   * @param {string} orderId
   */
  async findById(orderId) {
    return await this.orderDAO.findById(orderId);
  }

  /**
   * @param {string} customerId
   */
  async findByCustomerId(customerId, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const criteria = { customerId: customerId };
    return await this.adapter.find(criteria, { page, limit, sort });
  }

  async create(orderData) {
    const order = {
      ...orderData,
      createdAt: new Date(),
      status: orderData.status || 'pending',
    };
    return await this.adapter.create(order);
  }

  /**
   * @param {string} orderId
   */
  async update(orderId, updateData) {
    const data = {
      ...updateData,
      updatedAt: new Date(),
    };
    return await this.adapter.update(orderId, data);
  }

  async updateStatus(orderId, updates) {
    const { status, paymentStatus, notes } = updates;
    const data = {
      updatedAt: new Date()
    };
    
    if (status) {
      data.status = status;
      data.statusUpdatedAt = new Date();
    }
    
    if (paymentStatus) {
      data.paymentStatus = paymentStatus;
    }
    
    if (notes) {
      data.notes = notes;
    }
    
    // First, try to update by _id (standard Mongoose)
    try {
      const updated = await this.adapter.update(orderId, data);
      if (updated) return updated;
    } catch (err) {
      // If CastError, it's likely a displayCode
      if (err.message.includes('Cast to ObjectId failed') || err.name === 'CastError') {
        // Fallback: update by displayCode (field name is 'id' in Schema)
        return await this.adapter.update({ id: orderId }, data);
      }
      throw err;
    }
    
    // Final fallback if update returned null
    return await this.adapter.update({ id: orderId }, data);
  }

  async delete(orderId) {
    return await this.adapter.delete(orderId);
  }

  async findByStatus(status, options = {}) {
    const criteria = { status: status };
    return await this.adapter.find(criteria, options);
  }

  async findByCustomerEmail(email, options = {}) {
    const criteria = { customerEmail: email };
    return await this.adapter.find(criteria, options);
  }

  async getOrderStats(filters = {}) {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      { $sort: { count: -1 } },
    ];
    return await this.adapter.aggregate(pipeline);
  }

  _buildOrderCriteria(filters, searchTerm, statusArray) {
    const criteria = {};
    Object.keys(filters).forEach((key) => {
      criteria[key] = filters[key];
    });
    if (searchTerm) {
      criteria._searchFields = ['customerName', 'customerEmail', 'displayCode'];
      criteria._searchTerm = searchTerm;
    }
    if (Array.isArray(statusArray) && statusArray.length > 0) {
      criteria.status = { _in: statusArray };
    }
    return criteria;
  }

  async findRecent(limit = 10) {
    return await this.adapter.find({}, { limit, sort: '-createdAt' });
  }

  async countByStatus(status) {
    return await this.adapter.count({ status });
  }

  async orderExists(orderId) {
    return await this.adapter.exists({ _id: orderId });
  }

  /**
   * Validate a discount code
   * @param {string} code - The code to validate
   * @returns {Object|null} - The discount object if valid, else null
   */
  async validateDiscountCode(code) {
    if (!this.DiscountCode) return null;
    try {
      const discount = await this.DiscountCode.findOne({ 
        code: code.toUpperCase(),
        isActive: true 
      });
      
      if (!discount) return null;
      
      const now = new Date();
      if (discount.startDate && now < discount.startDate) return null;
      if (discount.endDate && now > discount.endDate) return null;
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) return null;
      
      return discount;
    } catch (error) {
      console.error("❌ Error validating discount code:", error.message);
      return null;
    }
  }
}

module.exports = OrderRepository;
