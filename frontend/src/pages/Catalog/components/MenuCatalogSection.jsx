import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderModal from "./OrderModal";
import "../../Menu/styles/menu-modal.css";
import { useAuth } from "../../../contexts/AuthContext";
import { updateProfile } from "../../../services/account";
import { useCart } from "../../../contexts/CartContext";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

// 4 fixed brands (used only for name search)
const BRAND_OPTIONS = [
  "Trung Nguyên",
  "Highlands",
  "The Coffee House",
  "Phúc Long",
];

// Shared with OrderModal: prefer image from backend
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

// Local FE sort helper based on sortBy
function getSoldScore(p = {}) {
  const base =
    p.sold ??
    p.soldCount ??
    p.totalSold ??
    p.sales ??
    p.orderCount ??
    p.orders ??
    0;

  let score = Number(base);
  if (!Number.isFinite(score) || score < 0) score = 0;

  const rating = Number(p.rating ?? p.avgRating ?? 0);
  const reviews = Number(p.reviewCount ?? p.reviewsCount ?? 0);

  if (Number.isFinite(rating) && rating > 0) {
    score += rating * 2;
  }
  if (Number.isFinite(reviews) && reviews > 0) {
    score += Math.min(reviews, 50);
  }

  return score;
}

function getCreatedAtTime(p = {}) {
  return new Date(p.createdAt || p.updatedAt || 0).getTime() || 0;
}

function sortProducts(list, sortBy) {
  const sorted = [...list];

  const getSold = (p) => {
    return Number(p.soldCount || getSoldScore(p) || 0);
  };

  const getName = (p) => (p.name || "").trim().toLowerCase();

  switch (sortBy) {
    case "priceAsc":
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case "priceDesc":
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case "new":
      sorted.sort((a, b) => getCreatedAtTime(b) - getCreatedAtTime(a));
      break;
    case "best":
      sorted.sort((a, b) => getSold(b) - getSold(a));
      break;
    case "nameAsc": // A → Z
      sorted.sort((a, b) => getName(a).localeCompare(getName(b)));
      break;
    case "nameDesc": // Z → A
      sorted.sort((a, b) => getName(b).localeCompare(getName(a)));
      break;
    default:
      break;
  }

  return sorted;
}


function isProductInStock(p) {
  if (!p) return true;

  // Backend may have explicit boolean inStock
  if (typeof p.inStock === "boolean") return p.inStock;

  // Or a status string
  if (typeof p.status === "string") {
    const s = p.status.toLowerCase();
    if (["out-of-stock", "sold-out", "unavailable"].includes(s)) return false;
    if (["in-stock", "available"].includes(s)) return true;
  }

  // Common numeric stock fields
  const candidates = [
    p.stock,
    p.countInStock,
    p.quantity,
    p.qty,
    p.inventory,
    p.unitsInStock,
  ];

  for (const v of candidates) {
    if (v == null) continue;
    const num = Number(v);
    if (Number.isFinite(num)) return num > 0;
  }

  // If no info, assume in stock
  return true;
}

// ==== Cart helpers (giống ProductDetail, rút gọn) ====
function getSizeVar(p) {
  return p?.variants?.length ? p.variants[0] : null;
}

function getPriceWithSize(p, optIdx = 0) {
  const base = Number(p?.price || 0);
  const sizeVar = getSizeVar(p);
  const delta = Number(sizeVar?.options?.[optIdx]?.priceDelta || 0);
  return base + delta;
}

function buildQuickCartItem(product, qty = 1) {
  if (!product) return null;

  const sizeVar = getSizeVar(product);

  // chọn size đầu tiên nếu có
  let optIdx = 0;
  let currentLabel = "";
  if (sizeVar?.options?.length) {
    currentLabel = sizeVar.options[0].label;
  }

  const priceNumber = getPriceWithSize(product, optIdx);
  const basePrice = Number(product.price || 0);
  const imageSrc = resolveImage(product);

  const rawStock =
    Number(product?.quantity) ??
    Number(product?.stock) ??
    Number(product?.countInStock) ??
    0;
  const stock = Number.isFinite(rawStock) && rawStock > 0 ? rawStock : 0;

  const safeQty = qty && qty > 0 ? qty : 1;

  const variant =
    sizeVar && currentLabel
      ? { name: sizeVar.name, value: currentLabel }
      : null;

  const variantOptions = sizeVar?.options?.map((op) => ({
    label: op.label,
    priceDelta: Number(op.priceDelta || 0),
  }));

  return {
    productId: String(product._id || product.id),
    name: product.name,
    price: priceNumber,
    image: imageSrc,
    variant,
    qty: safeQty,
    stock,
    category: product.category,
    basePrice,
    variantOptions,
    variantIndex: optIdx,
  };
}

export default function MenuCatalogSection({
  breadcrumbLabel = "Home / Coffee Menu",
  // category is used to filter by type / collection in DB
  category,
}) {
  const [products, setProducts] = useState([]);
  const { user, updateUser } = useAuth();
  const { addToCart } = useCart();


  const [savingWishlistId, setSavingWishlistId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6; // bao nhiêu sp / trang

  // always treat wishlist as array
  const wishlist = Array.isArray(user?.wishlist) ? user.wishlist : [];

  const isInWishlist = (productId) =>
    wishlist.some((entry) => {
      if (!entry) return false;
      const pid =
        typeof entry === "object"
          ? entry.productId ?? entry.id ?? entry._id
          : entry;

      return String(pid) === String(productId);
    });

  const [rawProducts, setRawProducts] = useState([]); // raw data from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- Modal + selected product ----
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tempQty, setTempQty] = useState(1);
  const [tempSize, setTempSize] = useState("M");

  // Toast: "added to cart"
  const [toastItem, setToastItem] = useState(null);

  // ---- Filter + sort state ----
  const [availability, setAvailability] = useState("all"); // all | in | out
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]); // 4 FE brands
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sortBy, setSortBy] = useState("best"); // best | priceAsc | priceDesc | new


  const navigate = useNavigate();

  // --- Fetch products from backend (only use filter: category, availability, type, size) ---
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (category) params.set("category", category);

        // availability -> inStock query
        if (availability === "in") params.set("inStock", "true");
        if (availability === "out") params.set("inStock", "false");

        // type/size multi-select
        if (selectedTypes.length) {
          params.set("types", selectedTypes.join(","));
        }
        // DO NOT send brands because DB does not have brand column
        if (selectedSizes.length) {
          params.set("sizes", selectedSizes.join(","));
        }

        const url = `${API_BASE_URL}/api/products${params.toString() ? `?${params.toString()}` : ""
          }`;

        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to fetch products");
        }

        const json = await res.json();
        const list = json.data || json.items || json.products || [];
        setRawProducts(list); // keep raw data
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load products");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, [category, availability, selectedTypes, selectedSizes]);

  // --- auto hide toast ---
  useEffect(() => {
    if (!toastItem) return;
    const t = setTimeout(() => setToastItem(null), 3000);
    return () => clearTimeout(t);
  }, [toastItem]);

  // --- reset page khi filter / sort đổi ---
  useEffect(() => {
    setCurrentPage(1);
  }, [
    sortBy,
    minPrice,
    maxPrice,
    availability,
    selectedBrands,
    selectedTypes,
    selectedSizes,
    rawProducts.length,
  ]);

  // --- Filter by price + brand + local sort ---
  useEffect(() => {
    if (!rawProducts || rawProducts.length === 0) {
      setProducts([]);
      return;
    }

    // Parse min / max
    let min = minPrice === "" || minPrice === null ? null : Number(minPrice);
    let max = maxPrice === "" || maxPrice === null ? null : Number(maxPrice);

    if (Number.isNaN(min)) min = null;
    if (Number.isNaN(max)) max = null;

    // Swap if user enters min > max
    if (min != null && max != null && min > max) {
      const tmp = min;
      min = max;
      max = tmp;
    }

    let list = rawProducts.filter((p) => {
      const price = Number(p.price || 0);
      const name = (p.name || "").toLowerCase();

      // ====== FILTER BY AVAILABILITY ======
      const inStockFlag = isProductInStock(p);
      if (availability === "in" && !inStockFlag) return false;
      if (availability === "out" && inStockFlag) return false;

      // price filter
      if (min != null && price < min) return false;
      if (max != null && price > max) return false;

      // brand filter = search brand keywords in product name
      if (selectedBrands.length > 0) {
        const matchBrand = selectedBrands.some((b) =>
          name.includes(b.toLowerCase())
        );
        if (!matchBrand) return false;
      }

      return true;
    });

    const sorted = sortProducts(list, sortBy);
    setProducts(sorted);
  }, [rawProducts, sortBy, minPrice, maxPrice, selectedBrands, availability]);

  // ---- Open modal handler ----
  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setTempQty(1);
    setTempSize(""); // let OrderModal choose default size
    setShowModal(true);
  };

  const handleQuickAddToCart = (product) => {
    const item = buildQuickCartItem(product, 1);
    if (!item) return;

    if (item.stock !== undefined && item.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    addToCart(item);
    setToastItem(item);
  };

  const handleQuickBuyNow = (product) => {
    const item = buildQuickCartItem(product, 1);
    if (!item) return;

    if (item.stock !== undefined && item.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    addToCart(item);
    navigate("/checkout");
  };

  // Called when OrderModal reports item added to cart
  const handleItemAdded = (item) => {
    setShowModal(false);
    if (item) {
      setToastItem(item);
    }
  };

  // ---- Reset all filters ----
  const handleResetFilters = () => {
    setAvailability("all");
    setMinPrice("");
    setMaxPrice("");
    setSelectedTypes([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSortBy("best");
    setCurrentPage(1);
  };

  // Helper to toggle values in checkbox lists
  const toggleInArray = (value, list, setter) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  // Derive product types from filtered products (after price + brand filters)
  const productTypes = Array.from(
    new Set(products.map((p) => p.type).filter(Boolean))
  );

  // Highest price from rawProducts (before price filter)
  const highestPrice =
    rawProducts.length > 0
      ? Math.max(...rawProducts.map((p) => p.price || 0))
      : 0;

  // Count products per brand option (after current filters)
  const brandCounts = BRAND_OPTIONS.reduce((acc, b) => {
    const count = products.filter((p) =>
      (p.name || "").toLowerCase().includes(b.toLowerCase())
    ).length;
    acc[b] = count;
    return acc;
  }, {});

  // Navigate to product detail page
  const goToProductDetail = (prodOrItem) => {
    if (!prodOrItem) return;
    const id =
      prodOrItem._id || prodOrItem.id || prodOrItem.productId || prodOrItem.slug;
    if (!id) return;
    navigate(`/products/${id}`);
  };

  const handleToggleWishlist = async (product) => {
    if (!user) {
      alert("You need to log in to use the wishlist.");
      return;
    }

    const pid = product.id ?? product._id;
    if (!pid) return;

    try {
      setSavingWishlistId(pid);

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
        // already in wishlist → remove it
        next = current.filter((_, i) => i !== index);
      } else {
        // not yet in wishlist → add it
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

      const newUser = updated?.data ?? updated;
      if (newUser) {
        updateUser?.(newUser);
      }
    } catch (err) {
      alert(
        err?.response?.data?.message ||
        err.message ||
        "Failed to update wishlist."
      );
    } finally {
      setSavingWishlistId(null);
    }
  };

  // ===== Pagination derived values =====
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = products.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="catalog-wrapper">
      {/* Left filter sidebar */}
      <div className="filter-sidebar">
        <div className="filter-topbar">
          <h3>Filters</h3>
          <button
            className="filter-reset"
            title="Reset all"
            aria-label="Reset all filters"
            onClick={handleResetFilters}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 12a9 9 0 1 1-3.04-6.72"
                stroke="#ddd"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 3v6h-6"
                stroke="#ddd"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* AVAILABILITY Filter */}
        <div className="filter-section">
          <div className="filter-header">
            <h4>AVAILABILITY</h4>
            <span>
              {availability === "all"
                ? "0 selected"
                : availability === "in"
                  ? "1 selected (In stock)"
                  : "1 selected (Out of stock)"}
            </span>
          </div>
          <div className="filter-options">
            <label>
              <input
                type="checkbox"
                checked={availability === "in"}
                onChange={() =>
                  setAvailability((prev) => (prev === "in" ? "all" : "in"))
                }
              />
              In stock
            </label>
            <label>
              <input
                type="checkbox"
                checked={availability === "out"}
                onChange={() =>
                  setAvailability((prev) => (prev === "out" ? "all" : "out"))
                }
              />
              Out of stock
            </label>
          </div>
        </div>

        {/* PRICE Filter */}
        <div className="filter-section">
          <div className="filter-header">
            <h4>PRICE</h4>
          </div>
          <p className="price-info">
            {rawProducts.length
              ? `The highest price is ${highestPrice.toLocaleString()}₫`
              : "Enter a price range to filter"}
          </p>
          <div className="price-inputs">
            <div>
              <label>Min price:</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <label>Max price:</label>
              <input
                type="number"
                placeholder="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* BRAND Filter – fixed 4 options, search by name */}
        <div className="filter-section">
          <div className="filter-header">
            <h4>BRAND</h4>
            <span>{BRAND_OPTIONS.length} brands</span>
          </div>
          <div className="filter-options">
            {BRAND_OPTIONS.map((b) => (
              <label key={b}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b)}
                  onChange={() =>
                    toggleInArray(b, selectedBrands, setSelectedBrands)
                  }
                />
                {b} ({brandCounts[b] || 0})
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content">
        {/* Breadcrumb + Sort */}
        <div className="catalog-header">
          <div className="breadcrumb">
            <span>{breadcrumbLabel}</span>
          </div>
          <div className="sort-section">
            <span>Sort by:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="best">Best selling</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="new">Newest</option>
              <option value="nameAsc">Name: A - Z</option>
              <option value="nameDesc">Name: Z - A</option>
            </select>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && <p>Loading products...</p>}
        {error && !loading && (
          <p style={{ color: "red" }}>Failed to load products: {error}</p>
        )}

        {/* Product Grid + Pagination */}
        {!loading && !error && (
          <>
            <div className="product-grid">
              {pageItems.map((p) => {
                const pid = p.id ?? p._id;
                const liked = pid ? isInWishlist(pid) : false;
                const inStock = isProductInStock(p);

                return (
                  <div key={pid || p._id || p.id} className="product-card">
                    <div className="product-image">
                      <img
                        src={resolveImage(p)}
                        alt={p.name}
                        onClick={() => goToProductDetail(p)}
                        style={{ cursor: "pointer" }}
                      />
                      <div className="product-badges">
                        <span className="discount-badge">-20%</span>
                        <span className="new-badge">New</span>
                      </div>
                      <div className="product-actions">
                        <button
                          type="button"
                          className={`action-btn action-btn--wishlist ${liked ? "action-btn--favorite" : ""
                            }`}
                          data-tooltip={
                            liked ? "Remove from wishlist" : "Add to wishlist"
                          }
                          disabled={savingWishlistId === pid}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(p);
                          }}
                        >
                          {liked ? "♥" : "♡"}
                        </button>

                        <button
                          className="action-btn"
                          onClick={() => handleOpenModal(p)}
                        >
                          👁
                        </button>
                      </div>
                    </div>

                    <div className="product-info">
                      <h3
                        className="product-title"
                        onClick={() => goToProductDetail(p)}
                        style={{ cursor: "pointer" }}
                      >
                        {p.name}
                      </h3>
                      <p className="product-desc">
                        {p.description || p.desc || ""}
                      </p>
                      {p.categorySpecialInfo && (
                        <p className="product-attribute" style={{
                          fontSize: "0.78rem",
                          color: "#a0855b",
                          margin: "4px 0 0",
                          fontStyle: "italic"
                        }}>
                          <strong>{p.categorySpecialInfo}</strong>
                        </p>
                      )}

                      <div className="product-price">
                        <span className="current-price">
                          {formatPrice(p.price)}
                        </span>
                        {p.oldPrice && (
                          <span className="old-price">
                            {formatPrice(p.oldPrice)}
                          </span>
                        )}
                      </div>

                      <div className="product-cta">
                        <button
                          className="buy-now"
                          disabled={!inStock}
                          onClick={() => inStock && handleQuickBuyNow(p)}
                        >
                          BUY NOW
                        </button>
                        <button
                          className="add-to-cart"
                          disabled={!inStock}
                          onClick={() => inStock && handleQuickAddToCart(p)}
                        >
                          ADD TO CART
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {products.length === 0 && (
                <p>
                  No products match the current filters.{" "}
                  <button
                    type="button"
                    style={{
                      textDecoration: "underline",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                    }}
                    onClick={handleResetFilters}
                  >
                    Clear filters
                  </button>
                </p>
              )}
            </div>

            {/* Pagination – luôn hiển thị, kể cả khi chỉ có 1 page */}
            <div className="catalog-pagination">
              <button
                type="button"
                className="page-nav"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((p) => (p > 1 ? p - 1 : p))
                }
              >
                Prev
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={
                      pageNum === currentPage
                        ? "page-btn page-btn--active"
                        : "page-btn"
                    }
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="page-nav"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) =>
                    p < totalPages ? p + 1 : p
                  )
                }
              >
                Next
              </button>
            </div>
          </>
        )}

        {showModal && (
          <OrderModal
            selectedProduct={selectedProduct}
            tempQty={tempQty}
            setTempQty={setTempQty}
            tempSize={tempSize}
            setTempSize={setTempSize}
            onAdd={handleItemAdded}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>

      {/* "Added to cart" toast */}
      {toastItem && (
        <div className="catalog-toast">
          <div className="catalog-toast-inner">
            <div className="catalog-toast-main">
              <span>
                Added{" "}
                <strong>{toastItem.name || "product"}</strong> to your cart.
              </span>
            </div>
            <div className="catalog-toast-actions">
              <button
                type="button"
                className="toast-link"
                onClick={() => {
                  setToastItem(null);   // ẩn toast
                  navigate("/cart");    // 👉 chuyển sang trang giỏ hàng
                }}
              >
                View cart
              </button>
              <button
                type="button"
                className="toast-close"
                onClick={() => setToastItem(null)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
