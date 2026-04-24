/**
 * backend/patterns/adapter/LocalStorageAdapter.js
 * 🔌 ADAPTER - LocalStorage implementation (for browser/frontend equivalence)
 */
const Storage = require('./Storage');

class LocalStorageAdapter extends Storage {
  constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : null;
  }

  async get(key) {
    return this.storage ? this.storage.getItem(key) : null;
  }

  async set(key, value) {
    if (this.storage) {
      this.storage.setItem(key, value);
      return true;
    }
    return false;
  }

  async delete(key) {
    if (this.storage) {
      this.storage.removeItem(key);
      return true;
    }
    return false;
  }
}

module.exports = LocalStorageAdapter;
