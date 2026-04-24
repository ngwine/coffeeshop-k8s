/**
 * frontend/src/core/interfaces/CartStore.js
 * 🔗 PURE INTERFACE - Contract for cart data storage
 * 
 * Defines the interface for any cart storage implementation.
 * Implementations can be: localStorage, indexedDB, sessionStorage, memory, etc.
 */

class CartStore {
  /**
   * Get all items in cart for user
   * @returns {Promise<Array>} Array of cart items
   */
  async getItems(userKey) {
    throw new Error('getItems() must be implemented');
  }

  /**
   * Save cart items for user
   * @param {string} userKey - User identifier
   * @param {Array} items - Cart items to save
   */
  async setItems(userKey, items) {
    throw new Error('setItems() must be implemented');
  }

  /**
   * Clear cart for user
   */
  async clear(userKey) {
    throw new Error('clear() must be implemented');
  }

  /**
   * Listen for cart changes (for sync across tabs)
   * @param {string} userKey - User identifier
   * @param {Function} callback - Called when cart changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(userKey, callback) {
    throw new Error('subscribe() must be implemented');
  }
}

export default CartStore;
