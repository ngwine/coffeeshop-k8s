/**
 * ✅ SINGLETON PATTERN - React Hook Wrapper
 * frontend/src/hooks/useCartSingleton.js
 * 
 * React hook that connects to the CartService Singleton
 * Provides real-time state updates through Observer Pattern
 * ✅ SECURITY: User-specific cart management
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CartService from '../services/CartService';

/**
 * Hook to use CartService Singleton in React components
 * Automatically syncs with Singleton instance
 * ✅ Automatically switches cart when user changes
 */
export const useCartSingleton = () => {
  const auth = useAuth();
  const currentUserEmail = auth?.user?.email || auth?.currentUser?.email || auth?.email || null;
  
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});

  // ✅ SECURITY: Set current user in CartService when user changes
  useEffect(() => {
    if (currentUserEmail) {
      CartService.setCurrentUser(currentUserEmail);
      console.log(`✅ [useCartSingleton] User set in CartService: ${currentUserEmail}`);
    }
  }, [currentUserEmail]);

  // Initialize with current cart state
  useEffect(() => {
    const cartService = CartService.getInstance();
    setItems(cartService.getItems());
    setSummary(cartService.getCartSummary());

    // ✅ OBSERVER PATTERN: Subscribe to cart changes
    const unsubscribe = CartService.subscribe(({ type, data }) => {
      console.log(`🔔 [useCartSingleton] Cart updated: ${type}`);
      setItems(CartService.getItems());
      setSummary(CartService.getCartSummary());
    });

    return unsubscribe;
  }, []);

  // Memoized callback functions
  const addToCart = useCallback((payload) => {
    return CartService.addToCart(payload);
  }, []);

  const removeFromCart = useCallback((key) => {
    return CartService.removeFromCart(key);
  }, []);

  const updateQty = useCallback((key, newQty) => {
    return CartService.updateQty(key, newQty);
  }, []);

  const clearCart = useCallback(() => {
    return CartService.clearCart();
  }, []);

  const increaseQty = useCallback((key) => {
    const item = CartService.findItem(key);
    if (item) {
      const max = item.stock || 9999;
      const newQty = Math.min((item.qty || 1) + 1, max);
      return CartService.updateQty(key, newQty);
    }
  }, []);

  const decreaseQty = useCallback((key) => {
    const item = CartService.findItem(key);
    if (item && (item.qty || 1) > 1) {
      return CartService.updateQty(key, (item.qty || 1) - 1);
    }
  }, []);

  const updateItemVariant = useCallback((key, variantData) => {
    return CartService.updateItemVariant(key, variantData);
  }, []);

  return {
    // State
    items,
    summary,

    // Methods
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    increaseQty,
    decreaseQty,
    updateItemVariant,

    // Info
    itemCount: items.length,
    totalQuantity: summary.totalQuantity || 0,
    totalPrice: summary.totalPrice || 0,
    isEmpty: summary.isEmpty || true,
  };
};
