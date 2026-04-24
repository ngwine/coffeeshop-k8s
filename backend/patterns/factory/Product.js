/**
 * backend/patterns/factory/Product.js
 * 📦 Lớp cơ sở cho các loại sản phẩm
 */

/**
 * Lớp cơ sở cho thực thể Sản phẩm (Factory Pattern)
 * @class Product
 */
class Product {
  constructor(payload = {}) {
    this.id = payload.id || payload._id || null;
    this.category = payload.category || 'general';
    this.name = payload.name || 'Sản phẩm';
    this.price = payload.price || 0;
    this.stock = payload.stock !== undefined ? payload.stock : true;
    this.sku = payload.sku || `SKU-${Date.now()}`;
    this.description = payload.description || '';
    this.variants = payload.variants || [];
    
    Object.assign(this, payload);
  }

  getDisplayPrice() {
    return `${this.price.toLocaleString('vi-VN')} VND`;
  }

  /**
   * ✅ POLYMORPHISM: Các subclass sẽ ghi đè (override) để hiển thị thông tin đặc trưng
   */
  getCategorySpecialInfo() {
    return `Standard product details for ${this.name}`;
  }
}

module.exports = Product;
