const path = require('path');
// Mute connectDB exit
process.env.PORT = 3009; 

try {
    console.log('--- STARTING AUDIT ---');
    
    const backendPath = path.resolve(__dirname, '../backend');
    
    console.log('1. Testing ProductFactory...');
    require(path.join(backendPath, 'patterns/factory/ProductFactory'));
    console.log('✅ Factory loaded');
    
    console.log('2. Testing ReviewObserver...');
    require(path.join(backendPath, 'patterns/observer/ReviewObserver'));
    console.log('✅ Observer loaded');

    console.log('3. Testing index.js (Full Boot Test)...');
    // We expect index.js to start the server. 
    // We'll wrap the require in a try-catch to see if it even gets past the 'require' phase.
    require(path.join(backendPath, 'index'));
    console.log('✅ index.js started initialization');

} catch (e) {
    console.error('\n❌ FATAL ERROR FOUND:');
    console.error('Message:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
}
