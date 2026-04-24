/**
 * Script: Seed Categories
 * Tự động thêm các danh mục chuẩn vào Database
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Danh mục chuẩn theo giao diện (khớp với OrganizeSection.tsx và ProductNavBar)
const STANDARD_CATEGORIES = [
  'Roasted coffee',
  'Coffee sets',
  'Cups & Mugs',
  'Coffee makers and grinders',
];

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CoffeeDB';
  console.log(`🔌 Connecting to: ${uri}`);
  await mongoose.connect(uri);
  console.log('✅ Connected!\n');

  // Lấy thêm danh mục từ sản phẩm thực tế
  const productCats = await Product.distinct('category');
  console.log(`📦 Categories found in Products: ${JSON.stringify(productCats)}`);

  // Gộp lại, loại trùng
  const allTargets = Array.from(new Set([...STANDARD_CATEGORIES, ...productCats.filter(Boolean)]));
  console.log(`\n📋 Total unique categories to ensure: ${allTargets.length}`);
  console.log(allTargets);

  // Kiểm tra và thêm từng cái
  let created = 0;
  let skipped = 0;
  for (const name of allTargets) {
    const exists = await Category.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
    if (!exists) {
      await Category.create({ name: name.trim(), isActive: true, description: 'System category' });
      console.log(`  ✨ Created: "${name}"`);
      created++;
    } else {
      console.log(`  ⏭️  Skip (exists): "${name}"`);
      skipped++;
    }
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
