/**
 * backend/patterns/factory/CoffeeProduct.js
 * 📦 Concrete Product cho loại Cà phê
 */

const Product = require('./Product');

class CoffeeProduct extends Product {
  constructor(payload = {}) {
    super({
      category: 'coffee',
      name: payload.name || 'Cà phê đặc biệt',
      price: payload.price || 50000,
      stock: payload.stock !== undefined ? payload.stock : true,
      sku: payload.sku || `COF-${Date.now()}`,
      description: payload.description || 'Cà phê nguyên chất',
      ...payload,
    });

    // Thiết lập tùy chọn mặc định nếu chưa có
    if (!this.variants || this.variants.length === 0) {
      this.variants = [
        {
          name: 'Trọng lượng',
          options: [
            { label: '250g', priceDelta: 0 },
            { label: '500g', priceDelta: 40000 }
          ]
        }
      ];
    }
  }
}

module.exports = CoffeeProduct;
