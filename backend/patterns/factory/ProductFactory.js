/**
 * backend/patterns/factory/ProductFactory.js
 * 📦 FACTORY - Creates different product types using concrete classes
 * Updated to use separated product classes
 */

const RoastedCoffeeProduct = require('./RoastedCoffeeProduct');
const CoffeeSetProduct = require('./CoffeeSetProduct');
const CoffeeMakerProduct = require('./CoffeeMakerProduct');
const CupMugProduct = require('./CupMugProduct');
const ComboProduct = require('./ComboProduct');
const AccessoryProduct = require('./AccessoryProduct');
const CoffeeProduct = require('./CoffeeProduct');
const Product = require('./Product');

class ProductFactory {
  /**
   * Factory Method: Tạo sản phẩm dựa trên danh mục (Category)
   * @param {string} category - Danh mục sản phẩm từ Frontend
   * @param {Object} payload - Dữ liệu người dùng nhập
   * @returns {Product} Một instance của lớp sản phẩm tương ứng
   */
  static createProduct(category, payload = {}) {
    const cat = (category || '').toLowerCase();

    let product;
    if (cat.includes('roasted')) {
      product = new RoastedCoffeeProduct(payload);
    } else if (cat.includes('set')) {
      product = new CoffeeSetProduct(payload);
    } else if (cat.includes('maker') || cat.includes('grinder')) {
      product = new CoffeeMakerProduct(payload);
    } else if (cat.includes('cup') || cat.includes('mug')) {
      product = new CupMugProduct(payload);
    } else if (cat.includes('combo')) {
      product = new ComboProduct(payload);
    } else if (cat.includes('accessory')) {
      product = new AccessoryProduct(payload);
    } else if (cat.includes('coffee') && !cat.includes('roasted')) {
      product = new CoffeeProduct(payload);
    } else {
      product = new Product(payload); // Loại chung
    }

    console.log(`✅ [ProductFactory] Instantiated ${product.constructor.name} for Category: "${category}"`);
    console.log(`📦 [Factory Details] Unique attributes assigned: ${Object.keys(product).filter(k => !['id', 'name', 'price', 'sku'].includes(k)).join(', ')}`);
    
    return product;
  }
}

module.exports = ProductFactory;
