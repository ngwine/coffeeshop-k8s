/**
 * backend/patterns/adapter/Storage.js
 * 🟢 PURE - Generic storage interface
 * 
 * Defines the contract for all storage adapters (Memory, LocalStorage, Redis, etc.)
 */

class Storage {
  async get(key) { throw new Error('get() must be implemented'); }
  async set(key, value) { throw new Error('set() must be implemented'); }
  async delete(key) { throw new Error('delete() must be implemented'); }
  async clear() { throw new Error('clear() must be implemented'); }
}

module.exports = Storage;
