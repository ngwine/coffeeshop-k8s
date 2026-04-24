const fs = require('fs');
const path = require('path');

const baseDir = 'c:/Users/PC1/Documents/Zalo Received Files/CK_MTK/src/src/backend/patterns';

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('../../../')) {
                const newContent = content.replace(/\.\.\/\.\.\/\.\.\//g, '../../');
                fs.writeFileSync(fullPath, newContent);
                console.log(`✅ Fixed: ${file}`);
            }
        }
    }
}
try {
    console.log('🚀 Final path fix starting...');
    walk(baseDir);
    console.log('✨ All fixed.');
} catch (e) {
    console.error('❌ Error:', e.message);
}
