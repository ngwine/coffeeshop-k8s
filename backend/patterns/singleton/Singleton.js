/**
 * backend/patterns/singleton/Singleton.js
 * 🟢 PURE - Generic Singleton pattern utility
 * 
 * Ensures only ONE instance of a class exists.
 */

/**
 * Cung cấp cơ chế khởi tạo duy nhất một lần (Singleton Pattern)
 * @class Singleton
 */
class Singleton {
  static #instances = new Map();

  /**
   * Get or create singleton instance
   * @param {Function} TargetClass - Class to instantiate once
   * @param {...any} args - Constructor arguments
   * @returns {Object} Singleton instance
   */
  static getInstance(TargetClass, ...args) {
    const className = TargetClass.name;
    if (!Singleton.#instances.has(className)) {
      const instance = new TargetClass(...args);
      Singleton.#instances.set(className, instance);
      console.log(`✅ [Singleton] Created instance: ${className}`);
    }
    return Singleton.#instances.get(className);
  }

  static reset(TargetClass) {
    const className = TargetClass.name;
    Singleton.#instances.delete(className);
    console.log(`🔄 [Singleton] Reset instance: ${className}`);
  }

  static getAllInstances() {
    return new Map(Singleton.#instances);
  }
}

module.exports = Singleton;
