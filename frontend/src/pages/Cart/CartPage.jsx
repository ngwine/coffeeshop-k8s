// /pages/Cart/CartPage.jsx
import React, { useEffect, useState } from "react";
import { useCart } from "../../contexts/CartContext";
import CartSummary from "./CartSummary";
import "./cart-page.css";
import { useNavigate } from "react-router-dom";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    clearCart,
    increaseQty,
    decreaseQty,
    updateItemVariant,
  } = useCart();

  const hasItems = items && items.length > 0;

  const [selectedKeys, setSelectedKeys] = useState(() =>
    Array.isArray(items) ? items.map((it) => it.key) : []
  );

  // when items change (load from localStorage, cleared, etc.), remove stale keys
  useEffect(() => {
    setSelectedKeys((prev) =>
      prev.filter((k) => items.some((it) => it.key === k))
    );
  }, [items]);

  const selectedItems = hasItems
    ? items.filter((it) => selectedKeys.includes(it.key))
    : [];

  const selectedSubtotal = selectedItems.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );

  const allSelected =
    hasItems && selectedItems.length === items.length && items.length > 0;

  const handleCheckout = () => {
    if (!selectedItems.length) {
      alert("You haven't selected any items to checkout.");
      return;
    }

    navigate("/checkout", {
      state: {
        items: selectedItems,
        subtotal: selectedSubtotal,
      },
    });
  };

  const handleChangeVariant = async (item, newIndex) => {
    if (!Array.isArray(item.variantOptions) || !item.variantOptions[newIndex]) {
      return;
    }

    const opt = item.variantOptions[newIndex];

    // if basePrice exists use it, otherwise fall back to current price
    let baseRaw = 0;
    if (item.basePrice != null) {
      baseRaw = item.basePrice;
    } else if (item.price != null) {
      baseRaw = item.price;
    }

    const basePrice = Number(baseRaw);
    const priceDelta = Number(opt.priceDelta || 0);
    const nextPrice = basePrice + priceDelta;
    const variantName = item.variant?.name || "size";

    const oldKey = item.key;

    // update in context — returns the new key
    const newKey = await updateItemVariant(oldKey, {
      variant: { name: variantName, value: opt.label },
      price: nextPrice,
      basePrice,
      variantOptions: item.variantOptions,
      variantIndex: newIndex,
    });

    // if item was selected, update selectedKeys to track the new key
    if (newKey && newKey !== oldKey) {
      setSelectedKeys((prev) => {
        if (!prev.includes(oldKey)) return prev;
        const next = prev.filter((k) => k !== oldKey);
        if (!next.includes(newKey)) next.push(newKey);
        return next;
      });
    }
  };

  // navigate to product detail page
  const goToProductDetail = (cartItem) => {
    if (!cartItem) return;
    const id =
      cartItem.productId || cartItem._id || cartItem.id || cartItem.slug;
    if (!id) return;
    // change this path if your route is different
    navigate(`/products/${id}`);
  };

  if (!hasItems) {
    return (
      <main className="cart-page cart-page--empty">
        <div className="cart-empty-card">
          <h1>Your cart is empty</h1>
          <p>Add some delicious coffee to brighten your day ☕️</p>
          <a href="/menu/roast-coffee" className="cart-empty-btn">
            Browse menu
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      {/* Left column: product list */}
      <section className="cart-main">
        <header className="cart-header">
          <div className="cart-header-top">
            <h1>Shopping cart</h1>
            <p className="cart-header-sub">
              {items.length} items · Selected {selectedItems.length} · Subtotal{" "}
              {formatVND(selectedSubtotal)}
            </p>
          </div>

          <div className="cart-header-bottom">
            <label className="cart-select-all">
              <input
                type="checkbox"
                checked={allSelected}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedKeys(items.map((it) => it.key));
                  } else {
                    setSelectedKeys([]);
                  }
                }}
              />
              <span>Select all</span>
            </label>

            <button className="cart-clear" onClick={clearCart}>
              Clear all
            </button>
          </div>
        </header>

        <div className="cart-items">
          {items.map((item) => {
            const lineTotal =
              (Number(item.price) || 0) * (Number(item.qty) || 1);
            const maxStock = Number.isFinite(item.stock) ? item.stock : 9999;
            const isSelected = selectedKeys.includes(item.key);

            const hasVariantOptions =
              Array.isArray(item.variantOptions) &&
              item.variantOptions.length > 0;

            let variantIndex = Number.isFinite(item.variantIndex)
              ? item.variantIndex
              : 0;

            if (
              !Number.isFinite(item.variantIndex) &&
              hasVariantOptions &&
              item.variant?.value
            ) {
              const idxFromLabel = item.variantOptions.findIndex(
                (op) => op.label === item.variant.value
              );
              if (idxFromLabel >= 0) {
                variantIndex = idxFromLabel;
              }
            }

            return (
              <article
                className="cart-item"
                key={item.key}
                onClick={() => goToProductDetail(item)}
              >
                <div className="cart-item-check">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedKeys((prev) =>
                          prev.includes(item.key)
                            ? prev
                            : [...prev, item.key]
                        );
                      } else {
                        setSelectedKeys((prev) =>
                          prev.filter((k) => k !== item.key)
                        );
                      }
                    }}
                  />
                </div>

                <div className="cart-item-thumb">
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="cart-item-body">
                  <div className="cart-item-top">
                    <div>
                      <div className="cart-item-title">{item.name}</div>

                      {hasVariantOptions ? (
                        <div className="cart-item-option-row">
                          <span className="cart-item-option-label">
                            Option
                          </span>
                          <select
                            className="cart-item-option-select"
                            value={variantIndex}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleChangeVariant(
                                item,
                                Number(e.target.value)
                              )
                            }
                          >
                            {item.variantOptions.map((op, idx) => (
                              <option key={idx} value={idx}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : item.variant?.value ? (
                        <div className="cart-item-variant">
                          Option: {item.variant.value}
                        </div>
                      ) : null}
                    </div>

                    <div className="cart-item-line-total">
                      {formatVND(lineTotal)}
                    </div>
                  </div>

                  <div className="cart-item-bottom">
                    <div className="cart-item-qty">
                      <span className="cart-item-qty-label">Quantity</span>
                      <div className="cart-qty-control">
                        <button
                          aria-label="Decrease quantity"
                          onClick={(e) => {
                            e.stopPropagation();
                            decreaseQty(item.key);
                          }}
                          disabled={item.qty <= 1}
                        >
                          –
                        </button>
                        <span aria-live="polite">{item.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={(e) => {
                            e.stopPropagation();
                            increaseQty(item.key);
                          }}
                          disabled={item.qty >= maxStock}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span className="cart-item-price">
                      Unit price: {formatVND(item.price)}
                    </span>

                    <button
                      className="cart-item-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.key);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Hover hint for viewing details */}
                <div className="cart-item-detail-hint">
                  <span>Click to view product details</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Right column: order summary (only selected items) */}
      <aside className="cart-aside">
        <CartSummary
          cart={{ items: selectedItems }}
          onCheckout={handleCheckout}
        />
      </aside>
    </main>
  );
}
