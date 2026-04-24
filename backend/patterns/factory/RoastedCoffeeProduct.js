/**
 * backend/patterns/factory/RoastedCoffeeProduct.js
 * 📦 Concrete Product cho loại Cà phê đã rang
 */
const Product = require('./Product');

class RoastedCoffeeProduct extends Product {
  constructor(payload = {}) {
    super(payload);
    this.category = 'Roasted coffee';

    // Thiết lập tùy chọn mặc định nếu chưa có
    if (!this.variants || this.variants.length === 0) {
      this.variants = [
        {
          name: 'Trọng lượng',
          options: [
            { label: '250g', priceDelta: 0 },
            { label: '500g', priceDelta: 45000 },
            { label: '1kg', priceDelta: 85000 }
          ]
        }
      ];
    }
  }

  getCategorySpecialInfo() {
    if (!this.variants || this.variants.length === 0) return "";

    // Tổng hợp tất cả các loại tùy chọn hiện có
    const info = this.variants.map(v => {
      const options = v.options?.map(opt => opt.label).join(', ') || 'N/A';
      return `${v.name}: ${options}`;
    }).join(' | ');

    return `Các tùy chọn hiện có: ${info}`;
  }
}

module.exports = RoastedCoffeeProduct;
