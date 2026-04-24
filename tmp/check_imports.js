const path = require('path');
const fs = require('fs');

const backendDir = 'c:/Users/PC1/Documents/Zalo Received Files/CK_MTK/src/src/backend';

const testPaths = [
    "./patterns/repository/ProductRepository",
    "./patterns/repository/OrderRepository",
    "./patterns/repository/AccountRepository",
    "./patterns/repository/AuthRepository",
    "./patterns/repository/CategoryRepository",
    "./patterns/repository/CustomerRepository",
    "./patterns/repository/ReviewRepository",
    "./patterns/repository/UploadRepository",
    "./patterns/observer/ReviewObserver",
    "./patterns/singleton/CartService",
    "./patterns/factory/ProductFactory",
    "./routes/products",
    "./routes/auth",
    "./routes/orders",
    "./routes/review"
];

console.log('🔍 Checking Backend Imports...');
testPaths.forEach(p => {
    try {
        const fullPath = path.resolve(backendDir, p);
        require(fullPath);
        console.log(`✅ [OK] ${p}`);
    } catch (e) {
        console.log(`❌ [FAIL] ${p}: ${e.message}`);
    }
});
