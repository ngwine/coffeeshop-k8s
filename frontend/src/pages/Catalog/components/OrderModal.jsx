import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../contexts/CartContext";

function resolveImage(product) {
  if (!product) return "/images/coffee-sample.png";

  return (
    product.image ||
    product.imageUrl ||
    (Array.isArray(product.images) && product.images[0]) ||
    product.img ||
    "/images/coffee-sample.png"
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

function getSizeVar(p) {
  return p?.variants?.length ? p.variants[0] : null;
}

function getPriceWithSize(p, optIdx = 0) {
  const base = Number(p?.price || 0);
  const sizeVar = getSizeVar(p);
  const delta = Number(sizeVar?.options?.[optIdx]?.priceDelta || 0);
  return base + delta;
}

const OrderModal = ({
  selectedProduct,
  tempQty,
  setTempQty,
  tempSize,
  setTempSize,
  onAdd,   // used to close modal / trigger side-effects
  onClose, // close modal when clicking overlay
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Setup default size + quantity from DB
  useEffect(() => {
    if (!selectedProduct) return;

    const sizeVar = getSizeVar(selectedProduct);
    if (!sizeVar?.options?.length) {
      if (!tempQty || tempQty < 1) setTempQty(1);
      return;
    }

    const labels = sizeVar.options.map((op) => op.label);

    if (!tempSize || !labels.includes(tempSize)) {
      setTempSize(sizeVar.options[0].label);
    }

    if (!tempQty || tempQty < 1) {
      setTempQty(1);
    }
  }, [selectedProduct, tempSize, tempQty, setTempSize, setTempQty]);

  if (!selectedProduct) return null;

  const sizeVar = getSizeVar(selectedProduct);
  const imageSrc = resolveImage(selectedProduct);
  const description =
    selectedProduct.description || selectedProduct.desc || "";

  // Helper: get available stock from product
  function getAvailableStock(p) {
    if (!p) return 0;

    // 1) Prefer numeric quantity field
    if (typeof p.quantity === "number") {
      return Math.max(p.quantity, 0); // 0 stays 0, no fallback
    }

    // 2) Some schemas may use "inventory"
    if (typeof p.inventory === "number") {
      return Math.max(p.inventory, 0);
    }

    // 3) If there's a boolean "stock" field
    if (typeof p.stock === "boolean") {
      return p.stock ? 99 : 0; // true without exact number → treat as many in stock
    }

    // 4) Inactive status → consider out of stock
    if (p.status && String(p.status).toLowerCase() === "inactive") {
      return 0;
    }

    // 5) No stock info → temporarily treat as many in stock
    return 99;
  }

  const stock = getAvailableStock(selectedProduct);
  const isOutOfStock = stock <= 0;

  // Quantity displayed on UI (if out of stock keep it 1, but disable buttons)
  const safeQty = (() => {
    if (isOutOfStock) return 1;
    const base = tempQty && tempQty > 0 ? tempQty : 1;
    return base > stock ? stock : base;
  })();

  // Determine current option by label
  let currentLabel = tempSize;
  if (sizeVar?.options?.length && !currentLabel) {
    currentLabel = sizeVar.options[0].label;
  }

  let optIdx = 0;
  if (sizeVar?.options?.length && currentLabel) {
    const idx = sizeVar.options.findIndex(
      (op) => op.label === currentLabel
    );
    optIdx = idx >= 0 ? idx : 0;
  }

  const priceNumber = getPriceWithSize(selectedProduct, optIdx);
  const total = priceNumber * safeQty;

  const handleDecrease = () => {
    if (isOutOfStock) return;
    setTempQty((prev) => {
      const next = (prev || 1) - 1;
      return next < 1 ? 1 : next;
    });
  };

  const handleIncrease = () => {
    if (isOutOfStock) return;
    setTempQty((prev) => {
      const current = prev || 1;
      const next = current + 1;
      return next > stock ? stock : next;
    });
  };

  const handleSizeChange = (e) => {
    setTempSize(e.target.value);
  };

  // Build cart item object similar to ProductCarousel for addToCart
  const buildCartItem = () => {
    const id = String(selectedProduct._id || selectedProduct.id);
    const variant = sizeVar
      ? { name: sizeVar.name, value: currentLabel }
      : null;

    const basePrice = Number(selectedProduct.price || 0);
    const variantOptions = sizeVar?.options?.map((op) => ({
      label: op.label,
      priceDelta: Number(op.priceDelta || 0),
    }));

    return {
      productId: id,
      name: selectedProduct.name,
      price: priceNumber,
      image: imageSrc,
      variant,
      qty: safeQty,
      stock,
      category: selectedProduct.category,
      basePrice,
      variantOptions,
      variantIndex: optIdx,
    };
  };

  const handleAddToCartClick = () => {
    const item = buildCartItem();
    addToCart(item);
    if (onAdd) onAdd(item); // usually used to close modal
  };

  const handleBuyNowClick = () => {
    const item = buildCartItem();

    // If BUY NOW should not affect the cart:
    if (onAdd) onAdd(item); // still close modal if you use onAdd for that

    // Pass exactly 1 item to checkout page
    navigate("/checkout", {
      state: {
        items: [item],
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-left">
          <img src={imageSrc} alt={selectedProduct.name} />
        </div>

        <div className="modal-right">
          <h2>{selectedProduct.name}</h2>

          <div className="option-block">
            <h4>Price:</h4>
            <div className="price-row">
              <span className="price">{formatPrice(priceNumber)}</span>
              {selectedProduct.oldPrice && (
                <span className="old-price">
                  {formatPrice(selectedProduct.oldPrice)}
                </span>
              )}
            </div>
          </div>

          {description && (
            <div className="option-block">
              <p className="modal-desc">{description}</p>
            </div>
          )}

          {sizeVar?.options?.length ? (
            <div className="option-block">
              <h4>Size / Option:</h4>
              <select
                className="variant-select"
                value={currentLabel}
                onChange={handleSizeChange}
              >
                {sizeVar.options.map((op, i) => (
                  <option key={i} value={op.label}>
                    {op.label}
                    {op.priceDelta
                      ? ` (${op.priceDelta > 0 ? "+" : ""}${formatPrice(
                          op.priceDelta
                        )})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="option-block">
              <h4>Size:</h4>
              <select className="variant-select" disabled>
                <option>Default</option>
              </select>
            </div>
          )}

          <div className="option-block">
            <h4>Quantity:</h4>
            <div className="qty-actions">
              <button onClick={handleDecrease} disabled={safeQty <= 1}>
                -
              </button>
              <span>{safeQty}</span>
              <button
                onClick={handleIncrease}
                disabled={safeQty >= stock}
              >
                +
              </button>
            </div>
            <div
              className={`stock-info ${
                isOutOfStock ? "stock-info-out" : ""
              }`}
            >
              {Number.isFinite(stock) && (
                <small>
                  {stock > 0
                    ? `Remaining: ${stock} item(s)`
                    : "OUT OF STOCK"}
                </small>
              )}
            </div>
          </div>

          <div className="option-block">
            <h4>Total:</h4>
            <strong>{formatPrice(total)}</strong>
          </div>

          <div className="option-block">
            <h4>Note:</h4>
            <textarea placeholder="Example: nicely packed, deliver during business hours..." />
          </div>

          <div className="modal-actions">
            <button
              className={`btn-buy ${isOutOfStock ? "btn-disabled" : ""}`}
              onClick={handleBuyNowClick}
              disabled={isOutOfStock}
            >
              BUY NOW
            </button>
            <button
              className={`btn-add ${isOutOfStock ? "btn-disabled" : ""}`}
              onClick={handleAddToCartClick}
              disabled={isOutOfStock}
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
