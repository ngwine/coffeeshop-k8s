// /pages/Cart/CartSummary.jsx
import React, { useMemo } from "react";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function CartSummary({ cart = { items: [] }, onCheckout }) {
  const safeItems = Array.isArray(cart.items) ? cart.items : [];

  const subtotal = useMemo(
    () =>
      safeItems.reduce(
        (s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0),
        0
      ),
    [safeItems]
  );

  const discount = 0; // không áp dụng voucher ở trang Cart
  const total = subtotal; // subtotal - discount (ở đây discount = 0)

  return (
    <div className="cart-summary">
      <h2 className="cart-summary-title">Order Summary</h2>

      {/* Không còn ô nhập voucher ở đây */}

      <div className="cart-money-lines">
        <div className="cart-money-line">
          <span>Subtotal</span>
          <span>{formatVND(subtotal)}</span>
        </div>

        <div className="cart-money-line total">
          <span>Total</span>
          <span>{formatVND(total)}</span>
        </div>
      </div>

      <button
        className="cart-checkout-btn"
        disabled={safeItems.length === 0}
        onClick={() => {
          if (typeof onCheckout === "function") {
            onCheckout({ items: safeItems, subtotal, discount, total });
          } else {
            console.log("Checkout payload:", {
              items: safeItems,
              subtotal,
              discount,
              total,
            });
          }
        }}
      >
        Checkout ({safeItems.length || 0})
      </button>
    </div>
  );
}
