/**
 * backend/test_boot.js
 * Script chẩn đoán lỗi khởi động server.
 */
console.log('--- STARTING SERVER BOOT DIAGNOSTIC ---');

try {
    console.log('1. Loading index.js...');
    require('./index');
    console.log('✅ index.js required successfully.');
} catch (error) {
    console.error('❌ CRASH DETECTED during index.js load:');
    console.error('Message:', error.message);
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error('Hint: Check for incorrect relative paths like ../../ vs ../../../');
    }
    console.error('Stack Trace:');
    console.error(error.stack);
    process.exit(1);
}

// Keep process alive for a bit to see if async errors pop up
setTimeout(() => {
    console.log('--- DIAGNOSTIC FINISHED (No immediate crash) ---');
    process.exit(0);
}, 3000);
