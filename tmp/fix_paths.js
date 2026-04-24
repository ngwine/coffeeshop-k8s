const fs = require('fs');
const path = require('path');

const patternsDir = 'c:/Users/PC1/Documents/Zalo Received Files/CK_MTK/src/src/backend/patterns';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Regex tìm kiếm các đường dẫn bị nhảy quá 1 cấp (../../../)
    // và thay thế bằng cấp độ đúng (../../)
    const oldPathRegex = /\.\.\/\.\.\/\.\.\/(models|config|utils|middleware)/g;
    const newPath = '../../$1';
    
    if (oldPathRegex.test(content)) {
        const updatedContent = content.replace(oldPathRegex, newPath);
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ Fixed: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.js')) {
            processFile(fullPath);
        }
    });
}

console.log('🚀 Starting path fix in backend/patterns/...');
walkDir(patternsDir);
console.log('✨ All paths fixed successfully.');
