/**
 * backend/patterns/factory/CoffeeSetProduct.js
 * 📦 Concrete Product cho loại Coffee Sets (Quà tặng)
 */
const Product = require('./Product');

class CoffeeSetProduct extends Product {
  constructor(payload = {}) {
    super(payload);
    this.category = 'Coffee sets';

    // Thiết lập tùy chọn mặc định nếu chưa có
    if (!this.variants || this.variants.length === 0) {
      this.variants = [
        {
          name: 'Loại bộ',
          options: [
            { label: 'Bộ tiêu chuẩn', priceDelta: 0 },
            { label: 'Hộp quà cao cấp', priceDelta: 120000 }
          ]
        }
      ];
    }
  }

  getCategorySpecialInfo() {
    if (!this.variants || this.variants.length === 0) return "";

    // Tổng hợp tất cả các loại tùy chọn (vd: Loại bộ, Thành phần)
    const info = this.variants.map(v => {
      const options = v.options?.map(opt => opt.label).join(', ') || 'N/A';
      return `${v.name}: ${options}`;
    }).join(' | ');

    return `Lựa chọn: ${info}`;
  }
}

module.exports = CoffeeSetProduct;
