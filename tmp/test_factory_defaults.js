/**
 * tmp/test_factory_defaults.js
 * Script để kiểm tra các giá trị mặc định của Factory
 */
const ProductFactory = require('../backend/patterns/factory/ProductFactory');
const mongoose = require('mongoose');

// Giả lập payload tối giản (không có variants)
const payload = {
  name: 'Test Coffee Default',
  price: 100000
};

// 1. Kiểm tra Roasted Coffee
console.log('--- Testing Roasted Coffee ---');
const coffee = ProductFactory.createProduct('Roasted coffee', payload);
console.log('Category:', coffee.category);
console.log('Variants:', JSON.stringify(coffee.variants, null, 2));

// 2. Kiểm tra Coffee Maker
console.log('\n--- Testing Coffee Maker ---');
const maker = ProductFactory.createProduct('Coffee makers and grinders', { name: 'Test Maker' });
console.log('Category:', maker.category);
console.log('Variants:', JSON.stringify(maker.variants, null, 2));

// 3. Kiểm tra Combo
console.log('\n--- Testing Combo ---');
const combo = ProductFactory.createProduct('combo', { name: 'Test Combo' });
console.log('Category:', combo.category);
console.log('Variants:', JSON.stringify(combo.variants, null, 2));

if (coffee.variants && coffee.variants.length > 0 && maker.variants && maker.variants.length > 0) {
  console.log('\n✅ SUCCESS: Factory defaults are correctly applied!');
} else {
  console.log('\n❌ FAILURE: Missing defaults!');
}
