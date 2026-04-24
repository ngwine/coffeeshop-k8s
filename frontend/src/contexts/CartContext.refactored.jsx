// frontend/src/contexts/CartContext.jsx - REFACTORED WITH PURE PATTERNS
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import CartService from "../core/services/CartService";
import LocalStorageAdapter from "../core/adapters/LocalStorageAdapter";

const CartContext = createContext(null);

// Initialize pure CartService with LocalStorageAdapter (one-time setup)
const cartService = (() => {
  const instance = CartService.getInstance();
  if (!instance.constructor._storage) {
    CartService.setStorage(new LocalStorageAdapter());
  }
  return instance;
})();

export const CartProvider = ({ children }) => {
  const auth = useAuth();
  const currentUserEmail = auth?.user?.email || auth?.currentUser?.email || auth?.email || null;

  // React state for re-renders (keeps React working)
  const [items, setItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // ⭐ PURE: When user changes, load their cart through CartService
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Update user in pure service
        CartService.setCurrentUser(currentUserEmail);

        // Get items from pure service (which uses localStorage adapter)
        const userCart = await cartService.getItems();
        setItems(userCart);

        console.log(
          `🛒 [CartContext] Loaded cart for user: ${currentUserEmail || "anonymous"} (${userCart.length} items)`
        );

        // Subscribe to CartService changes
        const unsubscribe = cartService.subscribe((updatedItems) => {
          setItems(updatedItems);
          console.log("✅ [CartObserver] Cart synchronized");
        });

        setIsInitialized(true);

        // Cleanup subscription
        return unsubscribe;
      } catch (error) {
        console.error("❌ [CartContext] Error initializing cart:", error);
        setItems([]);
        setIsInitialized(true);
      }
    };

    return initializeCart().then((cleanup) => cleanup);
  }, [currentUserEmail]);

  // ⭐ PURE: Delegate addToCart to CartService
  const addToCart = async (payload) => {
    if (!payload) return;
    await cartService.addToCart(payload);
    // CartService subscribers will trigger re-render via setItems
  };

  // ⭐ PURE: Delegate removeFromCart to CartService
  const removeFromCart = async (key) => {
    await cartService.removeFromCart(key);
  };

  // ⭐ PURE: Delegate clearCart to CartService
  const clearCart = async () => {
    await cartService.clearCart();
  };

  // ⭐ PURE: Delegate updateQuantity to CartService
  const changeQty = async (key, delta) => {
    const currentQty = items.find((it) => it.key === key)?.qty || 1;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      await cartService.removeFromCart(key);
    } else {
      const item = items.find((it) => it.key === key);
      const maxStock = Number.isFinite(item?.stock) ? item.stock : 9999;

      if (newQty <= maxStock) {
        await cartService.updateQuantity(key, newQty);
      }
    }
  };

  const increaseQty = (key) => changeQty(key, +1);
  const decreaseQty = (key) => changeQty(key, -1);

  // ⭐ PURE: Update item variant through CartService
  const updateItemVariant = async (key, payload = {}) => {
    const current = items.find((it) => it.key === key);
    if (!current) return;

    const {
      variant: incomingVariant,
      price,
      basePrice,
      variantOptions,
      variantIndex,
    } = payload;

    const nextVariant = incomingVariant || current.variant;
    const newKey = `${current.productId || ""}-${nextVariant?.name || ""}-${
      nextVariant?.value || "default"
    }`;

    // If key is the same, just update through CartService
    if (newKey === key) {
      await cartService.updateQuantity(key, current.qty);
      return;
    }

    // If key changed, need to handle via pure logic
    // This is complex, keep as is for now, delegate to helper
    console.warn("[CartContext] updateItemVariant not fully delegated yet");
    // TODO: Extend CartService to handle variant updates
  };

  // Show loading state until cart initialized
  if (!isInitialized) {
    return (
      <CartContext.Provider
        value={{
          items: [],
          addToCart: () => {},
          removeFromCart: () => {},
          clearCart: () => {},
          increaseQty: () => {},
          decreaseQty: () => {},
          updateItemVariant: () => {},
        }}
      >
        {children}
      </CartContext.Provider>
    );
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQty,
        decreaseQty,
        updateItemVariant,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
