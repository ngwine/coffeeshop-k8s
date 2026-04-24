/**
 * backend/patterns/factory/CupMugProduct.js
 * 📦 Concrete Product cho loại Ly và Cốc
 */
const Product = require('./Product');

class CupMugProduct extends Product {
  constructor(payload = {}) {
    super(payload);
    this.category = 'Cups & Mugs';

    // Thiết lập tùy chọn mặc định nếu chưa có
    if (!this.variants || this.variants.length === 0) {
      this.variants = [
        {
          name: 'Dung tích',
          options: [
            { label: '350ml', priceDelta: 0 },
            { label: '500ml', priceDelta: 15000 }
          ]
        }
      ];
    }
  }

  getCategorySpecialInfo() {
    if (!this.variants || this.variants.length === 0) return "";

    // Tổng hợp tất cả các loại tùy chọn (vd: Dung tích, Màu sắc)
    const info = this.variants.map(v => {
      const options = v.options?.map(opt => opt.label).join(', ') || 'N/A';
      return `${v.name}: ${options}`;
    }).join(' | ');

    return `Tùy chọn thiết kế: ${info}`;
  }
}

module.exports = CupMugProduct;
