import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./order-detail.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateLoyaltyPoints(order) {
  if (!order) return 0;

  // Nếu backend đã ghi sẵn pointsEarned thì ưu tiên dùng luôn
  if (order.pointsEarned != null) {
    const n = Number(order.pointsEarned);
    return Number.isNaN(n) ? 0 : n;
  }

  const subtotal = Number(order.subtotal) || 0;
  const shipping = Number(order.shippingFee) || 0;
  const discount = Number(order.discount) || 0;

  // tổng tiền thực để tính điểm: subtotal + ship - discount
  const totalForPoints = Math.max(0, subtotal + shipping - discount);

  // Rule: 10% giá trị đơn, 1.000đ = 1 điểm
  const raw = (totalForPoints * 0.1) / 1000;
  return Math.floor(raw);
}

const STATUS_LABELS = {
  created: "Created",
  pending: "Pending",
  processing: "Processing",
  confirmed: "Confirmed",
  shipping: "Shipping",
  shipped: "Shipped",
  completed: "Completed",
  delivered: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  refunded: "Refunded",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const STATUS_STEPS = [
  { key: "created", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipping", label: "Shipping" },
  { key: "delivered", label: "Delivered" },
];

function normalizeStatus(statusRaw) {
  if (!statusRaw) return "";
  return String(statusRaw).toLowerCase();
}

function getStepIndexFromStatus(statusRaw) {
  const status = normalizeStatus(statusRaw);
  if (!status) return 0;

  if (status === "pending") return 0;
  if (status === "completed" || status === "shipped") return 3;

  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

const OrderDetail = () => {
  const params = useParams();

  // Support /orders/:id, /orders/:orderId, etc.
  const orderId =
    params.id ||
    params.orderId ||
    params._id ||
    Object.values(params)[0];

  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const lineItems = useMemo(() => {
    if (!order) return [];
    const raw =
      order.items || order.orderItems || order.cartItems || [];
    return Array.isArray(raw) ? raw : [];
  }, [order]);

  const loadOrder = async () => {
    if (!orderId) {
      setError("Order ID not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = `${API_BASE_URL}/api/orders/${orderId}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text(); // vẫn log ra console cho dev xem
        console.error("OrderDetail ERROR response:", text);

        let message = "Unable to load order. Please try again later.";

        if (res.status === 404) {
          message = "Order not found.";
        } else if (res.status === 401 || res.status === 403) {
          message = "You need to sign in to view this order.";
        }

        throw new Error(message);
      }


      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("OrderDetail – non-JSON response:", text);
        throw new Error("Something went wrong on the server. Please try again later.");
      }


      const data = await res.json();
      // backend: { success:true, data:{...} }
      const orderData = data.data || data.order || data;
      setOrder(orderData);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while loading the order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const totalItems = useMemo(() => {
    if (!lineItems.length) return 0;

    let count = lineItems.reduce((sum, item) => {
      const q =
        item.quantity ??
        item.qty ??
        item.count ??
        0;

      return sum + (Number(q) || 0);
    }, 0);

    if (!count && lineItems.length) {
      count = lineItems.length;
    }

    return count;
  }, [lineItems]);

  const loyaltyPoints = useMemo(() => {
    return calculateLoyaltyPoints(order);
  }, [order]);

  const status = normalizeStatus(order?.status);
  const isRefunded = status === "refunded";
  const isCancelled =
    status === "cancelled" || status === "canceled" || isRefunded;
  const stepIndex = getStepIndexFromStatus(order?.status);
  const statusLabel = STATUS_LABELS[status] || order?.status || "Unknown";

  const shortCode = order?.displayCode
    ? `#${String(order.displayCode).toUpperCase()}`
    : order?.id
      ? `#${String(order.id).slice(-4).toUpperCase()}`
      : "—";

  return (
    <main className="order-detail-page">
      <div className="order-detail-inner">
        <div className="order-detail-header-bar">
          <button
            type="button"
            className="order-detail-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <h1>Order details</h1>
        </div>

        <div className="order-detail-card">
          {loading && (
            <div className="order-detail-state">
              <div className="spinner" />
              <p>Loading order...</p>
            </div>
          )}

          {!loading && error && (
            <div className="order-detail-state order-detail-error">
              <p>{error}</p>
              <button type="button" onClick={loadOrder}>
                Try again
              </button>
            </div>
          )}


          {!loading && !error && !order && (
            <div className="order-detail-state order-detail-error">
              <p>Order not found.</p>
            </div>
          )}

          {!loading && !error && order && (
            <>
              {/* TOP SUMMARY */}
              <div className="order-detail-top">
                <div>
                  <p className="order-detail-code">Order: {shortCode}</p>
                  <p className="order-detail-time">
                    Placed at: {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="order-detail-status-block">
                  {status ? (
                    isRefunded ? (
                      <span className="order-status-badge order-status-refunded">
                        Refunded
                      </span>
                    ) : isCancelled ? (
                      <span className="order-status-badge order-status-cancelled">
                        Cancelled
                      </span>
                    ) : (
                      <span
                        className={`order-status-badge order-status-${status}`}
                      >
                        {statusLabel}
                      </span>
                    )
                  ) : (
                    <span className="order-status-badge order-status-unknown">
                      Unknown
                    </span>
                  )}
                </div>
              </div>

              {/* STATUS STEPS / TIMELINE */}
              <div
                className={
                  "order-detail-steps" +
                  (!isCancelled ? ` od-step-${stepIndex}` : "")
                }
              >
                {STATUS_STEPS.map((step, index) => {
                  const active = !isCancelled && index <= stepIndex;
                  return (
                    <div
                      key={step.key}
                      className={`order-detail-step ${active ? "order-detail-step-active" : ""
                        }`}
                    >
                      <div className="order-detail-step-circle" />
                      <span className="order-detail-step-label">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>


              {/* MAIN CONTENT GRID */}
              <div className="order-detail-grid">
                {/* LEFT: SHIPPING + PAYMENT + ITEMS */}
                <div className="order-detail-column">
                  <div className="order-detail-section">
                    <h2>Shipping information</h2>
                    <div className="order-detail-info">
                      <p>
                        <span className="label">Recipient name:</span>{" "}
                        {order.shippingAddress?.fullName ||
                          order.shippingAddress?.name ||
                          "—"}
                      </p>
                      <p>
                        <span className="label">Phone number:</span>{" "}
                        {order.shippingAddress?.phone || "—"}
                      </p>
                      <p>
                        <span className="label">Address:</span>{" "}
                        {(() => {
                          const a = order.shippingAddress || {};
                          const parts = [
                            a.addressLine,
                            a.address,
                            a.street,
                            a.ward,
                            a.district,
                            a.city,
                          ].filter(Boolean);
                          return parts.length ? parts.join(", ") : "—";
                        })()}
                      </p>
                    </div>
                  </div>


                  <div className="order-detail-section">
                    <h2>Payment</h2>
                    <div className="order-detail-info">
                      <p>
                        <span className="label">Method:</span>{" "}
                        {order.paymentMethod || "—"}
                      </p>
                      {order.paymentStatus && (
                        <p>
                          <span className="label">Payment status:</span>{" "}
                          {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                            order.paymentStatus}
                        </p>
                      )}
                    </div>
                  </div>


                  <div className="order-detail-section order-detail-items">
                    <h2>Ordered items</h2>

                    {lineItems.length === 0 ? (
                      <p className="order-detail-items-empty">
                        This order has no items.
                      </p>
                    ) : (
                      <ul className="order-detail-items-list">
                        {lineItems.map((item, index) => {
                          const qty =
                            item.quantity ??
                            item.qty ??
                            item.count ??
                            1;
                          const price = Number(item.price) || 0;
                          const lineTotal = qty * price;

                          // Lấy text variant
                          // Lấy text variant, ưu tiên value (option đã chọn)
                          let variantText = "";

                          if (item.variant) {
                            if (typeof item.variant === "object") {
                              const value =
                                item.variant.value ||
                                item.variant.label ||
                                item.variant.option ||
                                "";

                              const groupName = item.variant.name || item.variant.type || "";

                              // Nếu có cả tên nhóm & value thì ghép "Size: 250g"
                              if (groupName && value) {
                                variantText = `${groupName}: ${value}`;
                              } else {
                                variantText = value || groupName;
                              }
                            } else {
                              // variant là string đơn giản
                              variantText = String(item.variant);
                            }
                          }


                          return (
                            <li
                              key={
                                item._id ||
                                item.id ||
                                item.productId ||
                                index
                              }
                              className="order-detail-item-row"
                            >
                              <div className="order-detail-item-main">
                                <div className="order-detail-item-title">
                                  {item.name || "Unnamed item"}
                                </div>

                                {variantText && (
                                  <div className="order-detail-item-variant">
                                    {variantText}
                                  </div>
                                )}

                                <div className="order-detail-item-meta">
                                  <span className="order-detail-item-qty">
                                    Qty: {qty}
                                  </span>
                                  <span className="order-detail-item-price">
                                    {formatCurrency(price)}
                                  </span>
                                </div>
                              </div>

                              <div className="order-detail-item-total">
                                {formatCurrency(lineTotal)}
                              </div>
                            </li>
                          );
                        })}

                      </ul>
                    )}
                  </div>
                </div>


                {/* RIGHT: TOTALS */}
                <div className="order-detail-column">
                  <div className="order-detail-section order-detail-summary">
                    <h2>Order summary</h2>
                    <div className="order-detail-summary-row">
                      <span>Items</span>
                      <span>{totalItems}</span>
                    </div>
                    <div className="order-detail-summary-row">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="order-detail-summary-row">
                      <span>Shipping fee</span>
                      <span>{formatCurrency(order.shippingFee || 0)}</span>
                    </div>
                    {order.discount != null && order.discount > 0 && (
                      <div className="order-detail-summary-row">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}

                    <div className="order-detail-summary-row order-detail-summary-total">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                    <div className="order-detail-summary-row">
                      <span>Loyalty points earned</span>
                      <span>{loyaltyPoints}</span>
                    </div>

                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default OrderDetail;
