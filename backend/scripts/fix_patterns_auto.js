const fs = require('fs');
const path = require('path');

const patternsDir = './patterns';

console.log('--- 🚀 ĐANG TỰ ĐỘNG SỬA ĐƯỜNG DẪN PATTERNS (RECURSIVE) ---');

function processDir(dirPath, depth = 0) {
    if (!fs.existsSync(dirPath)) return;
    
    fs.readdirSync(dirPath).forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath, depth + 1);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            // Nếu file ở độ sâu 2 (ví dụ: patterns/repository/X.js) -> depth = 1 từ patternsDir
            // Nếu file ở độ sâu 3 (ví dụ: patterns/strategy/payment/X.js) -> depth = 2 từ patternsDir
            
            // Xử lý chung các lỗi phổ biến
            newContent = newContent
                .replace(/\.\.\/\.\.\/\.\.\/models/g, depth === 1 ? '../../models' : '../../../models')
                .replace(/\.\.\/\.\.\/\.\.\/adapter/g, depth === 1 ? '../adapter' : '../../adapter')
                .replace(/\.\.\/\.\.\/\.\.\/factory/g, depth === 1 ? '../factory' : '../../factory')
                .replace(/\.\.\/\.\.\/\.\.\/services/g, depth === 1 ? '../../services' : '../../../services');

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`✅ Đã sửa (${depth}): ${fullPath}`);
            }
        }
    });
}

processDir(patternsDir, 0);
console.log('--- ✨ HOÀN TẤT SỬA LỖI ---');

