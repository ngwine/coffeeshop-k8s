/**
 * backend/patterns/factory/ComboProduct.js
 * 📦 Concrete Product cho loại Combo
 */

const Product = require('./Product');

class ComboProduct extends Product {
  constructor(payload = {}) {
    super({
      category: 'combo',
      name: payload.name || 'Combo',
      price: payload.price || 200000,
      stock: payload.stock !== undefined ? payload.stock : true,
      sku: payload.sku || `CMB-${Date.now()}`,
      description: payload.description || 'Combo tiết kiệm',
      ...payload,
    });

    // Thiết lập tùy chọn mặc định nếu chưa có
    if (!this.variants || this.variants.length === 0) {
      this.variants = [
        {
          name: 'Loại Combo',
          options: [
            { label: 'Tiết kiệm', priceDelta: 0 },
            { label: 'Đặc biệt', priceDelta: 50000 }
          ]
        }
      ];
    }
  }

  getCategorySpecialInfo() {
    if (!this.variants || this.variants.length === 0) return "";

    const info = this.variants.map(v => {
      const options = v.options?.map(opt => opt.label).join(', ') || 'N/A';
      return `${v.name}: ${options}`;
    }).join(' | ');

    return `Tùy chọn Combo: ${info}`;
  }
}

module.exports = ComboProduct;
