/**
 * backend/patterns/factory/GeneralProduct.js
 * 📦 Concrete Product cho các loại sản phẩm không xác định
 */

const Product = require('./Product');

class GeneralProduct extends Product {
  constructor(payload = {}) {
    super({
      category: payload.category || 'general',
      name: payload.name || 'Sản phẩm chung',
      price: payload.price || 100000,
      stock: payload.stock !== undefined ? payload.stock : true,
      sku: payload.sku || `PRD-${Date.now()}`,
      description: payload.description || '',
      ...payload,
    });
  }
}

module.exports = GeneralProduct;
