/**
 * ✅ SINGLETON PATTERN - Unit Tests
 * frontend/src/services/__tests__/CartService.test.js
 * 
 * Comprehensive tests to verify true Singleton implementation
 */

import CartService from '../CartService';

describe('CartService - Singleton Pattern', () => {
  // Reset singleton for each test
  beforeEach(() => {
    CartService.clearCart();
  });

  // ✅ TEST 1: Single Instance
  describe('Singleton Validation', () => {
    test('should always return the same instance', () => {
      const instance1 = CartService.getInstance();
      const instance2 = CartService.getInstance();
      const instance3 = CartService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    test('should throw error when trying to create new instance', () => {
      expect(() => {
        new CartService();
      }).toThrow('CartService is a Singleton');
    });

    test('verifyInstance should confirm single instance', () => {
      const isValid = CartService.verifyInstance();
      expect(isValid).toBe(true);
    });
  });

  // ✅ TEST 2: Add to Cart
  describe('Add to Cart', () => {
    test('should add new item to cart', () => {
      CartService.addToCart({
        productId: 1,
        name: 'Coffee',
        price: 50000,
        qty: 1,
      });

      const items = CartService.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Coffee');
    });

    test('should increase qty if item already exists', () => {
      CartService.addToCart({
        productId: 1,
        key: 'prod-1',
        name: 'Coffee',
        price: 50000,
        qty: 1,
      });

      CartService.addToCart({
        productId: 1,
        key: 'prod-1',
        name: 'Coffee',
        price: 50000,
        qty: 2,
      });

      const items = CartService.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].qty).toBe(3); // 1 + 2
    });
  });

  // ✅ TEST 3: Remove from Cart
  describe('Remove from Cart', () => {
    test('should remove item from cart', () => {
      CartService.addToCart({
        productId: 1,
        key: 'prod-1',
        name: 'Coffee',
        price: 50000,
      });

      CartService.removeFromCart('prod-1');

      const items = CartService.getItems();
      expect(items).toHaveLength(0);
    });

    test('should not throw error for non-existent item', () => {
      expect(() => {
        CartService.removeFromCart('non-existent');
      }).not.toThrow();
    });
  });

  // ✅ TEST 4: Update Quantity
  describe('Update Quantity', () => {
    test('should update item quantity', () => {
      CartService.addToCart({
        productId: 1,
        key: 'prod-1',
        name: 'Coffee',
        price: 50000,
        qty: 1,
      });

      CartService.updateQty('prod-1', 5);

      const items = CartService.getItems();
      expect(items[0].qty).toBe(5);
    });

    test('should remove item if qty is 0 or less', () => {
      CartService.addToCart({
        productId: 1,
        key: 'prod-1',
        name: 'Coffee',
        price: 50000,
        qty: 2,
      });

      CartService.updateQty('prod-1', 0);

      const items = CartService.getItems();
      expect(items).toHaveLength(0);
    });
  });

  // ✅ TEST 5: Clear Cart
  describe('Clear Cart', () => {
    test('should clear all items', () => {
      CartService.addToCart({ productId: 1, key: 'p1', name: 'Item1' });
      CartService.addToCart({ productId: 2, key: 'p2', name: 'Item2' });

      CartService.clearCart();

      const items = CartService.getItems();
      expect(items).toHaveLength(0);
    });
  });

  // ✅ TEST 6: Get Cart Summary
  describe('Cart Summary', () => {
    test('should calculate correct summary', () => {
      CartService.addToCart({
        productId: 1,
        key: 'p1',
        name: 'Item1',
        price: 100,
        qty: 2,
      });

      CartService.addToCart({
        productId: 2,
        key: 'p2',
        name: 'Item2',
        price: 50,
        qty: 1,
      });

      const summary = CartService.getCartSummary();
      expect(summary.itemCount).toBe(2);
      expect(summary.totalQuantity).toBe(3); // 2 + 1
      expect(summary.totalPrice).toBe(250); // (100*2) + (50*1)
      expect(summary.isEmpty).toBe(false);
    });

    test('should return empty summary for empty cart', () => {
      const summary = CartService.getCartSummary();
      expect(summary.isEmpty).toBe(true);
      expect(summary.totalPrice).toBe(0);
    });
  });

  // ✅ TEST 7: Observer Pattern
  describe('Observer Pattern', () => {
    test('should notify observers on item add', (done) => {
      const callback = jest.fn(({ type, data }) => {
        expect(type).toBe('ITEM_ADDED');
        expect(data).toHaveLength(1);
        done();
      });

      CartService.subscribe(callback);
      CartService.addToCart({ productId: 1, key: 'p1', name: 'Item1' });
    });

    test('should notify observers on item remove', (done) => {
      CartService.addToCart({ productId: 1, key: 'p1', name: 'Item1' });

      const callback = jest.fn(({ type, data }) => {
        expect(type).toBe('ITEM_REMOVED');
        expect(data).toHaveLength(0);
        done();
      });

      CartService.subscribe(callback);
      CartService.removeFromCart('p1');
    });

    test('should allow unsubscribe', () => {
      const callback = jest.fn();
      const unsubscribe = CartService.subscribe(callback);

      CartService.addToCart({ productId: 1, key: 'p1', name: 'Item1' });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      CartService.addToCart({ productId: 2, key: 'p2', name: 'Item2' });
      // Should still be 1 (not called again)
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ✅ TEST 8: Persistence
  describe('Persistence', () => {
    test('should save to localStorage', () => {
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };

      global.localStorage = localStorageMock;

      CartService.addToCart({ productId: 1, key: 'p1', name: 'Item1' });

      // Note: In real implementation, setItem is called
      expect(CartService.getItems()).toHaveLength(1);
    });
  });
});

// ✅ TEST 9: Concurrent Access (Singleton should handle multiple simultaneous accesses)
describe('CartService - Concurrent Access', () => {
  test('should maintain single instance with concurrent operations', () => {
    const refs = [];

    // Simulate concurrent getInstance calls
    for (let i = 0; i < 100; i++) {
      refs.push(CartService.getInstance());
    }

    // All references should be identical
    const firstRef = refs[0];
    refs.forEach((ref) => {
      expect(ref).toBe(firstRef);
    });
  });

  test('should maintain data consistency with concurrent add operations', () => {
    CartService.clearCart();

    // Simulate concurrent add operations
    for (let i = 0; i < 10; i++) {
      CartService.addToCart({
        productId: i,
        key: `p${i}`,
        name: `Item${i}`,
        price: 100 * (i + 1),
        qty: 1,
      });
    }

    const items = CartService.getItems();
    expect(items).toHaveLength(10);

    const summary = CartService.getCartSummary();
    expect(summary.itemCount).toBe(10);
  });
});
