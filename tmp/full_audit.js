const path = require('path');
const fs = require('fs');

const backendDir = 'c:/Users/PC1/Documents/Zalo Received Files/CK_MTK/src/src/backend';
const patternsDir = path.join(backendDir, 'patterns');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

console.log('--- PATTERN IMPORT AUDIT ---');
const files = walk(patternsDir);
let errors = 0;

files.forEach(f => {
    try {
        require(f);
    } catch (e) {
        errors++;
        if (e.code === 'MODULE_NOT_FOUND') {
            const match = e.message.match(/Cannot find module '(.*?)'/);
            const missingModule = match ? match[1] : 'unknown';
            console.error(`❌ [FAIL] ${path.relative(patternsDir, f)} -> Missing: ${missingModule}`);
        } else {
            console.error(`⚠️  [RUNTIME] ${path.relative(patternsDir, f)} -> ${e.message}`);
        }
    }
});

console.log(`--- AUDIT COMPLETE: ${errors} errors found ---`);
if (errors > 0) process.exit(1);
