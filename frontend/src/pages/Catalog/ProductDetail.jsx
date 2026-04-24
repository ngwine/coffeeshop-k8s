// src/pages/Catalog/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile } from "../../services/account";
import Navbar from "../../components/NavBar";


import "./product-detail.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

// ===== Shared helpers =====
function resolveImage(product) {
  if (!product) return "/images/coffee1.jpg";

  return (
    product.image ||
    product.imageUrl ||
    (Array.isArray(product.images) && product.images[0]) ||
    product.img ||
    "/images/coffee1.jpg"
  );
}

function formatPrice(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num) || num <= 0) return "Contact us";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

function getSelectedPrice(product, selectedOptions) {
  const base = Number(product?.price || 0);
  if (!product?.variants) return base;
  
  let totalDelta = 0;
  product.variants.forEach(variant => {
    const selectedLabel = selectedOptions[variant.name];
    const option = variant.options?.find(o => o.label === selectedLabel);
    if (option) {
      totalDelta += Number(option.priceDelta || 0);
    }
  });
  
  return base + totalDelta;
}

// ===== Star rating input (1–5, clickable, có hỗ trợ disabled) =====
function StarRatingInput({ value, onChange, disabled }) {
  const [hover, setHover] = React.useState(0);

  const handleEnter = (star) => {
    if (disabled) return;
    setHover(star);
  };

  const handleLeave = () => {
    if (disabled) return;
    setHover(0);
  };

  const handleClick = (star) => {
    if (disabled) return;
    onChange?.(star);
  };

  return (
    <div
      className={
        "star-rating-input" +
        (disabled ? " star-rating-input--disabled" : "")
      }
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            className={`star-btn ${filled ? "filled" : ""}`}
            onMouseEnter={() => handleEnter(star)}
            onMouseLeave={handleLeave}
            onClick={() => handleClick(star)}
            aria-label={`${star} stars`}
            disabled={disabled}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

const ProductDetail = () => {
  const { productId, id: routeId } = useParams();
  const id = productId || routeId;
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // also get updateUser so we can sync user after updating wishlist
  const { user, updateUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOptions, setSelectedOptions] = useState({});
  const [qty, setQty] = useState(1);

  // ----- REVIEW STATE -----
  const [reviews, setReviews] = useState([]); // from DB
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // name + email: use user info if logged in, otherwise let user input
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // ===== Wishlist state =====
  const [savingWishlist, setSavingWishlist] = useState(false);

  // always keep wishlist as array for easier handling
  const wishlist = Array.isArray(user?.wishlist) ? user.wishlist : [];

  const isLoggedIn = !!user;

  // Prefill name/email when user is logged in
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || user.fullName || user.email || "");
      setCustomerEmail(user.email || "");
    }
  }, [user]);

  // ===== Fetch product detail =====
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function fetchDetail() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to fetch product");
        }

        const json = await res.json();
        const p = json.data || json.product || json;
        setProduct(p);

        // setup default options
        const defaults = {};
        p.variants?.forEach(v => {
          if (v.options?.length) {
            defaults[v.name] = v.options[0].label;
          }
        });
        setSelectedOptions(defaults);
        setQty(1);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Product detail error:", err);
          setError(err.message || "Failed to load product details");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
    return () => controller.abort();
  }, [id]);

  // ===== Fetch reviews from backend (initial load) =====
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function fetchReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const res = await fetch(
          `${API_BASE_URL}/api/products/${id}/reviews`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const txt = await res.text();
          console.warn("Fetch reviews fail:", txt);
          return;
        }

        const json = await res.json();
        const list = json.data || json.reviews || [];
        setReviews(list);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Reviews error:", err);
          setReviewsError("Failed to load reviews");
        }
      } finally {
        setReviewsLoading(false);
      }
    }

    fetchReviews();
    return () => controller.abort();
  }, [id]);

  // ===== WebSocket: live update reviews/ratings (optional) =====
  useEffect(() => {
    if (!id) return;

    // 👉 Tự động nhận diện URL WebSocket nếu thiếu cấu hình env
    let wsBase = process.env.REACT_APP_WS_BASE_URL;
    if (!wsBase) {
      const isSecure = window.location.protocol === "https:";
      const host = window.location.hostname === "localhost" ? "localhost:3001" : window.location.host;
      wsBase = (isSecure ? "wss://" : "ws://") + host;
    }

    const wsUrl = wsBase.replace(/\/$/, "") + `/ws/products/${id}/reviews`;

    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.warn("Reviews WebSocket: cannot open connection:", err);
      return;
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // 1) server gửi nguyên list
        const list =
          (Array.isArray(payload) && payload) ||
          (Array.isArray(payload.data) && payload.data) ||
          (Array.isArray(payload.reviews) && payload.reviews);

        if (list) {
          console.log(`🔔 [Observer Pattern] Received real-time review list update via WebSocket (${list.length} reviews)`);
          setReviews(list);
          return;
        }

        // 2) server gửi single review
        const review =
          payload.review ||
          payload.data ||
          (payload.type === "review:new" ? payload.payload : null);

        if (review) {
          console.log(`🔔 [Observer Pattern] Received NEW review in real-time for product ID: ${id}`);
          setReviews((prev) => {
            const idKey = review._id || review.id;
            if (idKey && prev.some((r) => (r._id || r.id) === idKey)) {
              return prev.map((r) =>
                (r._id || r.id) === idKey ? review : r
              );
            }
            return [review, ...prev];
          });
        }
      } catch (err) {
        console.warn("Error parsing reviews WS message:", err);
      }
    };

    ws.onerror = (event) => {
      // Nếu socket đang đóng do unmount thì bỏ qua để đỡ spam
      if (
        ws.readyState === WebSocket.CLOSING ||
        ws.readyState === WebSocket.CLOSED
      ) {
        return;
      }
      console.warn("Reviews WebSocket error:", event);
    };

    return () => {
      try {
        // Chỉ close khi đang OPEN để tránh log 'closed before established'
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close(1000, "component unmount");
        }
      } catch (_) { }
    };
  }, [id]);


  const imageSrc = resolveImage(product);
  const description = product?.description || product?.desc || "";

  const rawStock = Number(product?.quantity);
  const stock = Number.isFinite(rawStock) && rawStock > 0 ? rawStock : 0;
  const inStock = stock > 0;

  // determine selected option by label
  const { priceNumber, total } = useMemo(() => {
    if (!product) {
      return {
        priceNumber: 0,
        total: 0,
      };
    }

    const price = getSelectedPrice(product, selectedOptions);
    const safeQty = qty && qty > 0 ? qty : 1;

    return {
      priceNumber: price,
      total: price * safeQty,
    };
  }, [product, selectedOptions, qty]);

  const handleOptionChange = (variantName, label) => {
    setSelectedOptions(prev => ({
      ...prev,
      [variantName]: label
    }));
  };

  // ===== Cart helpers – same as OrderModal =====
  const buildCartItem = () => {
    if (!product) return null;

    const basePrice = Number(product.price || 0);
    
    // Convert selectedOptions object to a string list for cart display
    const variantLabels = Object.entries(selectedOptions)
      .map(([name, label]) => `${name}: ${label}`)
      .join(", ");

    return {
      productId: String(product._id || product.id),
      name: product.name,
      price: priceNumber,
      image: imageSrc,
      variant: variantLabels ? { name: "Options", value: variantLabels } : null,
      qty: qty && qty > 0 ? qty : 1,
      stock,
      category: product.category,
      basePrice,
      selectedOptions, // pass the raw object too
    };
  };

  const handleAddToCart = () => {
    const item = buildCartItem();
    if (!item) return;
    addToCart(item);
  };

  const handleBuyNow = () => {
    const item = buildCartItem();
    if (!item) return;
    addToCart(item);
    navigate("/checkout");
  };

  const handleDecrease = () => {
    setQty((prev) => {
      const next = (prev || 1) - 1;
      return next < 1 ? 1 : next;
    });
  };

  const handleIncrease = () => {
    setQty((prev) => {
      const current = prev || 1;
      const next = current + 1;
      if (!stock) return next;
      return next > stock ? stock : next;
    });
  };

  // ===== Reviews helpers =====
  // Chỉ tính average trên những review có rating > 0
  const ratingStats = useMemo(() => {
    const rated = reviews.filter(
      (r) =>
        typeof r.rating === "number" &&
        !Number.isNaN(r.rating) &&
        r.rating > 0
    );
    if (!rated.length) return { avg: 0, count: 0 };
    const sum = rated.reduce((s, r) => s + Number(r.rating || 0), 0);
    const avg = sum / rated.length;
    return { avg, count: rated.length };
  }, [reviews]);

  const renderStars = (value) => {
    const rounded = Math.round(value || 0);
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={i < rounded ? "pd-star filled" : "pd-star"}
          >
            ★
          </span>
        ))}
      </>
    );
  };

  // Submit review to API
  // - Không cần login để comment
  // - BEGIN: chỉ user login mới được rating sao
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const text = reviewComment.trim();
    const name = (user?.name || user?.fullName || customerName || "").trim();
    const email = (user?.email || customerEmail || "").trim();
    const canRate = !!user;

    if (!text) {
      alert("Please enter your review content.");
      return;
    }
    if (!name) {
      alert("Please enter your name.");
      return;
    }
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    if (canRate) {
      // chỉ bắt buộc rating nếu user đã login
      if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
        alert("Please choose a rating (1–5 stars).");
        return;
      }
    }

    const payload = {
      comment: text,
      customerName: name,
      customerEmail: email,
    };

    // chỉ gửi rating nếu user login
    if (canRate) {
      payload.rating = reviewRating;
    }

    console.log("🚀 [Observer Pattern] Attempting to submit review. Subject: Product ID", id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/${id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        console.error("❌ [Observer Pattern] Submit review failed at server:", txt);
        throw new Error(txt || "Failed to submit review");
      }

      const json = await res.json();
      const created = json.data || json.review || payload;

      console.log("✅ [Observer Pattern] Review broadcasted successfully!");
      console.log("📢 [Observer] Subject (Backend) will now notify all observers about this new review.");

      // Optimistic update: thêm vào list hiện tại
      setReviews((prev) => {
        const idKey = created._id || created.id;
        if (idKey && prev.some((r) => (r._id || r.id) === idKey)) {
          return prev.map((r) =>
            (r._id || r.id) === idKey ? created : r
          );
        }
        return [created, ...prev];
      });

      setReviewComment("");
      // reset rating về 5 cho lần sau
      if (canRate) {
        setReviewRating(5);
      }

      if (!user) {
        // lưu lại name/email trong form cho lần comment tiếp theo
        setCustomerName(name);
        setCustomerEmail(email);
      }
    } catch (err) {
      console.error("❌ [Observer Pattern] Fatal error during submission:", err.message);
      alert("Failed to submit your review. Please try again later.");
    }
  };

  // ===== Wishlist helpers =====
  const handleToggleWishlist = async () => {
    if (!user) {
      alert("You need to log in to use the wishlist.");
      return;
    }
    if (!product) return;

    const pid = product.id ?? product._id;
    if (!pid) return;

    try {
      setSavingWishlist(true);

      const current = Array.isArray(user.wishlist) ? [...user.wishlist] : [];

      const index = current.findIndex((entry) => {
        if (!entry) return false;
        const eid =
          typeof entry === "object"
            ? entry.productId ?? entry.id ?? entry._id
            : entry;
        return String(eid) === String(pid);
      });

      let next;
      if (index >= 0) {
        // already in wishlist → remove
        next = current.filter((_, i) => i !== index);
      } else {
        // not in wishlist yet → add
        next = [
          ...current,
          {
            productId: pid,
            dateAdded: new Date().toISOString(),
            isOnSale: !!product.isOnSale,
          },
        ];
      }

      const updated = await updateProfile({ wishlist: next });

      // backend may return { user }, { data }, or user directly
      const newUser = updated?.user || updated?.data || updated;
      if (newUser) {
        updateUser?.(newUser);
      }
    } catch (err) {
      console.error("Toggle wishlist error:", err);
      alert(
        err?.response?.data?.message ||
        err.message ||
        "Failed to update wishlist."
      );
    } finally {
      setSavingWishlist(false);
    }
  };

  // ===== Render =====
  if (loading) {
  return (
    <>
      <Navbar />
      <div className="product-detail-page">
        <div className="product-detail-container">
          <p>Loading product details...</p>
        </div>
      </div>
    </>
  );
}


  if (error || !product) {
  return (
    <>
      <Navbar />
      <div className="product-detail-page">
        <div className="product-detail-container">
          <p style={{ color: "red" }}>
            Failed to load product: {error || "Not found"}
          </p>
        </div>
      </div>
    </>
  );
}


  const pid = product.id ?? product._id;
  const liked =
    pid &&
    wishlist.some((entry) => {
      if (!entry) return false;
      const eid =
        typeof entry === "object"
          ? entry.productId ?? entry.id ?? entry._id
          : entry;
      return String(eid) === String(pid);
    });

  const canRate = isLoggedIn; // dùng cho UI ngôi sao

  return (
    <>
    <Navbar />
    <div className="product-detail-page">
      <div className="product-detail-container">
        ...
        {/* BREADCRUMB */}
        <div className="pd-breadcrumb">
          <span
            className="pd-breadcrumb-link"
            onClick={() => navigate(-1)}
          >
            &larr; Back
          </span>
          <span className="pd-breadcrumb-sep">/</span>
          <span>{product.category}</span>
        </div>

        {/* MAIN LAYOUT */}
        <div className="pd-main">
          {/* IMAGE */}
          <div className="pd-gallery">
            <div className="pd-image-wrapper">
              <img
                src={imageSrc}
                alt={product.name}
                className="pd-image"
              />
              {/* Heart button on image */}
              <button
                type="button"
                className={`pd-heart-btn ${liked ? "pd-heart-btn--active" : ""
                  }`}
                onClick={handleToggleWishlist}
                disabled={savingWishlist}
                title={
                  liked ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                {liked ? "♥" : "♡"}
              </button>
            </div>
            {!inStock && (
              <span className="pd-badge-out">Out of stock</span>
            )}
          </div>

          {/* INFO */}
          <div className="pd-info">
            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-rating-row">
              <div className="pd-rating-stars">
                {renderStars(ratingStats.avg)}
              </div>
              <span className="pd-rating-score">
                {ratingStats.count
                  ? `${ratingStats.avg.toFixed(1)}/5`
                  : "No ratings yet"}
              </span>
              {ratingStats.count > 0 && (
                <span className="pd-rating-count">
                  ({ratingStats.count} reviews)
                </span>
              )}
            </div>

            <div className="pd-price-row">
              <span className="pd-price">
                {formatPrice(priceNumber)}
              </span>
              {product.oldPrice && (
                <span className="pd-old-price">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>

            {description && (
              <p className="pd-short-desc">{description}</p>
            )}

            <div className="pd-meta">
              <span>SKU: {product.sku}</span>
              <span>
                Status:{" "}
                <strong>
                  {inStock ? "In stock" : "Temporarily out of stock"}
                </strong>
              </span>
              {product.categorySpecialInfo && (
                <span>
                  <strong>Đặc điểm loại:</strong> {product.categorySpecialInfo}
                </span>
              )}
            </div>

            <div className="pd-purchase-block">
              {/* DYNAMIC VARIANTS */}
              {product.variants?.map((v, vIdx) => (
                <div className="pd-field" key={vIdx}>
                  <div className="pd-field-label">
                    <span>{v.name}</span>
                  </div>
                  {v.options?.length ? (
                    <select
                      className="pd-select"
                      value={selectedOptions[v.name] || ""}
                      onChange={(e) => handleOptionChange(v.name, e.target.value)}
                    >
                      {v.options.map((op, i) => (
                        <option key={i} value={op.label}>
                          {op.label}
                          {op.priceDelta
                            ? ` (${op.priceDelta > 0 ? "+" : ""}${formatPrice(op.priceDelta)})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="pd-select disabled">Default</div>
                  )}
                </div>
              ))}

              {/* QTY */}
              <div className="pd-field">
                <div className="pd-field-label">
                  <span>Quantity</span>
                  {stock > 0 && (
                    <small>
                      Remaining: <strong>{stock}</strong> items
                    </small>
                  )}
                </div>
                <div className="pd-qty-control">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={qty <= 1}
                  >
                    -
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={!!stock && qty >= stock}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* TOTAL */}
              <div className="pd-field">
                <div className="pd-field-label">
                  <span>Subtotal</span>
                </div>
                <div className="pd-total">
                  {formatPrice(total)}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pd-actions">
                <button
                  className="pd-btn-primary"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                >
                  BUY NOW
                </button>
                <button
                  className="pd-btn-outline"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  ADD TO CART
                </button>

                {/* Inline heart button next to main buttons */}
                <button
                  type="button"
                  className={`pd-btn-heart-inline ${liked ? "pd-btn-heart-inline--active" : ""
                    }`}
                  onClick={handleToggleWishlist}
                  disabled={savingWishlist}
                  title={
                    liked ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  {liked ? "♥ Added to wishlist" : "♡ Add to wishlist"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EXTRA INFO + REVIEWS */}
        <div className="pd-extra">
          <section className="pd-section">
            <h2>Product information</h2>
            <p>
              {description ||
                "Carefully selected coffee beans, suitable for many different brewing methods."}
            </p>
            <ul className="pd-specs">
              <li>
                <span>Category</span>
                <strong>{product.category}</strong>
              </li>
              <li>
                <span>Product code</span>
                <strong>{product.sku}</strong>
              </li>
              <li>
                <span>In stock</span>
                <strong>{stock}</strong>
              </li>
            </ul>
          </section>

          <section className="pd-section pd-reviews">
            <h2>Product reviews</h2>

            {/* SUMMARY */}
            <div className="pd-review-summary">
              <div className="pd-review-score">
                <div className="pd-review-score-number">
                  {ratingStats.count
                    ? ratingStats.avg.toFixed(1)
                    : "--"}
                </div>
                <div className="pd-review-score-meta">
                  <div className="pd-review-score-stars">
                    {renderStars(ratingStats.avg)}
                  </div>
                  <span>
                    {ratingStats.count
                      ? `${ratingStats.count} reviews`
                      : "No reviews yet"}
                  </span>
                </div>
              </div>
            </div>

            {/* LIST */}
            <div className="pd-review-list">
              {reviewsLoading && <p>Loading reviews...</p>}
              {reviewsError && (
                <p style={{ color: "red" }}>{reviewsError}</p>
              )}

              {!reviewsLoading &&
                reviews.map((r) => (
                  <div key={r._id || r.id} className="pd-review-item">
                    <div className="pd-review-header">
                      <strong>{r.customerName || "Anonymous"}</strong>
                      {typeof r.rating === "number" &&
                        r.rating > 0 && (
                          <span className="pd-review-stars">
                            {renderStars(r.rating)}
                          </span>
                        )}
                    </div>
                    <p className="pd-review-comment">{r.comment}</p>
                    {r.customerEmail && (
                      <small className="pd-review-email">
                        {r.customerEmail}
                      </small>
                    )}
                    {r.createdAt && (
                      <small className="pd-review-time">
                        {new Date(r.createdAt).toLocaleString("en-US")}
                      </small>
                    )}
                  </div>
                ))}

              {!reviewsLoading &&
                !reviews.length &&
                !reviewsError && (
                  <p className="pd-review-empty">
                    Be the first to review this product.
                  </p>
                )}
            </div>

            {/* FORM */}
            <div className="pd-review-form">
              <h3>Write your review</h3>

              {isLoggedIn ? (
                <div className="pd-review-user-info">
                  <p>
                    Reviewing as:{" "}
                    <strong>
                      {user.name || user.fullName || user.email}
                    </strong>{" "}
                    ({user.email})
                  </p>
                  <p className="pd-review-hint">
                    You&apos;re logged in &mdash; your star rating will be
                    counted.
                  </p>
                </div>
              ) : (
                <>
                  <div className="pd-review-form-row">
                    <label>
                      Your name:
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) =>
                          setCustomerName(e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Email:
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) =>
                          setCustomerEmail(e.target.value)
                        }
                      />
                    </label>
                  </div>
                  <p className="pd-review-hint">
                    You can leave a comment without logging in.{" "}
                    <strong>
                      Log in if you want your star rating to be counted.
                    </strong>
                  </p>
                </>
              )}

              <form onSubmit={handleSubmitReview}>
                <div className="pd-review-form-row">
                  <div className="review-rating-row">
                    <span>Rating:</span>
                    <StarRatingInput
                      value={canRate ? reviewRating : 0}
                      onChange={
                        canRate
                          ? (val) => setReviewRating(val)
                          : undefined
                      }
                      disabled={!canRate}
                    />
                    <span className="review-rating-label">
                      {canRate
                        ? `${reviewRating} stars`
                        : "Login to rate with stars (optional for comment)."}
                    </span>
                  </div>
                </div>
                <div className="pd-review-form-row">
                  <label>
                    Review:
                    <textarea
                      placeholder="How was this product for you?"
                      value={reviewComment}
                      onChange={(e) =>
                        setReviewComment(e.target.value)
                      }
                      rows={3}
                    />
                  </label>
                </div>
                <button type="submit" className="pd-btn-secondary">
                  Submit review
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
     </>
  );
};

export default ProductDetail;
