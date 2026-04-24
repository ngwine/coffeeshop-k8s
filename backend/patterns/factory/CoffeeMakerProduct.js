/**
 * backend/patterns/factory/CoffeeMakerProduct.js
 * 📦 Concrete Product cho loại Máy pha cà phê
 */
const Product = require('./Product');

class CoffeeMakerProduct extends Product {
  constructor(payload = {}) {
    super(payload);
    this.category = 'Coffee makers and grinders';

    // Thiết lập tùy chọn mặc định nếu chưa có
    if (!this.variants || this.variants.length === 0) {
      this.variants = [
        {
          name: 'Phiên bản',
          options: [
            { label: 'Standard', priceDelta: 0 },
            { label: 'Premium Edition', priceDelta: 500000 }
          ]
        }
      ];
    }
  }

  getCategorySpecialInfo() {
    if (!this.variants || this.variants.length === 0) return "";

    // Tổng hợp tất cả các loại tùy chọn (vd: Màu sắc, Công suất)
    const info = this.variants.map(v => {
      const options = v.options?.map(opt => opt.label).join(', ') || 'N/A';
      return `${v.name}: ${options}`;
    }).join(' | ');

    return `Các phiên bản: ${info}`;
  }
}

module.exports = CoffeeMakerProduct;
