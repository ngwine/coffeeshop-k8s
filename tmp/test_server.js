const path = require('path');
const fs = require('fs');

const backendDir = 'c:/Users/PC1/Documents/Zalo Received Files/CK_MTK/src/src/backend';

try {
    console.log('🔍 Testing individual module loads...');
    
    // Step 1: Repositories
    const repoPath = path.join(backendDir, 'patterns/repository/ProductRepository');
    console.log(`Checking: ${repoPath}`);
    require(repoPath);
    console.log('✅ ProductRepository OK');

    // Step 2: Index
    const indexPath = path.join(backendDir, 'index');
    console.log(`Checking: ${indexPath}`);
    require(indexPath);
    console.log('✅ index.js OK');

} catch (e) {
    console.error('❌ CRASH DETECTED:');
    console.error(e.message);
    console.error(e.stack);
    process.exit(1);
}
