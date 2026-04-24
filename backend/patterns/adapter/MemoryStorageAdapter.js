/**
 * backend/patterns/adapter/MemoryStorageAdapter.js
 * 🔌 ADAPTER - In-memory storage implementation
 */

const Singleton = require('../singleton/Singleton');
const Storage = require('./Storage');

class MemoryStorageAdapter extends Storage {
  #data = new Map();

  static getInstance() {
    return Singleton.getInstance(MemoryStorageAdapter);
  }

  async get(key) {
    return this.#data.get(key);
  }

  async set(key, value) {
    this.#data.set(key, value);
    return true;
  }

  async delete(key) {
    return this.#data.delete(key);
  }

  async clear() {
    this.#data.clear();
  }
}

module.exports = MemoryStorageAdapter;
