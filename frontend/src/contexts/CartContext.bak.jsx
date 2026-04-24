// src/contexts/CartContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

// Helper to get user-specific storage key
function getStorageKey(userEmail) {
  if (!userEmail) return 'cart-items-anonymous';
  return `cart-items-${userEmail.toLowerCase()}`;
}

function normalizeQty(qty, stock) {
  const maxStock = Number.isFinite(stock) ? stock : 9999;
  const safeQty = Number.isFinite(qty) ? qty : 1;
  return Math.max(1, Math.min(safeQty, maxStock));
}

export const CartProvider = ({ children }) => {
  // Get current user email from auth context
  const auth = useAuth();
  const currentUserEmail = auth?.user?.email || auth?.currentUser?.email || auth?.email || null;
  const storageKey = getStorageKey(currentUserEmail);

  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // ✅ SECURITY FIX: When user changes (login/logout), reload cart from correct user's storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const userCart = raw ? JSON.parse(raw) : [];
      setItems(userCart);
      console.log(`🛒 [CartContext] Loaded cart for user: ${currentUserEmail || 'anonymous'} (${userCart.length} items)`);
    } catch (error) {
      console.error('❌ [CartContext] Error loading cart:', error);
      setItems([]);
    }
  }, [currentUserEmail, storageKey]);

  // OBSERVER PATTERN: Persist cart to user-specific localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, storageKey]);

  // OBSERVER PATTERN: Sync cart across tabs/windows using storage events
  // Implements real-time observation of cart state changes from other browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Only respond to changes in the CURRENT USER's cart storage key
      if (event.key === storageKey && event.newValue) {
        try {
          const newItems = JSON.parse(event.newValue);
          setItems(newItems);
          console.log('✅ [CartObserver] Cart synchronized from another tab/window');
        } catch (error) {
          console.error('❌ [CartObserver] Failed to sync cart:', error.message);
        }
      }
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Cleanup: Remove listener when component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey]);

  const addToCart = (payload) => {
    if (!payload) return;

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

    const key =
      incomingKey ||
      `${productId || ""}-${variant?.name || ""}-${variant?.value || "default"}`;

    setItems((prev) => {
      const existing = prev.find((it) => it.key === key);
      const maxStock = Number.isFinite(stock)
        ? stock
        : Number.isFinite(existing?.stock)
        ? existing.stock
        : 9999;

      // item mới
      if (!existing) {
        const computedBasePrice = Number.isFinite(basePrice)
          ? basePrice
          : Number(price ?? 0);

        return [
          ...prev,
          {
            key,
            productId,
            name,
            price,
            image,
            variant,
            category,
            stock: maxStock,
            qty: normalizeQty(qty, maxStock),
            basePrice: computedBasePrice,
            variantOptions: Array.isArray(variantOptions)
              ? variantOptions
              : undefined,
            variantIndex: Number.isFinite(variantIndex)
              ? variantIndex
              : undefined,
          },
        ];
      }

      // đã tồn tại → cộng qty
      return prev.map((it) => {
        if (it.key !== key) return it;
        const newQty = normalizeQty((it.qty || 1) + qty, maxStock);

        const nextBasePrice = Number.isFinite(basePrice)
          ? basePrice
          : Number(it.basePrice ?? it.price ?? price ?? 0);

        return {
          ...it,
          name: name ?? it.name,
          price: price ?? it.price,
          image: image ?? it.image,
          variant: variant ?? it.variant,
          category: category ?? it.category,
          stock: maxStock,
          qty: newQty,
          basePrice: nextBasePrice,
          variantOptions: Array.isArray(variantOptions)
            ? variantOptions
            : it.variantOptions,
          variantIndex: Number.isFinite(variantIndex)
            ? variantIndex
            : it.variantIndex,
        };
      });
    });
  };

  const removeFromCart = (key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const clearCart = () => setItems([]);

  const changeQty = (key, delta) => {
    setItems((prev) =>
      prev.flatMap((it) => {
        if (it.key !== key) return [it];
        const stock = Number.isFinite(it.stock) ? it.stock : 9999;
        const next = (it.qty || 1) + delta;
        if (next <= 0) return [];
        return [{ ...it, qty: normalizeQty(next, stock) }];
      })
    );
  };

  const increaseQty = (key) => changeQty(key, +1);
  const decreaseQty = (key) => changeQty(key, -1);

  // đổi option trong giỏ
  const updateItemVariant = (key, payload = {}) => {
    setItems((prev) => {
      const current = prev.find((it) => it.key === key);
      if (!current) return prev;

      const {
        variant: incomingVariant,
        price,
        basePrice,
        variantOptions,
        variantIndex,
      } = payload;

      const nextVariant = incomingVariant || current.variant;
      const newKey = `${current.productId || ""}-${
        nextVariant?.name || ""
      }-${nextVariant?.value || "default"}`;

      const nextBasePrice = Number.isFinite(basePrice)
        ? basePrice
        : Number(current.basePrice ?? current.price ?? 0);

      // key không đổi → chỉ update data
      if (newKey === key) {
        return prev.map((it) =>
          it.key === key
            ? {
                ...it,
                variant: nextVariant,
                price: price ?? it.price,
                basePrice: nextBasePrice,
                variantOptions: variantOptions ?? it.variantOptions,
                variantIndex: Number.isFinite(variantIndex)
                  ? variantIndex
                  : it.variantIndex,
              }
            : it
        );
      }

      // nếu có item khác cùng option mới → gộp
      const target = prev.find((it) => it.key === newKey);
      const updatedItem = {
        ...current,
        variant: nextVariant,
        price: price ?? current.price,
        basePrice: nextBasePrice,
        variantOptions: variantOptions ?? current.variantOptions,
        variantIndex: Number.isFinite(variantIndex)
          ? variantIndex
          : current.variantIndex,
        key: newKey,
      };

      if (!target) {
        return prev.map((it) => (it.key === key ? updatedItem : it));
      }

      const maxStock = Number.isFinite(updatedItem.stock)
        ? updatedItem.stock
        : Number.isFinite(target.stock)
        ? target.stock
        : 9999;

      const merged = {
        ...target,
        ...updatedItem,
        qty: normalizeQty((target.qty || 1) + (current.qty || 1), maxStock),
        stock: maxStock,
      };

      return prev
        .filter((it) => it.key !== key && it.key !== target.key)
        .concat(merged);
    });
  };

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

export const useCart = () => useContext(CartContext);
