/**
 * backend/fix_diagnostic.js
 * Script chẩn đoán lỗi import cụ thể cho từng pattern.
 */
const filesToTest = [
    './patterns/factory/ProductFactory',
    './patterns/observer/ReviewObserver',
    './patterns/singleton/CartService',
    './patterns/repository/ProductRepository',
    './patterns/repository/OrderRepository',
    './patterns/repository/AuthRepository',
    './patterns/adapter/MongooseRepositoryAdapter'
];

console.log('--- 🔍 BẮT ĐẦU KIỂM TRA ĐƯỜNG DẪN ---');

filesToTest.forEach(p => {
    try {
        require(p);
        console.log(`✅ [OK]   ${p}`);
    } catch (e) {
        console.log(`❌ [FAIL] ${p}`);
        console.log(`   👉 Lỗi: ${e.message}`);
        if (e.stack.includes('internal/modules/cjs/loader.js')) {
            // Đây là lỗi Module not found, thường do sai ../
        }
    }
});

console.log('--- 🏁 KẾT THÚC KIỂM TRA ---');
