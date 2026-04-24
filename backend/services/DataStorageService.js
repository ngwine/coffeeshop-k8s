/**
 * Data Storage Pattern - DAO (Data Access Object) Pattern with Caching
 * Repository Pattern with advanced features: caching, connection pooling, monitoring
 */

const mongoose = require('mongoose');

// Connection Pool Manager - Singleton Pattern
class ConnectionPoolManager {
  constructor() {
    if (ConnectionPoolManager.instance) {
      return ConnectionPoolManager.instance;
    }

    this.connections = new Map();
    this.maxConnections = 10;
    this.connectionTimeout = 30000; // 30 seconds
    ConnectionPoolManager.instance = this;
  }

  /**
   * Get or create database connection
   */
  async getConnection(dbName, connectionString) {
    if (this.connections.has(dbName)) {
      const connection = this.connections.get(dbName);
      if (connection.readyState === 1) { // Connected
        return connection;
      }
      // Remove stale connection
      this.connections.delete(dbName);
    }

    if (this.connections.size >= this.maxConnections) {
      throw new Error('Maximum connection pool size reached');
    }

    try {
      const connection = await mongoose.createConnection(connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: this.connectionTimeout,
        socketTimeoutMS: this.connectionTimeout,
        bufferCommands: false,
        bufferMaxEntries: 0,
      });

      this.connections.set(dbName, connection);

      // Handle connection events
      connection.on('error', (err) => {
        console.error(`Connection error for ${dbName}:`, err);
        this.connections.delete(dbName);
      });

      connection.on('disconnected', () => {
        console.log(`Disconnected from ${dbName}`);
        this.connections.delete(dbName);
      });

      return connection;
    } catch (error) {
      console.error(`Failed to connect to ${dbName}:`, error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async closeAll() {
    for (const [dbName, connection] of this.connections) {
      await connection.close();
    }
    this.connections.clear();
  }

  /**
   * Get connection stats
   */
  getStats() {
    const stats = {};
    for (const [dbName, connection] of this.connections) {
      stats[dbName] = {
        readyState: connection.readyState,
        name: connection.name,
        host: connection.host,
        port: connection.port,
      };
    }
    return stats;
  }
}

// Cache Manager - Singleton Pattern
class CacheManager {
  constructor() {
    if (CacheManager.instance) {
      return CacheManager.instance;
    }

    this.cache = new Map();
    this.defaultTTL = 300000; // 5 minutes
    CacheManager.instance = this;

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Set cache entry
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get cache entry
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Base DAO Class - Template Method Pattern
class BaseDAO {
  constructor(model, options = {}) {
    this.model = model;
    this.cacheManager = new CacheManager();
    this.connectionPool = new ConnectionPoolManager();
    this.cacheEnabled = options.cacheEnabled !== false;
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes
    this.collectionName = model.collection.name;
  }

  /**
   * Generate cache key
   */
  _generateCacheKey(operation, params = {}) {
    return `${this.collectionName}:${operation}:${JSON.stringify(params)}`;
  }

  /**
   * Execute with caching
   */
  async _executeWithCache(cacheKey, operation, params = {}) {
    if (this.cacheEnabled) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const result = await operation(params);

    if (this.cacheEnabled) {
      this.cacheManager.set(cacheKey, result, this.cacheTTL);
    }

    return result;
  }

  /**
   * Find documents with caching
   */
  async find(query = {}, options = {}) {
    const cacheKey = this._generateCacheKey('find', { query, options });

    return this._executeWithCache(cacheKey, async () => {
      return this.model.find(query, null, options).lean();
    });
  }

  /**
   * Find one document with caching
   */
  async findOne(query = {}, options = {}) {
    const cacheKey = this._generateCacheKey('findOne', { query, options });

    return this._executeWithCache(cacheKey, async () => {
      return this.model.findOne(query, null, options).lean();
    });
  }

  /**
   * Find by ID with caching
   */
  async findById(id, options = {}) {
    const cacheKey = this._generateCacheKey('findById', { id, options });

    return this._executeWithCache(cacheKey, async () => {
      return this.model.findById(id, null, options).lean();
    });
  }

  /**
   * Create document (no caching for writes)
   */
  async create(data) {
    const result = await this.model.create(data);

    // Invalidate related cache
    this._invalidateCache();

    return result;
  }

  /**
   * Update document (no caching for writes)
   */
  async update(id, data, options = {}) {
    const result = await this.model.findByIdAndUpdate(id, data, {
      new: true,
      ...options
    }).lean();

    // Invalidate related cache
    this._invalidateCache();

    return result;
  }

  /**
   * Delete document (no caching for writes)
   */
  async delete(id) {
    const result = await this.model.findByIdAndDelete(id);

    // Invalidate related cache
    this._invalidateCache();

    return result;
  }

  /**
   * Count documents with caching
   */
  async count(query = {}) {
    const cacheKey = this._generateCacheKey('count', { query });

    return this._executeWithCache(cacheKey, async () => {
      return this.model.countDocuments(query);
    });
  }

  /**
   * Aggregate with caching
   */
  async aggregate(pipeline, options = {}) {
    const cacheKey = this._generateCacheKey('aggregate', { pipeline, options });

    return this._executeWithCache(cacheKey, async () => {
      return this.model.aggregate(pipeline, options);
    });
  }

  /**
   * Invalidate cache for this collection
   */
  _invalidateCache() {
    if (!this.cacheEnabled) return;

    // Remove all cache entries for this collection
    const keysToDelete = [];
    for (const key of this.cacheManager.cache.keys()) {
      if (key.startsWith(`${this.collectionName}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cacheManager.delete(key));
  }

  /**
   * Get DAO statistics
   */
  getStats() {
    return {
      collection: this.collectionName,
      cacheEnabled: this.cacheEnabled,
      cacheStats: this.cacheManager.getStats(),
      connectionStats: this.connectionPool.getStats(),
    };
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this._invalidateCache();
    }
  }

  /**
   * Set cache TTL
   */
  setCacheTTL(ttl) {
    this.cacheTTL = ttl;
  }
}

// Specialized DAO for Orders
class OrderDAO extends BaseDAO {
  constructor(orderModel, customerModel) {
    super(orderModel, { cacheEnabled: true, cacheTTL: 600000 }); // 10 minutes cache
    this.customerModel = customerModel;
  }

  /**
   * Find orders with customer details
   */
  async findOrdersWithCustomers(query = {}, options = {}) {
    const cacheKey = this._generateCacheKey('findOrdersWithCustomers', { query, options });

    return this._executeWithCache(cacheKey, async () => {
      return this.model.find(query, null, options)
        .populate('customerId', 'fullName email phone')
        .lean();
    });
  }

  /**
   * Get order statistics
   */
  async getOrderStats(timeRange = 'all') {
    const cacheKey = this._generateCacheKey('getOrderStats', { timeRange });

    return this._executeWithCache(cacheKey, async () => {
      const now = new Date();
      let startDate = null;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const matchStage = startDate ? { createdAt: { $gte: startDate } } : {};

      const stats = await this.model.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageOrder: { $avg: '$totalAmount' },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats.length > 0 ? stats[0] : {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrder: 0,
        completedOrders: 0,
        cancelledOrders: 0
      };
    });
  }

  /**
   * Export orders for reporting
   */
  async exportOrders(filters = {}) {
    const cacheKey = this._generateCacheKey('exportOrders', { filters });

    return this._executeWithCache(cacheKey, async () => {
      const query = {};

      if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      return this.model.find(query)
        .populate('customerId', 'fullName email')
        .select('displayCode totalAmount status createdAt customerId')
        .sort({ createdAt: -1 })
        .lean();
    });
  }
}

// DAO Factory - Factory Pattern
class DAOFactory {
  constructor() {
    this.daos = new Map();
    this.connectionPool = new ConnectionPoolManager();
  }

  /**
   * Create DAO instance
   */
  createDAO(modelName, model, ...dependencies) {
    const key = `${modelName}:${model.collection.name}`;

    if (this.daos.has(key)) {
      return this.daos.get(key);
    }

    let dao;

    switch (modelName) {
      case 'Order':
        dao = new OrderDAO(model, ...dependencies);
        break;
      default:
        dao = new BaseDAO(model);
    }

    this.daos.set(key, dao);
    return dao;
  }

  /**
   * Get DAO instance
   */
  getDAO(modelName, collectionName) {
    const key = `${modelName}:${collectionName}`;
    return this.daos.get(key) || null;
  }

  /**
   * Get all DAO stats
   */
  getAllStats() {
    const stats = {};
    for (const [key, dao] of this.daos) {
      stats[key] = dao.getStats();
    }
    return stats;
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    for (const dao of this.daos.values()) {
      if (dao.cacheManager) {
        dao.cacheManager.clear();
      }
    }
  }
}

module.exports = {
  ConnectionPoolManager,
  CacheManager,
  BaseDAO,
  OrderDAO,
  DAOFactory
};