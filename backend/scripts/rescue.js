const fs = require('fs');
const path = require('path');

const junkFiles = ["'", "{", "backend@1.0.0"];
console.log('--- 🧹 ĐANG DỌN DẸP MÔI TRƯỜNG ---');

junkFiles.forEach(f => {
    try {
        const fullPath = path.join(__dirname, '..', f);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Đã xóa file rác: ${f}`);
        }
    } catch (e) {
        // Bỏ qua nếu lỗi
    }
});

console.log('--- ⚙️ ĐANG KHỞI ĐỘNG CHẨN ĐOÁN SERVER ---');
try {
    require('../index');
} catch (e) {
    console.error('\n❌ LỖI THỰC SỰ LÀ:');
    console.error(e.stack);
}
