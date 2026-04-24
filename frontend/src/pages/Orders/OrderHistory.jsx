import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./order-history.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

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

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  // vẫn giữ VND, nếu muốn full English có thể đổi locale & currency
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  // vẫn format theo giờ VN, nếu muốn có thể đổi locale sang "en-GB" hoặc "en-US"
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const OrderHistory = () => {
  const navigate = useNavigate();

  const auth = useAuth();
  const email =
    auth?.user?.email || auth?.currentUser?.email || auth?.email || null;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async (userEmail) => {
    try {
      setLoading(true);
      setError("");

      // ✅ SECURITY: Email is now required (no longer optional)
      if (!userEmail) {
        setError("⚠️ Email is required to view orders. Please ensure you are logged in.");
        setOrders([]);
        return;
      }

      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("includeItems", "true");
      params.set("email", userEmail); // ✅ REQUIRED

      const url = `${API_BASE_URL}/api/orders?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        const errorMsg = text.match(/"message":"([^"]+)"/) ? RegExp.$1 : text;
        
        if (res.status === 400) {
          throw new Error(`❌ ${errorMsg || "Invalid request: Email filter is required"}`);
        }
        throw new Error(
          `Failed to fetch order list (status ${res.status}): ${errorMsg || ""}`
        );
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          "Server returned non-JSON data (often caused by calling the wrong API URL)."
        );
      }

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data.data || data.items || [];

      setOrders(list);
      if (list.length === 0) {
        setError("No orders found for your account."); 
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!email) {
      setLoading(false);
      setOrders([]);
      return;
    }
    loadOrders(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleRowClick = (orderId) => {
    if (!orderId) return;
    navigate(`/orders/${orderId}`);
  };

  const renderStatusBadge = (statusRaw) => {
    if (!statusRaw) {
      return (
        <span className="order-status-badge order-status-unknown">
          Unknown
        </span>
      );
    }
    const key = String(statusRaw).toLowerCase();
    const label = STATUS_LABELS[key] || statusRaw;
    return (
      <span className={`order-status-badge order-status-${key}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="container">
      <div className="order-history-page">
        <div className="order-history-card">
          <div className="order-history-header">
            <div>
              <h1>Order history</h1>
              <p>Review your past orders and their current status.</p>
            </div>
          </div>

          {!email && (
            <div className="order-history-state">
              <p>You need to sign in to view your order history.</p>
            </div>
          )}

          {email && loading && (
            <div className="order-history-state">
              <div className="spinner" />
              <p>Loading orders...</p>
            </div>
          )}

          {email && !loading && error && (
            <div className="order-history-state order-history-error">
              <p>{error}</p>
              <button type="button" onClick={() => loadOrders(email)}>
                Try again
              </button>
            </div>
          )}

          {email && !loading && !error && orders.length === 0 && (
            <div className="order-history-state order-history-empty">
              <h3>No orders yet</h3>
              <p>
                The account {email} doesn&apos;t have any orders yet. Once you
                place an order, it will appear here.
              </p>
            </div>
          )}

          {email && !loading && !error && orders.length > 0 && (
            <div className="order-history-table-wrapper">
              <table className="order-history-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date &amp; time</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>

                  {orders.map((order) => {
                    const shortCode = order.displayCode
                      ? `#${String(order.displayCode).toUpperCase()}`
                      : order.id
                        ? `#${String(order.id).slice(-4).toUpperCase()}`
                        : "—";

                    const rowId = order._id || order.id;

                    return (
                      <tr
                        key={rowId}
                        className="order-history-row"
                        onClick={() => handleRowClick(rowId)}
                      >
                        <td>{shortCode}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>{renderStatusBadge(order.status)}</td>
                        <td className="orders-history-col-points">
                          {order.pointsUsed > 0 && (
                            <div className="points-used">
                              Used: {order.pointsUsed}
                            </div>
                          )}
                          {order.pointsEarned > 0 && (
                            <div className="points-earned">
                              Earned: {order.pointsEarned}
                            </div>
                          )}
                          {order.pointsUsed <= 0 && order.pointsEarned <= 0 && "—"}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <p className="order-history-note">
                Click on a row to view order details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
