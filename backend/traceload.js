/**
 * traceload.js
 * Traces every require call to find the exact file that crashes or hangs.
 */
const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(request) {
    const filename = Module._resolveFilename(request, this);
    if (filename.includes('backend') && !filename.includes('node_modules')) {
        console.log(`🔍 Loading: ${filename}`);
    }
    return originalRequire.apply(this, arguments);
};

console.log('--- STARTING TRACE ---');
try {
    require('./index');
    console.log('✅ Load complete');
} catch (e) {
    console.error('❌ CRASHED IN:', e.stack);
}
