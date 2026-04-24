// src/pages/Account/AccountPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile, changePassword } from "../../services/account";
import "./account-page.css";
import { getProducts } from "../../services/products";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

function InfoRow({ label, value, mono }) {
  return (
    <div className="account-info-row">
      <dt className="label">{label}</dt>
      <dd className={`value${mono ? " mono" : ""}`}>{value ?? "—"}</dd>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="account-modal-backdrop">
      <div className="account-modal" role="dialog" aria-modal="true">
        <div className="account-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="account-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="account-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // back to home
  };

  // ==== BASIC STATES ====
  const [activeModal, setActiveModal] = useState(null); // 'profile' | 'address' | 'payment' | 'password' | 'forgot'
  const [profileForm, setProfileForm] = useState(null);
  const [addressForm, setAddressForm] = useState(null);
  const [addressIndex, setAddressIndex] = useState(-1);
  const [paymentForm, setPaymentForm] = useState(null);
  const [paymentIndex, setPaymentIndex] = useState(-1);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==== FORGOT PASSWORD WITH OTP ====
  const [forgotStep, setForgotStep] = useState("request"); // 'request' | 'verify'
  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotInfo, setForgotInfo] = useState("");

  // ==== FAVORITES STATES ====
  const [favoriteItems, setFavoriteItems] = useState([]); // [{ productId, dateAdded, isOnSale, product }]
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");

  // ==== FETCH FAVORITE PRODUCTS FROM wishlist + getProducts ====
  useEffect(() => {
    console.log("[Account] user.wishlist =", user?.wishlist);

    // not logged in or no wishlist → clear
    if (!user || !Array.isArray(user?.wishlist) || user.wishlist.length === 0) {
      setFavoriteItems([]);
      setFavoritesError("");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setFavoritesLoading(true);
        setFavoritesError("");

        // 1) Normalize wishlist: always have productId as string
        const normalizedWishlist = (user.wishlist || [])
          .filter(Boolean)
          .map((entry) => {
            const pid =
              entry.productId ??
              entry.product ??
              entry.id ??
              entry._id ??
              entry.product?._id ??
              entry.product?.id;

            if (!pid) return null;

            return {
              ...entry,
              productId: String(pid),
            };
          })
          .filter(Boolean);

        if (normalizedWishlist.length === 0) {
          if (!cancelled) setFavoriteItems([]);
          return;
        }

        // 2) GET PRODUCT LIST AS ARRAY
        const result = await getProducts({ page: 1, limit: 1000 });

        let list = [];
        if (Array.isArray(result)) {
          list = result;
        } else if (Array.isArray(result?.data)) {
          list = result.data;
        } else if (Array.isArray(result?.items)) {
          list = result.items;
        } else if (Array.isArray(result?.products)) {
          list = result.products;
        }

        console.log("[Account] products from API =", list);

        // 3) Index products by multiple keys (_id, id, productId, sku, slug)
        const productByKey = new Map();

        list.forEach((p) => {
          if (!p) return;
          const keys = [p._id, p.id, p.productId, p.sku, p.slug]
            .filter((k) => k !== undefined && k !== null)
            .map((k) => String(k));

          keys.forEach((k) => {
            if (!productByKey.has(k)) {
              productByKey.set(k, p);
            }
          });
        });

        // 4) Merge wishlist + products
        const favorites = [];

        for (const entry of normalizedWishlist) {
          let product = null;

          // potential keys used to match product
          const candidateKeys = [
            entry.productId,
            entry.id,
            entry._id,
            entry.sku,
            entry.slug,
            entry.product?._id,
            entry.product?.id,
            entry.product?.productId,
          ]
            .filter((k) => k !== undefined && k !== null)
            .map((k) => String(k));

          for (const key of candidateKeys) {
            if (productByKey.has(key)) {
              product = productByKey.get(key);
              break;
            }
          }

          // 5) If still not found → fetch /api/products/:id (legacy numeric ids)
          if (!product && entry.productId) {
            try {
              const res = await fetch(
                `${API_BASE_URL}/api/products/${encodeURIComponent(
                  entry.productId
                )}`
              );
              if (res.ok) {
                const data = await res.json();
                const p = data.data || data.product || data.item || data;

                if (p) {
                  product = p;
                  // cache as well
                  const keys = [
                    p._id,
                    p.id,
                    p.productId,
                    p.sku,
                    p.slug,
                    entry.productId,
                  ]
                    .filter(Boolean)
                    .map(String);
                  keys.forEach((k) => {
                    if (!productByKey.has(k)) {
                      productByKey.set(k, p);
                    }
                  });
                }
              }
            } catch (errSingle) {
              console.error(
                "Fetch single product for wishlist failed:",
                errSingle
              );
            }
          }

          favorites.push({
            ...entry,
            product: product || entry.product || null,
          });
        }

        if (!cancelled) {
          setFavoriteItems(favorites);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Fetch wishlist/favorites error:", err);
        setFavoritesError("Could not load favorite products.");

        // fallback: use user.wishlist directly
        const fallback = (Array.isArray(user?.wishlist) ? user.wishlist : [])
          .filter(Boolean)
          .map((entry) => {
            const pid =
              entry.productId ??
              entry.product ??
              entry.id ??
              entry._id ??
              entry.product?._id ??
              entry.product?.id;

            if (!pid) return null;

            return {
              ...entry,
              productId: String(pid),
              product: entry.product || null,
            };
          })
          .filter(Boolean);

        setFavoriteItems(fallback);
      } finally {
        if (!cancelled) setFavoritesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // === SAFETY: no user (while loading) ===
  if (!user) {
    return (
      <main className="account-page">
        <section className="account-card">
          <p className="account-empty">Loading account...</p>
        </section>
      </main>
    );
  }

  // ==== DERIVED FROM user ====
  const {
    _id,
    id,
    fullName,
    firstName,
    lastName,
    name,
    email,
    phone,
    gender,
    dateOfBirth,
    avatarUrl,
    addresses = [],
    paymentMethods = [],
    loyalty = {},
  } = user || {};

  const customerId = id || _id;
  const rawWishlist = Array.isArray(user?.wishlist) ? user.wishlist : [];

  // fallback: if favoriteItems is empty but user.wishlist has data
  const displayFavorites =
    favoriteItems.length > 0
      ? favoriteItems
      : rawWishlist.map((entry, idx) => {
          const pid =
            entry.productId ??
            entry.product ??
            entry.id ??
            entry._id ??
            entry.product?._id ??
            entry.product?.id ??
            idx;

          return {
            ...entry,
            productId: String(pid),
            product: entry.product || null,
          };
        });

  const displayName =
    fullName ||
    `${firstName || ""} ${lastName || ""}`.trim() ||
    name ||
    "Customer";

  const avatar = avatarUrl || user?.avatar || "/images/avatar-default.png";

  const genderLabel =
    gender === "male" ? "Male" : gender === "female" ? "Female" : gender || "—";

  const loyaltyData = loyalty || {};

  let dobText = null;
  if (dateOfBirth) {
    const d = new Date(dateOfBirth);
    dobText = isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US");
  }

  const points =
    loyaltyData.currentPoints ??
    loyaltyData.totalEarned ??
    loyaltyData.points ??
    0;

  const tierKey = (loyaltyData.tier || "").toLowerCase();
  const tierLabel =
    tierKey === "platinum"
      ? "Platinum"
      : tierKey === "gold"
      ? "Gold"
      : tierKey === "silver"
      ? "Silver"
      : tierKey === "bronze"
      ? "Bronze"
      : loyaltyData.tier || "Member";

  const lastAccrualText = loyaltyData.lastAccrualAt
    ? new Date(loyaltyData.lastAccrualAt).toLocaleString("en-US")
    : null;

  const maskedCustomerId = customerId
    ? `#${String(customerId).toUpperCase()}`
    : "—";

  // ===== OPEN MODALS =====
  const openProfileModal = () => {
    setProfileForm({
      fullName: displayName || "",
      phone: phone || "",
      gender: gender || "",
      dateOfBirth: dateOfBirth
        ? new Date(dateOfBirth).toISOString().slice(0, 10)
        : "",
    });
    setError("");
    setActiveModal("profile");
  };

  const openAddressModal = (index = -1) => {
    const base =
      index >= 0 && addresses[index]
        ? addresses[index]
        : {
            label: "home",
            type: "shipping",
            isDefault: addresses.length === 0,
            fullName: displayName || "",
            phone: phone || "",
            addressLine1: "",
            ward: "",
            district: "",
            city: "",
          };
    setAddressForm(base);
    setAddressIndex(index);
    setError("");
    setActiveModal("address");
  };

  const openPaymentModal = (index = -1) => {
    const base =
      index >= 0 && paymentMethods[index]
        ? paymentMethods[index]
        : {
            type: "cash",
            provider: "",
            brand: "",
            holderName: displayName || "",
            accountNumber: "",
            last4: "",
            expMonth: "",
            expYear: "",
            isDefault: paymentMethods.length === 0,
          };
    setPaymentForm(base);
    setPaymentIndex(index);
    setError("");
    setActiveModal("payment");
  };

  const openForgotModal = () => {
    setForgotStep("request");
    setForgotForm({
      email: email || "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
    setForgotInfo("");
    setError("");
    setActiveModal("forgot");
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setActiveModal("password");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSaving(false);
    setError("");

    // reset forgot password state
    setForgotStep("request");
    setForgotForm({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
    setForgotInfo("");
  };

  // ===== SAVE HANDLERS =====
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm) return;
    try {
      setSaving(true);
      setError("");
      const payload = {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim() || null,
        gender: profileForm.gender || null,
        dateOfBirth: profileForm.dateOfBirth || null,
      };
      const updated = await updateProfile(payload);
      updateUser?.(updated);
      closeModal();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm) return;

    if (!addressForm.addressLine1 || !addressForm.city) {
      setError("Please enter at least Address and City.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      let list = [...addresses];
      let idx = addressIndex;

      if (idx >= 0) {
        list[idx] = addressForm;
      } else {
        list.push(addressForm);
        idx = list.length - 1;
      }

      // ensure exactly one default
      let defaultIndex = -1;

      if (addressForm.isDefault) {
        defaultIndex = idx;
      } else {
        defaultIndex = list.findIndex((a) => a.isDefault);
      }

      if (defaultIndex >= 0) {
        list = list.map((addr, i) => ({
          ...addr,
          isDefault: i === defaultIndex,
        }));
      }

      const updated = await updateProfile({ addresses: list });
      updateUser?.(updated);
      closeModal();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save address."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (idx) => {
    if (idx < 0 || idx >= addresses.length) return;
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      setSaving(true);
      setError("");

      let list = addresses.filter((_, i) => i !== idx);

      if (list.length > 0 && !list.some((a) => a.isDefault)) {
        list = list.map((addr, i) => ({
          ...addr,
          isDefault: i === 0,
        }));
      }

      const updated = await updateProfile({ addresses: list });
      updateUser?.(updated);
    } catch (err) {
      console.error("Delete address failed:", err);
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete address."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm) return;

    try {
      setSaving(true);
      setError("");

      let list = [...paymentMethods];
      let idx = paymentIndex;

      if (idx >= 0) {
        list[idx] = paymentForm;
      } else {
        list.push(paymentForm);
        idx = list.length - 1;
      }

      let defaultIndex = -1;

      if (paymentForm.isDefault) {
        defaultIndex = idx;
      } else {
        defaultIndex = list.findIndex((p) => p.isDefault);
      }

      if (defaultIndex >= 0) {
        list = list.map((pm, i) => ({
          ...pm,
          isDefault: i === defaultIndex,
        }));
      }

      const updated = await updateProfile({ paymentMethods: list });
      updateUser?.(updated);
      closeModal();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save payment method."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (idx) => {
    if (idx < 0 || idx >= paymentMethods.length) return;
    if (!window.confirm("Are you sure you want to delete this method?")) return;

    try {
      setSaving(true);
      setError("");

      let list = paymentMethods.filter((_, i) => i !== idx);

      if (list.length > 0 && !list.some((p) => p.isDefault)) {
        list = list.map((pm, i) => ({
          ...pm,
          isDefault: i === 0,
        }));
      }

      const updated = await updateProfile({ paymentMethods: list });
      updateUser?.(updated);
    } catch (err) {
      console.error("Delete payment method failed:", err);
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete payment method."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      closeModal();
      alert("Password changed successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();

    if (!forgotForm.email) {
      setError("Please enter your email.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setForgotInfo("");

      const res = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotForm.email }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Unable to send verification code. Please try again later."
        );
      }

      setForgotInfo(
        data?.message ||
          "Verification code sent. Please check your email (including Spam)."
      );
      setForgotStep("verify");
    } catch (err) {
      console.error("Forgot password request error:", err);
      setError(
        err?.message ||
          "Unable to send verification code. Please try again later."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();

    if (!forgotForm.otp || !forgotForm.newPassword) {
      setError(
        "Please enter both the verification code and the new password."
      );
      return;
    }
    if (forgotForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setForgotInfo("");

      const res = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotForm.email,
            otp: forgotForm.otp,
            newPassword: forgotForm.newPassword,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Failed to reset password. Please try again later."
        );
      }

      // success
      closeModal();
      alert(
        data?.message ||
          "Password reset successfully. Please use your new password next time you log in."
      );
    } catch (err) {
      console.error("Forgot password verify error:", err);
      setError(
        err?.message ||
          "Failed to reset password. Please try again later."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClickChangeAvatar = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const goToFavoriteProduct = (fav) => {
    if (!fav) return;

    const p = fav.product || {};
    const id = p.id || p._id || fav.productId || p.slug;

    if (!id) return;

    // use /products/:id path (same as cart)
    navigate(`/products/${id}`);
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    try {
      setError("");
      setUploadingAvatar(true);

      const formData = new FormData();
      // field name must match backend upload handler (image/file/avatar...)
      formData.append("image", file);

      // use API_BASE_URL and include cookies
      const uploadRes = await fetch(
        `${API_BASE_URL}/api/upload/image`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        console.error("Upload avatar failed:", text);
        throw new Error("Avatar upload failed. Please try again later.");
      }

      const uploadData = await uploadRes.json();
      console.log("Avatar upload response:", uploadData);

      // support multiple response formats
      const uploadedUrl =
        uploadData.url ||
        uploadData.secure_url ||
        uploadData.data?.url ||
        uploadData.data?.secure_url;

      if (!uploadedUrl) {
        throw new Error("Did not receive image URL from server.");
      }

      // Update profile with new avatar
      const result = await updateProfile({
        avatarUrl: uploadedUrl,
      });

      if (result && result.data) {
        updateUser?.(result.data);
      } else if (result) {
        updateUser?.(result);
      }

      // reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ===== RENDER =====
  return (
    <main className="account-page">
      <section className="account-card">
        {/* HEADER */}
        <header className="account-header">
          <div
            className={
              "account-avatar" +
              (uploadingAvatar ? " account-avatar--loading" : "")
            }
          >
            <img src={avatar} alt={displayName} />

            <button
              type="button"
              className="account-avatar-change"
              onClick={handleClickChangeAvatar}
              disabled={uploadingAvatar}
              aria-label="Change avatar"
            >
              <span
                className={
                  "material-symbols-outlined" +
                  (uploadingAvatar ? " account-avatar-icon--spinning" : "")
                }
              >
                edit
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="account-header-main">
            <div className="account-header-top">
              <div>
                <span className="account-label">Account</span>
                <h1 className="account-name">{displayName}</h1>

                <div className="account-id-inline">
                  <span className="account-id-label">Customer ID</span>
                  <span className="account-id-value">{maskedCustomerId}</span>
                </div>

                <p className="account-email">{email}</p>
              </div>
            </div>

            <div className="account-header-bottom">
              <div className="account-loyalty-pill">
                <span className="tier">{tierLabel}</span>
                <span className="points">{points} loyalty points</span>
              </div>
              {lastAccrualText && (
                <span className="account-loyalty-note">
                  Last point accrual: {lastAccrualText}
                </span>
              )}
            </div>
          </div>

          <div className="account-header-actions">
            <button
              className="account-logout"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>

        {/* PERSONAL INFO */}
        <section className="account-section">
          <div className="section-title-row">
            <h2 className="section-title">Personal information</h2>
          </div>

          <dl className="account-info">
            <InfoRow label="Full name" value={displayName} />
            <InfoRow label="Phone number" value={phone} />
            <InfoRow label="Gender" value={genderLabel} />
            <InfoRow label="Date of birth" value={dobText} />
          </dl>

          <div className="account-primary-actions">
            <button
              className="account-edit-btn"
              type="button"
              onClick={openProfileModal}
            >
              Edit profile
            </button>
            <button
              className="account-edit-btn"
              type="button"
              onClick={openPasswordModal}
            >
              Change password
            </button>
            <button
              className="account-edit-btn account-edit-btn--ghost"
              type="button"
              onClick={openForgotModal}
            >
              Forgot password / get OTP via email
            </button>
          </div>
        </section>

        {/* ADDRESSES */}
        <section className="account-section">
          <div className="section-title-row">
            <h2 className="section-title">Shipping addresses</h2>
            <div className="section-actions">
              <button
                className="section-ghost-btn"
                type="button"
                onClick={() => openAddressModal(-1)}
              >
                Add address
              </button>
            </div>
          </div>

          {addresses.length === 0 ? (
            <p className="account-empty">
              You don&apos;t have any saved address yet. Add one to check out
              faster.
            </p>
          ) : (
            <ul className="account-list">
              {addresses.map((addr, idx) => (
                <li key={idx} className="account-list-item">
                  <div className="account-list-header">
                    <strong>{addr.label || "Address"}</strong>
                    <div className="account-list-tags">
                      {addr.isDefault && (
                        <span className="badge-default">Default</span>
                      )}
                      {addr.type && (
                        <span className="badge-type">
                          {addr.type === "shipping"
                            ? "Shipping"
                            : addr.type === "billing"
                            ? "Billing"
                            : addr.type}
                        </span>
                      )}
                      <button
                        type="button"
                        className="section-ghost-btn section-ghost-btn--small"
                        onClick={() => openAddressModal(idx)}
                        disabled={saving}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="section-ghost-btn section-ghost-btn--small section-ghost-btn--danger"
                        onClick={() => handleDeleteAddress(idx)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="account-list-name">
                    {addr.fullName || displayName}
                  </p>
                  <p>{addr.addressLine1}</p>
                  <p>
                    {[addr.ward, addr.district, addr.city]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{addr.phone || phone || ""}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* PAYMENT METHODS */}
        <section className="account-section">
          <div className="section-title-row">
            <h2 className="section-title">Payment methods</h2>
            <div className="section-actions">
              <button
                className="section-ghost-btn"
                type="button"
                onClick={() => openPaymentModal(-1)}
              >
                Add method
              </button>
            </div>
          </div>

          {paymentMethods.length === 0 ? (
            <p className="account-empty">
              You don&apos;t have any saved payment method.
            </p>
          ) : (
            <ul className="account-payments">
              {paymentMethods.map((pm, idx) => {
                const type = (pm.type || "").toLowerCase();
                const brand = (pm.brand || pm.card?.brand || "").toUpperCase();
                const last4 = pm.last4 || pm.card?.last4 || "";
                const holder =
                  pm.holderName || pm.accountName || displayName || "";

                return (
                  <li
                    key={idx}
                    className={`payment-card payment-card--${type || "other"}`}
                  >
                    <div className="payment-card-top">
                      <div className="payment-card-brand">
                        <span className="chip" />
                        <span className="brand-text">
                          {brand ||
                            (type === "cash"
                              ? "Cash"
                              : type === "bank"
                              ? "Bank account"
                              : "Payment method")}
                        </span>
                      </div>
                      <div className="account-list-tags">
                        {pm.isDefault && (
                          <span className="badge-default">Default</span>
                        )}
                        <button
                          type="button"
                          className="section-ghost-btn section-ghost-btn--small"
                          onClick={() => openPaymentModal(idx)}
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="section-ghost-btn section-ghost-btn--small section-ghost-btn--danger"
                          onClick={() => handleDeletePayment(idx)}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="payment-card-number">
                      {type === "cash" ? (
                        <span className="cash-label">
                          Pay on delivery (COD)
                        </span>
                      ) : last4 ? (
                        <>
                          <span>••••</span>
                          <span>••••</span>
                          <span>••••</span>
                          <span>{last4}</span>
                        </>
                      ) : pm.accountNumber ? (
                        <span className="account-number">
                          {pm.accountNumber}
                        </span>
                      ) : (
                        <span className="cash-label">Payment</span>
                      )}
                    </div>

                    <div className="payment-card-bottom">
                      <span className="holder">{holder}</span>
                      {pm.expMonth && pm.expYear && (
                        <span className="expiry">
                          {String(pm.expMonth).padStart(2, "0")} /
                          {String(pm.expYear).slice(-2)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* FAVORITES */}
        <section className="account-section">
          <div className="section-title-row">
            <h2 className="section-title">Favorite products</h2>
          </div>

          {favoritesLoading ? (
            <p className="account-empty">Loading favorite products...</p>
          ) : favoritesError ? (
            <p className="account-empty">{favoritesError}</p>
          ) : displayFavorites.length === 0 ? (
            <p className="account-empty">
              You don&apos;t have any favorite products yet. Browse the menu and
              tap the heart icon to save them.
            </p>
          ) : (
            <div className="favorites-grid">
              {displayFavorites.map((fav, idx) => {
                const p = fav.product || {};
                return (
                  <article
                    key={`${fav.productId}-${idx}`}
                    className="favorite-card"
                    onClick={() => goToFavoriteProduct(fav)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToFavoriteProduct(fav);
                      }
                    }}
                  >
                    <div className="favorite-thumb">
                      {p && (p.imageUrl || p.image || (p.images && p.images[0])) ? (
                        <img
                          src={p.imageUrl || p.image || p.images[0]}
                          alt={p.name || `Product #${fav.productId}`}
                        />
                      ) : (
                        <div className="favorite-thumb-placeholder">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="favorite-body">
                      <h3 className="favorite-name">
                        {p.name || `Product #${fav.productId}`}
                      </h3>
                      {typeof p.price === "number" && (
                        <div className="favorite-price">
                          {p.price.toLocaleString("en-US")}₫
                        </div>
                      )}
                      <div className="favorite-meta-row">
                        {fav.isOnSale && (
                          <span className="favorite-badge-sale">On sale</span>
                        )}
                        {fav.dateAdded && (
                          <span className="favorite-meta">
                            Added:{" "}
                            {new Date(fav.dateAdded).toLocaleDateString(
                              "en-US"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {/* ===== MODALS ===== */}

      {activeModal === "profile" && profileForm && (
        <Modal title="Edit profile" onClose={closeModal}>
          <form onSubmit={handleSaveProfile}>
            <div className="modal-row">
              <label>Full name</label>
              <input
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, fullName: e.target.value }))
                }
              />
            </div>
            <div className="modal-row">
              <label>Phone number</label>
              <input
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="modal-row-inline">
              <div className="modal-row">
                <label>Gender</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, gender: e.target.value }))
                  }
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="modal-row">
                <label>Date of birth</label>
                <input
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={(e) =>
                    setProfileForm((f) => ({
                      ...f,
                      dateOfBirth: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="account-modal-footer">
              {error && <span className="modal-error">{error}</span>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  Save
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === "address" && addressForm && (
        <Modal
          title={addressIndex >= 0 ? "Edit address" : "Add address"}
          onClose={closeModal}
        >
          <form onSubmit={handleSaveAddress}>
            <div className="modal-row-inline">
              <div className="modal-row">
                <label>Label</label>
                <input
                  value={addressForm.label}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </div>
              <div className="modal-row">
                <label>Type</label>
                <select
                  value={addressForm.type}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
            </div>

            <div className="modal-row">
              <label>Recipient name</label>
              <input
                value={addressForm.fullName}
                onChange={(e) =>
                  setAddressForm((f) => ({
                    ...f,
                    fullName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="modal-row">
              <label>Phone number</label>
              <input
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="modal-row">
              <label>Address</label>
              <input
                value={addressForm.addressLine1}
                onChange={(e) =>
                  setAddressForm((f) => ({
                    ...f,
                    addressLine1: e.target.value,
                  }))
                }
              />
            </div>
            <div className="modal-row-inline">
              <div className="modal-row">
                <label>Ward</label>
                <input
                  value={addressForm.ward}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, ward: e.target.value }))
                  }
                />
              </div>
              <div className="modal-row">
                <label>District</label>
                <input
                  value={addressForm.district}
                  onChange={(e) =>
                    setAddressForm((f) => ({
                      ...f,
                      district: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="modal-row">
              <label>City</label>
              <input
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, city: e.target.value }))
                }
              />
            </div>
            <div className="modal-row">
              <label>
                <input
                  type="checkbox"
                  checked={!!addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm((f) => ({
                      ...f,
                      isDefault: e.target.checked,
                    }))
                  }
                />{" "}
                Set as default address
              </label>
            </div>

            <div className="account-modal-footer">
              {error && <span className="modal-error">{error}</span>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  Save
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === "payment" && paymentForm && (
        <Modal
          title={
            paymentIndex >= 0
              ? "Edit payment method"
              : "Add payment method"
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSavePayment}>
            <div className="modal-row">
              <label>Type</label>
              <select
                value={paymentForm.type}
                onChange={(e) =>
                  setPaymentForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="cash">Cash (COD)</option>
                <option value="card">Bank card</option>
                <option value="bank">Bank account</option>
                <option value="momo">MoMo e-wallet</option>
                <option value="zaloPay">ZaloPay e-wallet</option>
              </select>
            </div>

            {paymentForm.type !== "cash" && (
              <>
                <div className="modal-row">
                  <label>Bank / Brand</label>
                  <input
                    value={paymentForm.provider || paymentForm.brand}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        provider: e.target.value,
                        brand: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="modal-row">
                  <label>Cardholder / account name</label>
                  <input
                    value={paymentForm.holderName}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        holderName: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}

            {paymentForm.type === "card" && (
              <>
                <div className="modal-row">
                  <label>Last 4 digits</label>
                  <input
                    maxLength={4}
                    value={paymentForm.last4}
                    onChange={(e) =>
                      setPaymentForm((f) => ({
                        ...f,
                        last4: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                  />
                </div>
                <div className="modal-row-inline">
                  <div className="modal-row">
                    <label>Expiry month</label>
                    <input
                      maxLength={2}
                      value={paymentForm.expMonth}
                      onChange={(e) =>
                        setPaymentForm((f) => ({
                          ...f,
                          expMonth: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                  </div>
                  <div className="modal-row">
                    <label>Expiry year</label>
                    <input
                      maxLength={4}
                      value={paymentForm.expYear}
                      onChange={(e) =>
                        setPaymentForm((f) => ({
                          ...f,
                          expYear: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {["bank", "momo", "zaloPay"].includes(paymentForm.type) && (
              <div className="modal-row">
                <label>
                  {paymentForm.type === "bank"
                    ? "Account number"
                    : "Wallet / linked phone number"}
                </label>
                <input
                  value={paymentForm.accountNumber}
                  onChange={(e) =>
                    setPaymentForm((f) => ({
                      ...f,
                      accountNumber: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="modal-row">
              <label>
                <input
                  type="checkbox"
                  checked={!!paymentForm.isDefault}
                  onChange={(e) =>
                    setPaymentForm((f) => ({
                      ...f,
                      isDefault: e.target.checked,
                    }))
                  }
                />{" "}
                Set as default payment method
              </label>
            </div>

            <div className="account-modal-footer">
              {error && <span className="modal-error">{error}</span>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  Save
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === "password" && (
        <Modal title="Change password" onClose={closeModal}>
          <form onSubmit={handleChangePassword}>
            <div className="modal-row">
              <label>Current password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div className="modal-row">
              <label>New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div className="modal-row">
              <label>Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>

            <div className="account-modal-footer">
              {error && <span className="modal-error">{error}</span>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  Change password
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === "forgot" && (
        <Modal title="Forgot password" onClose={closeModal}>
          {forgotStep === "request" ? (
            <form onSubmit={handleForgotRequest}>
              <div className="modal-row">
                <label>Login email</label>
                <input
                  type="email"
                  value={forgotForm.email}
                  onChange={(e) =>
                    setForgotForm((f) => ({ ...f, email: e.target.value }))
                  }
                  readOnly={!!email} // on account page, email is usually fixed
                />
                <small className="modal-hint">
                  We&apos;ll send a verification code (OTP) to this email.
                </small>
              </div>

              <div className="account-modal-footer">
                <div className="modal-messages">
                  {error && <span className="modal-error">{error}</span>}
                  {forgotInfo && (
                    <span className="modal-info">{forgotInfo}</span>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    Send code
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotVerify}>
              <div className="modal-row">
                <label>Login email</label>
                <input type="email" value={forgotForm.email} readOnly />
              </div>
              <div className="modal-row">
                <label>Verification code (OTP)</label>
                <input
                  value={forgotForm.otp}
                  onChange={(e) =>
                    setForgotForm((f) => ({ ...f, otp: e.target.value }))
                  }
                />
              </div>
              <div className="modal-row">
                <label>New password</label>
                <input
                  type="password"
                  value={forgotForm.newPassword}
                  onChange={(e) =>
                    setForgotForm((f) => ({
                      ...f,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="modal-row">
                <label>Confirm new password</label>
                <input
                  type="password"
                  value={forgotForm.confirmPassword}
                  onChange={(e) =>
                    setForgotForm((f) => ({
                      ...f,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="account-modal-footer">
                <div className="modal-messages">
                  {error && <span className="modal-error">{error}</span>}
                  {forgotInfo && (
                    <span className="modal-info">{forgotInfo}</span>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    Reset password
                  </button>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </main>
  );
}
