const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');
const Category = require('../models/Category');

async function migrate() {
    try {
        console.log('📡 Đang kết nối database...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/CoffeeDB');
        
        console.log('🔍 Đang tìm kiếm category từ mẫu sản phẩm...');
        const categories = await Product.distinct('category');
        
        console.log(`✨ Phát hiện ${categories.length} danh mục. Đang đồng bộ...`);
        let count = 0;
        for (const name of categories) {
            if (name) {
                await Category.findOneAndUpdate(
                    { name: name.trim() }, 
                    { name: name.trim(), updatedAt: new Date() }, 
                    { upsert: true }
                );
                count++;
            }
        }
        
        console.log(`✅ Hoàn thành: Đã đồng bộ ${count} danh mục vào bảng mới.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi Migration:', err.message);
        process.exit(1);
    }
}

migrate();
