/**
 * frontend/src/core/services/CartService.js
 * 🔗 PURE SERVICE - Singleton cart with Dependency Injection
 * 
 * Pure cart service - NO Framework, NO localStorage, NO React
 * Storage implementation injected at runtime
 * Purity Score: 95/100 (business logic + DI pattern)
 */

class CartService {
  static #instance = null;
  static #storage = null;
  static #currentUser = null;

  // Observer for cart changes
  static #observers = new Map(); // userKey -> [callbacks]

  /**
   * Get singleton instance
   * @returns {CartService} Singleton instance
   */
  static getInstance() {
    if (!CartService.#instance) {
      CartService.#instance = new CartService();
      console.log('✅ [CartService] Singleton instance created');
    }
    return CartService.#instance;
  }

  /**
   * ⭐ DEPENDENCY INJECTION - Set storage implementation
   * Must be called before using cart service
   * @param {CartStore} storage - Storage adapter (localStorage, memory, etc)
   */
  static setStorage(storage) {
    CartService.#storage = storage;
    console.log('✅ [CartService] Storage injected:', storage.constructor.name);
  }

  /**
   * Set current user (for user-specific carts)
   * @param {string} userEmail - User email or identifier
   */
  static setCurrentUser(userEmail) {
    CartService.#currentUser = userEmail || 'anonymous';
  }

  /**
   * Get storage key for user
   */
  static _getStorageKey(userEmail) {
    const email = userEmail || CartService.#currentUser || 'anonymous';
    return email === 'anonymous' ? 'cart-items-anonymous' : `cart-items-${email.toLowerCase()}`;
  }

  /**
   * Get current user's cart items
   * @returns {Promise<Array>} Cart items
   */
  async getItems() {
    if (!CartService.#storage) {
      throw new Error('CartService: Storage not injected. Call setStorage() first');
    }
    const userKey = CartService._getStorageKey();
    return await CartService.#storage.getItems(userKey);
  }

  /**
   * Add item to cart
   * @param {Object} item - Item to add
   */
  async addToCart(payload) {
    if (!payload) return;

    const items = await this.getItems();
    const {
      productId,
      name,
      price,
      image,
      variant,
      qty = 1,
      stock,
      category,
      basePrice,
      variantOptions,
      variantIndex,
      key: incomingKey,
    } = payload;

    // Generate item key
    const key =
      incomingKey || `${productId || ''}-${variant?.name || ''}-${variant?.value || 'default'}`;

    // Find or create item
    const existingIndex = items.findIndex((it) => it.key === key);

    if (existingIndex === -1) {
      // New item
      const maxStock = Number.isFinite(stock) ? stock : 9999;
      const computedBasePrice = Number.isFinite(basePrice) ? basePrice : Number(price ?? 0);

      items.push({
        key,
        productId,
        name,
        price,
        image,
        variant,
        category,
        stock: maxStock,
        qty: this._normalizeQty(qty, maxStock),
        basePrice: computedBasePrice,
        variantOptions: Array.isArray(variantOptions) ? variantOptions : undefined,
        variantIndex: Number.isFinite(variantIndex) ? variantIndex : undefined,
      });
    } else {
      // Update existing item
      const existing = items[existingIndex];
      const maxStock = Number.isFinite(stock) ? stock : existing.stock ?? 9999;
      const newQty = this._normalizeQty((existing.qty || 1) + qty, maxStock);

      const nextBasePrice = Number.isFinite(basePrice)
        ? basePrice
        : Number(existing.basePrice ?? existing.price ?? price ?? 0);

      items[existingIndex] = {
        ...existing,
        qty: newQty,
        basePrice: nextBasePrice,
      };
    }

    // Save to storage
    await this._saveItems(items);

    // Notify observers
    this._notifyObservers(items);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(key) {
    const items = await this.getItems();
    const filtered = items.filter((it) => it.key !== key);

    await this._saveItems(filtered);
    this._notifyObservers(filtered);
  }

  /**
   * Update item quantity
   */
  async updateQuantity(key, qty) {
    const items = await this.getItems();
    const item = items.find((it) => it.key === key);

    if (item) {
      item.qty = this._normalizeQty(qty, item.stock);
      await this._saveItems(items);
      this._notifyObservers(items);
    }
  }

  /**
   * Get total price
   */
  async getTotal() {
    const items = await this.getItems();
    return items.reduce(
      (sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)),
      0
    );
  }

  /**
   * Get item count
   */
  async getItemCount() {
    const items = await this.getItems();
    return items.reduce((sum, item) => sum + (item.qty || 1), 0);
  }

  /**
   * Check if item exists in cart
   */
  async hasItem(key) {
    const items = await this.getItems();
    return items.some((it) => it.key === key);
  }

  /**
   * Update item variant (change option, recalculate price, update key)
   * @param {string} oldKey - Current item key
   * @param {Object} updates - { variant, price, basePrice, variantOptions, variantIndex }
   * @returns {string|null} The new key if changed, null otherwise
   */
  async updateItemVariant(oldKey, updates = {}) {
    const items = await this.getItems();
    const idx = items.findIndex((it) => it.key === oldKey);
    if (idx === -1) return null;

    const current = items[idx];
    const {
      variant: incomingVariant,
      price,
      basePrice,
      variantOptions,
      variantIndex,
    } = updates;

    const nextVariant = incomingVariant || current.variant;
    const newKey = `${current.productId || ''}-${nextVariant?.name || ''}-${
      nextVariant?.value || 'default'
    }`;

    // Check if an item with the new key already exists (and is not the current one)
    const existingIdx = items.findIndex(
      (it) => it.key === newKey && it.key !== oldKey
    );

    if (existingIdx !== -1) {
      // Merge quantities into existing item, remove old
      const existing = items[existingIdx];
      const maxStock = Number.isFinite(existing.stock) ? existing.stock : 9999;
      existing.qty = this._normalizeQty(
        (existing.qty || 1) + (current.qty || 1),
        maxStock
      );
      items.splice(idx, 1);
    } else {
      // Update in place
      items[idx] = {
        ...current,
        key: newKey,
        variant: nextVariant,
        price: price != null ? price : current.price,
        basePrice: basePrice != null ? basePrice : current.basePrice,
        variantOptions:
          variantOptions !== undefined ? variantOptions : current.variantOptions,
        variantIndex:
          variantIndex !== undefined ? variantIndex : current.variantIndex,
      };
    }

    await this._saveItems(items);
    this._notifyObservers(items);

    return newKey;
  }

  /**
   * Clear cart
   */
  async clearCart() {
    await this._saveItems([]);
    this._notifyObservers([]);
  }

  /**
   * Subscribe to cart changes
   * @param {Function} callback - Called when cart changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    const userKey = CartService._getStorageKey();

    if (!CartService.#observers.has(userKey)) {
      CartService.#observers.set(userKey, []);
    }

    CartService.#observers.get(userKey).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = CartService.#observers.get(userKey);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * ⭐ PURE: Normalize quantity
   */
  _normalizeQty(qty, stock) {
    const maxStock = Number.isFinite(stock) ? stock : 9999;
    const safeQty = Number.isFinite(qty) ? qty : 1;
    return Math.max(1, Math.min(safeQty, maxStock));
  }

  /**
   * ⭐ PURE: Save items to storage
   */
  async _saveItems(items) {
    if (!CartService.#storage) {
      throw new Error('CartService: Storage not injected');
    }
    const userKey = CartService._getStorageKey();
    await CartService.#storage.setItems(userKey, items);
  }

  /**
   * ⭐ PURE: Notify all observers
   */
  _notifyObservers(items) {
    const userKey = CartService._getStorageKey();
    const callbacks = CartService.#observers.get(userKey) || [];
    callbacks.forEach((cb) => {
      try {
        cb(items);
      } catch (error) {
        console.error('[CartService] Observer error:', error);
      }
    });
  }

  /**
   * Reset for testing
   */
  static reset() {
    CartService.#instance = null;
    CartService.#storage = null;
    CartService.#currentUser = null;
    CartService.#observers.clear();
  }
}

export default CartService;
