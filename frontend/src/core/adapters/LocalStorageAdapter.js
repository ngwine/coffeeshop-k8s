/**
 * frontend/src/core/adapters/LocalStorageAdapter.js
 * 🔗 ADAPTER - Browser localStorage implementation
 * 
 * Implements CartStore interface using browser localStorage
 * Framework coupling isolated to this file ONLY!
 */

import CartStore from '../interfaces/CartStore';

class LocalStorageAdapter extends CartStore {
  constructor() {
    super();
    this.name = 'LocalStorageAdapter';
    console.log('✅ [LocalStorageAdapter] Created');
  }

  /**
   * Get items from localStorage
   */
  async getItems(userKey) {
    try {
      const raw = localStorage.getItem(userKey);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('[LocalStorageAdapter] getItems() error:', error);
      return [];
    }
  }

  /**
   * Save items to localStorage
   */
  async setItems(userKey, items) {
    try {
      localStorage.setItem(userKey, JSON.stringify(items));
    } catch (error) {
      console.error('[LocalStorageAdapter] setItems() error:', error);
    }
  }

  /**
   * Clear items from localStorage
   */
  async clear(userKey) {
    try {
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('[LocalStorageAdapter] clear() error:', error);
    }
  }

  /**
   * Subscribe to storage changes across tabs/windows
   * Uses browser 'storage' event for cross-tab synchronization
   */
  subscribe(userKey, callback) {
    const handleStorageChange = (event) => {
      if (event.key === userKey && event.newValue) {
        try {
          const items = JSON.parse(event.newValue);
          callback(items);
        } catch (error) {
          console.error('[LocalStorageAdapter] subscribe() parsing error:', error);
        }
      }
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

export default LocalStorageAdapter;
