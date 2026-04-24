// src/pages/Checkout/CheckoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile } from "../../services/account";
import { useNotifications } from "../../contexts/NotificationContext";
import "./checkout-page.css";
import { api } from "../../lib/api";
import momoLogo from "./momo_logo.jpg";
import vnpayLogo from "./vnpay_logo.png";


const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function generateTempPassword(length = 10) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const CheckoutPage = () => {
  const { addNotification } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const { items: cartItems, clearCart } = useCart();
  const { user, register, updateUser } = useAuth();

  // Số điểm khách đang muốn dùng cho đơn này
  const [pointsToUse, setPointsToUse] = useState(0);

  // Số điểm hiện có (lấy từ user nếu backend trả về trong payload)
  const availablePoints = Math.max(
    0,
    Number(
      user?.loyalty?.currentPoints ??
      user?.loyalty?.points ??
      0
    ) || 0
  );


  // Giá trị quy đổi sang VND
  const loyaltyDiscount = pointsToUse * 1000;

  // ===== VOUCHER =====
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");

  // Items passed from CartPage (navigate("/checkout", { state: { items } }))
  const itemsFromState = Array.isArray(location.state?.items)
    ? location.state.items
    : [];

  // Fallback: if user refreshes (F5) and state is lost, get items again from CartContext
  const items = itemsFromState.length ? itemsFromState : cartItems || [];

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
        0
      ),
    [items]
  );

  const shippingFee = subtotal > 300000 ? 0 : 30000;
  const total = Math.max(
    0,
    subtotal + shippingFee - loyaltyDiscount - voucherDiscount
  );


  // ======= Get addresses & payment methods from user (default first) =======
  const savedAddresses = Array.isArray(user?.addresses)
    ? [...user.addresses].sort((a, b) => {
      if (!!a?.isDefault === !!b?.isDefault) return 0;
      return a?.isDefault ? -1 : 1; // isDefault = true goes first
    })
    : [];

  const savedPayments = Array.isArray(user?.paymentMethods)
    ? [...user.paymentMethods].sort((a, b) => {
      if (!!a?.isDefault === !!b?.isDefault) return 0;
      return a?.isDefault ? -1 : 1;
    })
    : [];

  // mode: use saved address or new one
  const [addressMode, setAddressMode] = useState(
    savedAddresses.length > 0 ? "saved" : "new"
  );
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveAddress, setSaveAddress] = useState(true);

  // mode: use saved payment method or choose another type
  const [paymentMode, setPaymentMode] = useState(
    savedPayments.length > 0 ? "saved" : "new"
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);

  // Form: will be prefilled from user via useEffect below
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    ward: "",
    district: "",
    city: "",
    note: "",
    paymentMethod: "cod", // 'cod' | 'vnpay'
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accountCreatedInfo, setAccountCreatedInfo] = useState(null);
  const [orderCreated, setOrderCreated] = useState(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [pendingOrderPayload, setPendingOrderPayload] = useState(null);

  // trạng thái đã đặt hàng xong
  const isSuccess = !!orderCreated;

  // Prefill form from user (name / phone / email)
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      fullName:
        prev.fullName ||
        user.fullName ||
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      phone: prev.phone || user.phone || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  // When addresses are loaded and none is selected → pick default one (or first)
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      setAddressMode("saved");
      const def =
        savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(String(def._id || def.id || 0));
    }
  }, [savedAddresses, selectedAddressId]);

  // When payment methods are loaded and none is selected → pick default one (or first)
  useEffect(() => {
    if (savedPayments.length > 0 && !selectedPaymentId) {
      setPaymentMode("saved");
      const def =
        savedPayments.find((p) => p.isDefault) || savedPayments[0];
      setSelectedPaymentId(String(def._id || def.id || 0));
    }
  }, [savedPayments, selectedPaymentId]);

  // ❗ Nếu không có item nào để thanh toán (và cũng chưa vừa đặt xong đơn)
  if (!orderCreated && (!items || items.length === 0)) {
    return (
      <main className="checkout-page checkout-page--empty">
        <div className="checkout-empty-card">
          <h1>No items to checkout</h1>
          <p>Please add items to your cart before checking out.</p>
          <button
            type="button"
            className="checkout-empty-btn"
            onClick={() => navigate("/cart")}
          >
            Back to cart
          </button>
        </div>
      </main>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "paymentMethod") {
      console.log(`🎯 [Strategy Pattern] Changing payment strategy to: ${value.toUpperCase()}`);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  
    const handleApplyVoucher = async () => {
    const trimmed = voucherCode.trim();
    if (!trimmed) {
      setVoucherMessage("Please enter a discount code.");
      setVoucherDiscount(0);
      return;
    }

    try {
      setVoucherMessage("Checking code...");

      const res = await api.post("/api/discount-codes/validate", {
        code: trimmed,
        subtotal,
        shippingFee,
      });

      const data = res.data || res;

      if (!data.valid) {
        setVoucherMessage(data.message || "This code is not valid.");
        setVoucherDiscount(0);
        return;
      }

      const discountAmount = Number(data.discountAmount) || 0;
      setVoucherDiscount(discountAmount);

      const type = (data.type || "").toLowerCase();

      if (type === "amount") {
        // Mã GIAM10, TRU20... trừ thẳng tiền
        setVoucherMessage(
          `Code applied: -${formatVND(discountAmount)}.`
        );
      } else {
        // Mã giảm theo %
        setVoucherMessage(
          `Code applied: ${data.discountPercent || 0}% off (-${formatVND(
            discountAmount
          )}).`
        );
      }
    } catch (err) {
      console.error("Apply voucher error:", err);
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Unable to apply this discount code.";
      setVoucherMessage(msg);
      setVoucherDiscount(0);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate address
    if (addressMode === "new") {
      if (!form.fullName || !form.phone || !form.addressLine || !form.city) {
        setError("Please fill in all required shipping information.");
        return;
      }
    } else if (
      addressMode === "saved" &&
      savedAddresses.length > 0 &&
      !selectedAddressId
    ) {
      setError("Please select a shipping address.");
      return;
    }

    // Email is required
    if (!form.email) {
      setError(
        "Please enter your email so we can create an account and send your order info."
      );
      return;
    }

    // Validate payment
    if (
      paymentMode === "saved" &&
      savedPayments.length > 0 &&
      !selectedPaymentId
    ) {
      setError("Please select a payment method.");
      return;
    }

    // Prepare shippingAddress
    let shippingAddress = null;

    if (
      addressMode === "saved" &&
      savedAddresses.length > 0 &&
      selectedAddressId
    ) {
      const addr = savedAddresses.find(
        (a, idx) =>
          String(a._id || a.id || idx) === String(selectedAddressId)
      );

      if (addr) {
        const line =
          addr.addressLine1 || addr.addressLine || addr.address || "";

        shippingAddress = {
          fullName: addr.fullName || addr.name,
          phone: addr.phone,
          addressLine1: line,
          addressLine: line,
          ward: addr.ward,
          district: addr.district,
          city: addr.city,
        };
      }
    }

    if (!shippingAddress) {
      shippingAddress = {
        fullName: form.fullName,
        phone: form.phone,
        addressLine1: form.addressLine,
        addressLine: form.addressLine,
        ward: form.ward,
        district: form.district,
        city: form.city,
      };
    }

    // Prepare payment
    let paymentMethod = form.paymentMethod || "cod";

    if (
      paymentMode === "saved" &&
      savedPayments.length > 0 &&
      selectedPaymentId
    ) {
      const pm = savedPayments.find(
        (p, idx) =>
          String(p._id || p.id || idx) === String(selectedPaymentId)
      );
      if (pm) {
        paymentMethod =
          pm.code ||
          pm.type ||
          pm.provider ||
          pm.method ||
          form.paymentMethod ||
          "saved";
      }
    }

    try {
      setSubmitting(true);

      // ==== Nếu chưa đăng nhập -> auto register account trước khi tạo order ====
      let effectiveUser = user;

      if (!effectiveUser) {
        const nameForRegister =
          form.fullName || form.email.split("@")[0] || "Guest";

        // 🔐 Tạo password random
        const autoPassword = generateTempPassword(10);

        try {
          const created = await register({
            name: nameForRegister,
            email: form.email,
            password: autoPassword,
            sendPasswordEmail: true,
          });

          effectiveUser = created;
          setAccountCreatedInfo({ email: form.email });
        } catch (regErr) {
          console.error("Auto register error:", regErr);
          const msg =
            regErr?.response?.data?.message ||
            regErr.message ||
            "Unable to create account with this email.";

          if (msg.toLowerCase().includes("exist")) {
            setError("This email already has an account. Please log in before checking out.");
          } else {
            setError(msg);
          }
          return;
        }
      }

      // Payload sent to /api/orders
      // Payload sent to /api/orders
    const payload = {
      customerId: effectiveUser?._id || effectiveUser?.id,
      items: items.map((it) => ({
        productId: it.productId || it._id || it.id,
        name: it.name,
        qty: it.qty || it.quantity || 1,
        quantity: it.qty || it.quantity || 1,
        price: it.price,
        variant: it.variant,
        image: it.image,
      })),
      customerName: form.fullName,
      customerPhone: form.phone,
      customerEmail: effectiveUser?.email || form.email,
      shippingAddress,
      note: form.note,
      paymentMethod: form.paymentMethod, // ✅ Luôn lấy từ form để đồng bộ
      // ĐỒNG BỘ: Sử dụng tên trường khớp chính xác với Backend
      paymentDetails: form.paymentMethod !== "cod" ? { 
        cardholderName: form.fullName || "Guest User",
        accountHolderName: form.fullName || "Guest User",
        cardNumber: "4111111111111111", 
        bankCode: "TEST-BANK",
        accountNumber: "123456789",
        expiryDate: "12/28",
        cvv: "123",
        status: "simulated_success"
      } : {},
      currency: "VND",
      shippingFee,
      subtotal: subtotal,
      total: total,
      pointsUsed: pointsToUse,
      discount: voucherDiscount,
      discountCode: voucherCode.trim() || undefined,
    };

      // ✅ NẾU LÀ THANH TOÁN ONLINE -> HIỆN MODAL MÔ PHỎNG TRƯỚC
      if (paymentMethod !== "cod") {
        setPendingOrderPayload(payload);
        setIsSimulatingPayment(true);
        setSubmitting(false); // 👈 Quan trọng: Nhả nút để người dùng bấm được trong Modal
        return;
      }

      await executePlaceOrder(payload, false, shippingAddress);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while creating the order.");
    } finally {
      if (form.paymentMethod === "cod") setSubmitting(false);
    }
  };

  /**
   * Thực hiện gọi API tạo đơn hàng
   */
  const executePlaceOrder = async (payload, isPaid = false, finalShippingAddress = null) => {
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Order API Error:", errorData);
        throw new Error(errorData.message || errorData.error || "Unable to create order. Please try again.");
      }

      const data = await res.json();
      console.log("✅ Order created successfully:", data);
      const order = data.data || data.order || data;

      // Nếu đã trả tiền qua modal simulation -> update status
      if (isPaid) {
        const orderId = order.id || order._id;
        try {
          const patchRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ paymentStatus: "paid" }),
          });

          if (!patchRes.ok) {
            const patchError = await patchRes.json();
            console.error("❌ Order Status Update (PATCH) Error:", patchError);
          } else {
            console.log("✅ Order marked as paid successfully");
          }
        } catch (e) {
          console.error("Mark as paid failed:", e);
        }
      }

      // 💾 Lưu địa chỉ mới nếu có tick chọn
      if (addressMode === "new" && saveAddress && finalShippingAddress) {
        try {
          let list = Array.isArray(user?.addresses) ? [...user.addresses] : [];
          list = list.map(a => ({ ...a, isDefault: false }));
          list.push({
            label: "Shipping address",
            type: "shipping",
            ...finalShippingAddress,
            isDefault: true,
          });
          const result = await updateProfile({ addresses: list });
          if (result) updateUser?.(result.data || result);
        } catch (e) {
          console.error("Save address failed:", e);
        }
      }

      // Refresh user data (points, etc)
      try {
        const meRes = await api.get("/api/auth/me");
        updateUser?.(meRes?.data?.data || meRes?.data || meRes);
      } catch (e) {}

      clearCart();
      setOrderCreated(order);
      window.scrollTo({ top: 0, behavior: "smooth" });

      addNotification({
        type: "order",
        title: "Order placed successfully",
        message: `Order ${order.displayCode || order._id || ""} confirmed`,
        link: order._id ? `/orders/${order._id}` : "/orders",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setIsSimulatingPayment(false);
      setPendingOrderPayload(null);
    }
  };

  return (
    <main
      className={
        "checkout-page" + (isSuccess ? " checkout-page--success" : "")
      }
    >
      <div
        className={
          "checkout-layout" +
          (isSuccess ? " checkout-layout--single" : "")
        }
      >
        {/* LEFT */}
        <section
          className={
            "checkout-main" +
            (isSuccess ? " checkout-main--success-only" : "")
          }
        >
          <header className="checkout-header">
            <h1>Checkout</h1>
            <p>
              {user
                ? "Select your address and payment method, then place your order."
                : "Checkout as a guest. We will create an account for you using your email."}
            </p>
          </header>

          {accountCreatedInfo && (
            <div className="checkout-inline-notice">
              <div className="checkout-inline-notice-main">
                <div className="checkout-inline-notice-title">
                  Account created for you
                </div>
                <p className="checkout-inline-notice-text">
                  We&apos;ve created an account so you can track your orders and
                  save your details. We&apos;ve sent a temporary password to
                  your email.
                </p>
                <div className="checkout-inline-notice-credentials">
                  <div className="notice-cred-item">
                    <span className="notice-cred-label">Email</span>
                    <span className="notice-cred-value">
                      {accountCreatedInfo.email}
                    </span>
                  </div>
                </div>
                <p className="checkout-inline-notice-sub">
                  Please check your inbox (and spam folder) for the temporary
                  password. You can change it later in your account settings.
                </p>
              </div>
              <button
                type="button"
                className="checkout-inline-notice-close"
                onClick={() => setAccountCreatedInfo(null)}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          )}

          {orderCreated && (
            <div className="checkout-success-card">
              <h2>Order placed successfully 🎉</h2>
              <p className="checkout-success-text">
                Thank you for your order. You can review the details and track
                the status in your account.
              </p>

              <div className="checkout-success-meta">
                {orderCreated.displayCode && (
                  <div className="checkout-success-row">
                    <span className="checkout-success-label">Order code</span>
                    <span className="checkout-success-value">
                      {orderCreated.displayCode}
                    </span>
                  </div>
                )}
                <div className="checkout-success-row">
                  <span className="checkout-success-label">Total</span>
                  <span className="checkout-success-value">
                    {formatVND(total)}
                  </span>
                </div>
              </div>

              <div className="checkout-success-actions">
                <button
                  type="button"
                  className="checkout-submit-btn checkout-submit-btn--primary"
                  onClick={() => {
                    const id = orderCreated._id || orderCreated.id;
                    if (id) {
                      navigate(`/orders/${id}`);
                    } else {
                      navigate("/orders");
                    }
                  }}
                >
                  View order details
                </button>
                <button
                  type="button"
                  className="checkout-back-btn checkout-back-btn--ghost"
                  onClick={() => navigate("/")}
                >
                  Back to home
                </button>
              </div>
            </div>
          )}

          {/* Form + summary chỉ hiện khi CHƯA đặt xong */}
          {!orderCreated && (
            <form className="checkout-form" onSubmit={handleSubmit}>
              {/* SHIPPING ADDRESS */}
              <section className="checkout-section">
                <div className="checkout-section-header">
                  <h2>Shipping address</h2>
                  {savedAddresses.length > 0 && (
                    <div className="checkout-toggle-group">
                      <button
                        type="button"
                        className={
                          "checkout-toggle-btn" +
                          (addressMode === "saved"
                            ? " checkout-toggle-btn--active"
                            : "")
                        }
                        onClick={() => setAddressMode("saved")}
                      >
                        Saved addresses
                      </button>
                      <button
                        type="button"
                        className={
                          "checkout-toggle-btn" +
                          (addressMode === "new"
                            ? " checkout-toggle-btn--active"
                            : "")
                        }
                        onClick={() => setAddressMode("new")}
                      >
                        New address
                      </button>
                    </div>
                  )}
                </div>

                {savedAddresses.length > 0 && addressMode === "saved" ? (
                  <>
                    <div className="checkout-address-list">
                      {savedAddresses.map((addr, idx) => {
                        const id = String(addr._id || addr.id || idx);
                        const active = selectedAddressId === id;
                        const parts = [
                          addr.addressLine ||
                          addr.addressLine1 ||
                          addr.address,
                          addr.ward,
                          addr.district,
                          addr.city,
                        ].filter(Boolean);

                        return (
                          <button
                            type="button"
                            key={id}
                            className={
                              "checkout-address-card" +
                              (active
                                ? " checkout-address-card--active"
                                : "")
                            }
                            onClick={() => setSelectedAddressId(id)}
                          >
                            <div className="checkout-address-header-row">
                              <div className="checkout-address-name">
                                {addr.fullName || addr.name}
                              </div>
                              {addr.isDefault && (
                                <span className="badge-default">Default</span>
                              )}
                            </div>
                            {addr.phone && (
                              <div className="checkout-address-phone">
                                {addr.phone}
                              </div>
                            )}
                            <div className="checkout-address-text">
                              {parts.join(", ")}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="checkout-address-new-link"
                      onClick={() => setAddressMode("new")}
                    >
                      + Add a new address
                    </button>
                  </>
                ) : (
                  <>
                    <div className="checkout-two-cols">
                      <div className="checkout-field-group">
                        <label>
                          Full name<span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="checkout-field-group">
                        <label>
                          Phone number<span className="required">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="0901 234 567"
                        />
                      </div>
                    </div>

                    <div className="checkout-field-group">
                      <label>
                        Address<span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="addressLine"
                        value={form.addressLine}
                        onChange={handleChange}
                        placeholder="House number, street name..."
                      />
                    </div>

                    <div className="checkout-three-cols">
                      <div className="checkout-field-group">
                        <label>Ward</label>
                        <input
                          type="text"
                          name="ward"
                          value={form.ward}
                          onChange={handleChange}
                          placeholder="Ward"
                        />
                      </div>
                      <div className="checkout-field-group">
                        <label>District</label>
                        <input
                          type="text"
                          name="district"
                          value={form.district}
                          onChange={handleChange}
                          placeholder="District"
                        />
                      </div>
                      <div className="checkout-field-group">
                        <label>
                          City/Province<span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="Ho Chi Minh City"
                        />
                      </div>
                    </div>

                    {addressMode === "new" && (
                      <label className="checkout-save-checkbox">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                        />
                        <span>
                          {savedAddresses.length === 0
                            ? "Save this address as your default shipping address"
                            : "Save this address and set it as your default shipping address"}
                        </span>
                      </label>
                    )}

                  </>
                )}
              </section>

              {/* CONTACT EMAIL */}
              <div className="checkout-field-group">
                <label>
                  Email<span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  readOnly={!!user?.email}
                />
                {!user && (
                  <p className="checkout-email-hint">
                    We&apos;ll create an account for you with this email.
                  </p>
                )}
              </div>

              {/* NOTE & PAYMENT */}
              <section className="checkout-section">
                <h2>Notes & payment</h2>

                <div className="checkout-field-group">
                  <label>Note for the shop</label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={3}
                    placeholder="E.g. deliver during lunch break..."
                  />
                </div>

                <div className="checkout-field-group">
                  <label>Payment method</label>

                  {savedPayments.length > 0 && (
                    <div className="checkout-toggle-group">
                      <button
                        type="button"
                        className={
                          "checkout-toggle-btn" +
                          (paymentMode === "saved"
                            ? " checkout-toggle-btn--active"
                            : "")
                        }
                        onClick={() => setPaymentMode("saved")}
                      >
                        Saved methods
                      </button>
                      <button
                        type="button"
                        className={
                          "checkout-toggle-btn" +
                          (paymentMode === "new"
                            ? " checkout-toggle-btn--active"
                            : "")
                        }
                        onClick={() => setPaymentMode("new")}
                      >
                        Other methods
                      </button>
                    </div>
                  )}

                  {savedPayments.length > 0 && paymentMode === "saved" ? (
                    <>
                      <div className="checkout-payment-saved-list">
                        {savedPayments.map((pm, idx) => {
                          const id = String(pm._id || pm.id || idx);
                          const active = selectedPaymentId === id;

                          const type = (pm.type || "").toLowerCase();
                          const label =
                            pm.label ||
                            pm.brand ||
                            (type === "cash"
                              ? "Cash on delivery (COD)"
                              : type === "card"
                                ? "Bank card"
                                : type === "bank"
                                  ? "Bank account"
                                  : "Payment");

                          const detail =
                            pm.masked && typeof pm.masked === "string"
                              ? pm.masked
                              : pm.last4
                                ? `•••• ${pm.last4}`
                                : pm.accountNumber
                                  ? `••${String(pm.accountNumber).slice(-4)}`
                                  : "";

                          return (
                            <button
                              type="button"
                              key={id}
                              className={
                                "payment-method-card" +
                                (active
                                  ? " payment-method-card--active"
                                  : "")
                              }
                              onClick={() => setSelectedPaymentId(id)}
                            >
                              <div className="payment-method-top-row">
                                <span className="payment-method-label">
                                  {label}
                                </span>
                                {pm.isDefault && (
                                  <span className="badge-default">
                                    Default
                                  </span>
                                )}
                              </div>
                              {detail && (
                                <div className="payment-method-detail">
                                  {detail}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        className="checkout-address-new-link"
                        onClick={() => setPaymentMode("new")}
                      >
                        + Use another method
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="checkout-payment-methods">
                        <label className={`payment-option-fancy ${form.paymentMethod === "cod" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={form.paymentMethod === "cod"}
                            onChange={handleChange}
                          />
                          <div className="payment-option-content">
                            <span className="payment-icon icon-cod">💵</span>
                            <div className="payment-text">
                              <span className="payment-title">Cash on delivery (COD)</span>
                              <span className="payment-desc">Pay when items are delivered</span>
                            </div>
                          </div>
                        </label>

                        <label className={`payment-option-fancy ${form.paymentMethod === "momo" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="momo"
                            checked={form.paymentMethod === "momo"}
                            onChange={handleChange}
                          />
                          <div className="payment-option-content">
                            <img src={momoLogo} alt="Momo" className="payment-logo" />
                            <div className="payment-text">
                              <span className="payment-title">Momo E-Wallet</span>
                              <span className="payment-desc">Pay via Momo QR Code</span>
                            </div>
                          </div>
                        </label>

                        <label className={`payment-option-fancy ${form.paymentMethod === "vnpay" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="vnpay"
                            checked={form.paymentMethod === "vnpay"}
                            onChange={handleChange}
                          />
                          <div className="payment-option-content">
                            <img src={vnpayLogo} alt="VNPAY" className="payment-logo" />
                            <div className="payment-text">
                              <span className="payment-title">VNPAY Gateway</span>
                              <span className="payment-desc">Internet Banking / QR Pay</span>
                            </div>
                          </div>
                        </label>

                        <label className={`payment-option-fancy ${form.paymentMethod === "credit_card" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="credit_card"
                            checked={form.paymentMethod === "credit_card"}
                            onChange={handleChange}
                          />
                          <div className="payment-option-content">
                            <span className="payment-icon">💳</span>
                            <div className="payment-text">
                              <span className="payment-title">Credit / Debit Card</span>
                              <span className="payment-desc">Visa, Mastercard, JCB</span>
                            </div>
                          </div>
                        </label>

                        <label className={`payment-option-fancy ${form.paymentMethod === "bank_transfer" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bank_transfer"
                            checked={form.paymentMethod === "bank_transfer"}
                            onChange={handleChange}
                          />
                          <div className="payment-option-content">
                            <span className="payment-icon">🏦</span>
                            <div className="payment-text">
                              <span className="payment-title">Bank Transfer</span>
                              <span className="payment-desc">Manual transfer via Banking app</span>
                            </div>
                          </div>
                        </label>
                      </div>

                      {savedPayments.length > 0 &&
                        form.paymentMethod !== "cod" && (
                          <label className="checkout-save-checkbox">
                            <input
                              type="checkbox"
                              checked={savePaymentMethod}
                              onChange={(e) =>
                                setSavePaymentMethod(e.target.checked)
                              }
                            />
                            <span>
                              Save this payment method for next time
                            </span>
                          </label>
                        )}
                    </>
                  )}
                </div>
              </section>

              {error && <p className="checkout-error">{error}</p>}

              <div className="checkout-actions">
                <button
                  type="button"
                  className="checkout-back-btn"
                  onClick={() => navigate("/cart")}
                >
                  ← Back to cart
                </button>
                <button
                  type="submit"
                  className="checkout-submit-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? "Creating order..."
                    : `Place order ${formatVND(total)}`}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* RIGHT: SUMMARY – ẩn khi đã đặt xong */}
        {!orderCreated && (
          <aside className="checkout-summary">
            <div className="checkout-summary-card">
              <h2>Your order</h2>
              <div className="checkout-summary-items">
                {items.map((item) => {
                  const lineTotal =
                    (Number(item.price) || 0) * (Number(item.qty) || 1);
                  return (
                    <div
                      className="checkout-summary-item"
                      key={
                        item.key ||
                        `${item.productId}-${item.variant?.value}`
                      }
                    >
                      <div className="checkout-summary-item-main">
                        <div className="checkout-summary-name">
                          {item.name}
                        </div>
                        {item.variant?.value && (
                          <div className="checkout-summary-variant">
                            {item.variant.value}
                          </div>
                        )}
                        <div className="checkout-summary-meta">
                          x{item.qty} · {formatVND(item.price)}
                        </div>
                      </div>
                      <div className="checkout-summary-line-total">
                        {formatVND(lineTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              <div className="checkout-summary-row">
                <span>Shipping fee</span>
                <span>
                  {shippingFee === 0 ? "Free" : formatVND(shippingFee)}
                </span>
              </div>
              
              {/* Discount code */}
              <div className="checkout-summary-row">
                <div className="checkout-summary-label">
                  Discount code
                  {voucherMessage && (
                    <div className="checkout-summary-subtext">
                      {voucherMessage}
                    </div>
                  )}
                </div>
                <div className="checkout-summary-control">
                  <div className="checkout-voucher-row">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      maxLength={5}
                      placeholder="e.g. ABC12"
                      className="checkout-voucher-input"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="checkout-voucher-apply-btn"
                    >
                      Apply
                    </button>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="checkout-summary-subtext">
                      Discount: -{formatVND(voucherDiscount)}
                    </div>
                  )}
                </div>
              </div>


              {availablePoints > 0 && (
                <div className="checkout-summary-row">
                  <div className="checkout-summary-label">
                    Loyalty points
                    <div className="checkout-summary-subtext">
                      Available: {availablePoints} pts (
                      {formatVND(availablePoints * 1000)})
                    </div>
                  </div>
                  <div className="checkout-summary-control">
                    <input
                      type="number"
                      min={0}
                      max={availablePoints}
                      value={pointsToUse}
                      onChange={(e) => {
                        const raw = Number(e.target.value) || 0;
                        // không cho âm, không cho vượt quá available
                        let next = Math.max(0, Math.min(availablePoints, Math.floor(raw)));

                        // tránh giảm quá total trước giảm giá
                        const maxByOrder = Math.floor((subtotal + shippingFee) / 1000);
                        next = Math.min(next, maxByOrder);

                        setPointsToUse(next);
                      }}
                      className="checkout-points-input"
                    />
                    {pointsToUse > 0 && (
                      <div className="checkout-summary-subtext">
                        Discount: -{formatVND(loyaltyDiscount)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="checkout-summary-total-row">
                <span>Total</span>
                <span>{formatVND(total)}</span>
              </div>
              <p className="checkout-summary-note">
                By placing this order, you agree to the shop&apos;s policies.
              </p>
            </div>
          </aside>
        )}
      </div>
      {/* PAYMENT SIMULATION MODAL */}
      {isSimulatingPayment && (
        <div className="payment-modal-overlay">
          <div className="payment-modal-card">
            <header className="payment-modal-header">
              <h3>Secure Payment Simulation</h3>
              <button 
                type="button" 
                className="payment-modal-close"
                onClick={() => setIsSimulatingPayment(false)}
              >
                ×
              </button>
            </header>
            
            <div className="payment-modal-body">
              <div className="payment-modal-amount">
                <span className="payment-modal-label">Amount to pay</span>
                <span className="payment-modal-value">{formatVND(total)}</span>
              </div>
              
              <div className="payment-modal-visual">
                {form.paymentMethod === "momo" ? (
                  <div className="payment-qr-container">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MoMoSimulation" 
                      alt="Momo QR Code" 
                      className="payment-qr-img" 
                    />
                    <p>Scan this QR code with <strong>Momo App</strong> to pay</p>
                  </div>
                ) : form.paymentMethod === "vnpay" ? (
                  <div className="payment-qr-container">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VNPAYSimulation" 
                      alt="VNPAY QR Code" 
                      className="payment-qr-img" 
                    />
                    <p>Scan with <strong>Mobile Banking app</strong> via VNPAY-QR</p>
                  </div>
                ) : form.paymentMethod === "bank_transfer" ? (
                  <div className="payment-qr-container">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BankTransferSimulation" 
                      alt="Bank QR Code" 
                      className="payment-qr-img" 
                    />
                    <p>Transfer to: <strong>Vietcombank - 0011001234567</strong></p>
                  </div>
                ) : form.paymentMethod === "credit_card" ? (
                  <div className="payment-card-sim">
                    <div className="mock-card-front">
                      <div className="card-chip"></div>
                      <div className="card-number">**** **** **** 4242</div>
                      <div className="card-info">
                        <span>HOLDER NAME</span>
                        <span>12/28</span>
                      </div>
                    </div>
                    <p style={{marginTop: '12px', fontSize: '13px', color: '#64748b'}}>Mock Payment Gateway - Enter any info</p>
                    <div className="mock-card-inputs" style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                       <input type="text" placeholder="Card Number" defaultValue="4242 4242 4242 4242" disabled style={{flex: 2, fontSize: '12px'}} />
                       <input type="text" placeholder="CVV" defaultValue="123" disabled style={{flex: 1, fontSize: '12px'}} />
                    </div>
                  </div>
                ) : (
                  <div className="payment-redirect-sim">
                    <div className="payment-loader"></div>
                    <p>Connecting to <strong>{form.paymentMethod.toUpperCase()}</strong> Secure Gateway...</p>
                  </div>
                )}
              </div>
              
              <div className="payment-modal-notice">
                <p>⚠️ This is a <strong>Simulation</strong> for demonstration purposes. No real money will be charged.</p>
              </div>
            </div>

            <footer className="payment-modal-footer">
              <button 
                type="button" 
                className="payment-modal-cancel"
                onClick={() => setIsSimulatingPayment(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="payment-modal-confirm"
                onClick={() => executePlaceOrder(pendingOrderPayload, true)}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Confirm Payment Success"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
};

export default CheckoutPage;
