/**
 * backend/patterns/singleton/CartService.js
 * 🛒 SINGLETON + OBSERVER - Quản lý giỏ hàng và thông báo thay đổi
 * 
 * ✅ Singleton: Đảm bảo chỉ có một instance duy nhất quản lý Cart.
 * ✅ Observer: Thông báo cho UI/hệ thống khi sản phẩm trong giỏ hàng thay đổi.
 */

const CartObserver = require('../observer/CartObserver');

const Singleton = require('./Singleton');

class CartService {
  static #storage = null;
  static #currentUserEmail = null;

  #items = [];
  #userObserver = null;

  constructor() {
    this.#userObserver = new CartObserver();
    console.log('✅ [CartService] New instance initialized');
  }

  /**
   * ✅ Singleton Pattern: Sử dụng lớp tiện ích Singleton để quản lý instance
   */
  static getInstance() {
    return Singleton.getInstance(CartService);
  }

  /**
   * Dependency Injection: Tiêm lớp storage (Memory, Redis, LocalStorage, etc.)
   */
  static setStorage(storage) {
    if (!storage || typeof storage.get !== 'function') {
      throw new Error('❌ Invalid storage implementation');
    }
    CartService.#storage = storage;
    console.log('✅ [CartService] Storage injected:', storage.constructor.name);
  }

  static async setCurrentUser(email) {
    CartService.#currentUserEmail = email;
    const instance = CartService.getInstance();
    await instance._loadFromStorage();
    console.log(`✅ [CartService] User switched to: ${email}`);
  }

  async _loadFromStorage() {
    if (!CartService.#storage) {
      this.#items = [];
      return;
    }
    try {
      const storageKey = this.#getStorageKey();
      const data = await CartService.#storage.get(storageKey);
      this.#items = data ? JSON.parse(data) : [];
      console.log(`📦 [CartService] Loaded ${this.#items.length} items`);
    } catch (error) {
      console.error('❌ [CartService] Load failed:', error.message);
      this.#items = [];
    }
  }

  async _saveToStorage() {
    if (!CartService.#storage) return;
    try {
      const storageKey = this.#getStorageKey();
      await CartService.#storage.set(storageKey, JSON.stringify(this.#items));
      console.log('💾 [CartService] Saved to storage');
      
      // ✅ Observer Pattern: Thông báo cho các listeners về sự thay đổi
      this.#userObserver.notify({ type: 'cart:changed', data: this.#items });
    } catch (error) {
      console.error('❌ [CartService] Save failed:', error.message);
    }
  }

  #getStorageKey() {
    const user = CartService.#currentUserEmail || 'anonymous';
    return `cart-items-${user.toLowerCase()}`;
  }

  async addToCart(item) {
    if (!item || !item.id) throw new Error('❌ Item must have id');
    const existing = this.#items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      this.#items.push({ ...item, quantity: item.quantity || 1 });
    }
    await this._saveToStorage();
    console.log(`➕ [CartService] Added: ${item.id}`);
  }

  async removeFromCart(itemId) {
    const index = this.#items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      this.#items.splice(index, 1);
      await this._saveToStorage();
      console.log(`➖ [CartService] Removed: ${itemId}`);
    }
  }

  async updateQuantity(itemId, quantity) {
    if (quantity <= 0) {
      await this.removeFromCart(itemId);
      return;
    }
    const item = this.#items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      await this._saveToStorage();
      console.log(`🔄 [CartService] Updated quantity: ${itemId} -> ${quantity}`);
    }
  }

  getItems() {
    return [...this.#items];
  }

  getTotal() {
    return this.#items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  }

  async clearCart() {
    this.#items = [];
    await this._saveToStorage();
    console.log('🧹 [CartService] Cart cleared');
  }

  /**
   * ✅ Observer Pattern: Phương thức để các thành phần UI subscribe
   */
  subscribe(callback) {
    return this.#userObserver.subscribe(callback);
  }

  getItemCount() {
    return this.#items.length;
  }
}

module.exports = CartService;
