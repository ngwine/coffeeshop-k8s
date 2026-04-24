/**
 * backend/patterns/factory/AccessoryProduct.js
 * 📦 Concrete Product cho loại Phụ kiện
 */

const Product = require('./Product');

class AccessoryProduct extends Product {
  constructor(payload = {}) {
    super({
      category: 'accessory',
      name: payload.name || 'Phụ kiện',
      price: payload.price || 150000,
      stock: payload.stock !== undefined ? payload.stock : true,
      sku: payload.sku || `ACC-${Date.now()}`,
      description: payload.description || 'Phụ kiện đi kèm',
      ...payload,
    });

    // Thiết lập tùy chọn mặc định nếu chưa có
    if (!this.variants || this.variants.length === 0) {
      this.variants = [
        {
          name: 'Màu sắc',
          options: [
            { label: 'Trắng', priceDelta: 0 },
            { label: 'Đen', priceDelta: 0 }
          ]
        }
      ];
    }
  }
}

module.exports = AccessoryProduct;
