import React, { useEffect, useState } from "react";
import "./coffee-origin.css";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n || 0);
}


const CoffeeOrigin = () => {
  const [selectedOrigin, setSelectedOrigin] = useState('Trung Nguyen');

  const origins = ['Trung Nguyen', 'Highlands', 'Phuc Long', 'The Coffee House'];
  const [showHowTo, setShowHowTo] = useState(false);
  const handleShopNow = () => {
    // tuỳ m, /products hoặc /shop, /menu...
    window.location.href = "/menu/roast-coffee";
  };

  const handleHowToUse = () => {
  setShowHowTo((prev) => !prev);
};


  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadVouchers() {
      try {
        setVoucherLoading(true);
        setVoucherError("");

        const res = await fetch(
          `${API_BASE_URL}/api/discount-codes/public`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load vouchers");
        }

        const data = await res.json();
        const list = data.data || data.items || data;

        if (!cancelled) {
          setVouchers(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Load vouchers error:", err);
        if (!cancelled) {
          setVoucherError(
            err.message || "Unable to load discount vouchers."
          );
        }
      } finally {
        if (!cancelled) {
          setVoucherLoading(false);
        }
      }
    }

    loadVouchers();

    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <section
      className="coffee-origin"
      style={{
        backgroundImage: `url('/images/origin-bg.png')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
      }}
    >
      <div className="container">
        <div className="origin-layout">
          {/* Left Column - Brand Story & Heritage */}
          <article className="promo-column">
            <header>
              <h2>Vietnamese Coffee Heritage</h2>
              <p className="subtitle">Tradition and passion in every coffee bean</p>
            </header>
            <div className="content-body">
              <p>
                Since 1857, coffee has become an integral part of Vietnamese culture. We proudly
                inherit the <strong>160-year tradition</strong> of Vietnamese coffee industry,
                bringing you coffee beans carefully selected from the most fertile regions.
              </p>
              <p>
                Each coffee bean is <strong>hand-roasted</strong> using traditional methods,
                combined with modern technology to create unique flavors, rich in Vietnamese
                identity.
              </p>
              <ul className="heritage-list">
                <li>✓ 160 years of experience</li>
                <li>✓ Traditional roasting methods</li>
                <li>✓ Preserving Vietnamese coffee culture</li>
                <li>✓ International quality certification</li>
              </ul>
            </div>
            <footer>
              <a href="/about" className="show-products" aria-label="Learn more about coffee history">
                Discover Our History
              </a>
            </footer>
          </article>

          {/* Middle Column - Interactive Brand Selection */}
          <section className="origin-column">
            <header>
              <h3>Discover Vietnamese Coffee Brands</h3>
              <p className="origin-description">
                From heritage roasters to modern specialty chains, each brand brings its own
                signature roasting style and flavor profile.
              </p>
            </header>
            <nav className="origin-navigation" aria-label="Select coffee brand">
              <p className="origin-prompt">Choose your coffee brand:</p>
              <div className="origin-list" role="tablist">
                {origins.map((origin) => (
                  <button
                    key={origin}
                    className={`origin-item ${selectedOrigin === origin ? 'selected' : ''}`}
                    onClick={() => setSelectedOrigin(origin)}
                    role="tab"
                    aria-selected={selectedOrigin === origin}
                    aria-label={`Coffee from ${origin} brand`}
                    type="button"
                  >
                    {origin}
                  </button>
                ))}
              </div>
            </nav>
            <div className="origin-info" aria-live="polite">
              <div className="origin-details">
                <h4 className="origin-title">
                  {selectedOrigin === 'Trung Nguyen' && 'Trung Nguyen Legend'}
                  {selectedOrigin === 'Highlands' && 'Highlands Coffee'}
                  {selectedOrigin === 'Phuc Long' && 'Phuc Long Coffee & Tea'}
                  {selectedOrigin === 'The Coffee House' && 'The Coffee House'}
                </h4>
                <p className="selected-origin-description">
                  {selectedOrigin === 'Trung Nguyen' &&
                    'The pioneering Vietnamese coffee brand with bold, multi-layered blends that represent the spirit of Vietnamese coffee around the world.'}
                  {selectedOrigin === 'Highlands' &&
                    'Urban coffee chain inspired by the Central Highlands, offering balanced flavors and familiar drinks for everyday enjoyment.'}
                  {selectedOrigin === 'Phuc Long' &&
                    'Famous for strong coffee and fragrant tea, delivering a rich, memorable cup that reflects Saigon’s vibrant lifestyle.'}
                  {selectedOrigin === 'The Coffee House' &&
                    'Modern coffee space focusing on smooth, easy-to-drink flavors and a cozy atmosphere for working, meeting and relaxing.'}
                </p>
                <div className="origin-stats">
                  <span className="stat-item">🌡️ Temperature: 18-25°C</span>
                  <span className="stat-item">🌱 Altitude: 800-1500m</span>
                  <span className="stat-item">☕ Types: Arabica & Robusta</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column - Available Vouchers */}
          <div className="cta-column">
            <h3>Available Vouchers</h3>
            <p>
              Use these discount codes at checkout to save on your favorite
              coffee.
            </p>

            {voucherError && (
              <p className="voucher-error">{voucherError}</p>
            )}

            {voucherLoading ? (
              <p className="voucher-loading">Loading vouchers...</p>
            ) : vouchers.length === 0 ? (
              <p className="voucher-empty">
                There are no active vouchers at the moment.
              </p>
            ) : (
              <div className="voucher-list">
                {vouchers.map((v) => {
                  const remaining = Math.max(0, (v.maxUses || 0) - (v.usedCount || 0));
                  const isAmount = v.type === "amount";

                  return (
                    <div
                      key={v._id || v.code}
                      className="service-item voucher-item"
                    >
                      <span className="service-icon">🎟️</span>
                      <div className="service-content">
                        <h4>
                          Code: <span className="voucher-code">{v.code}</span>
                        </h4>

                        {/* THAY dòng này */}
                        <p className="voucher-discount">
                          {isAmount
                            ? `Discount: -${formatVND(v.discountAmount || 0)}`
                            : `Discount: ${v.discountPercent || 0}% off`}
                        </p>

                        <p className="voucher-usage">
                          Remaining uses: {remaining} / {v.maxUses || 0}
                        </p>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}

            <div className="cta-actions">
  <button
    type="button"
    className="cta-button primary"
    onClick={handleShopNow}
  >
    Shop now & apply voucher
  </button>
  <button
    type="button"
    className="cta-button secondary"
    onClick={handleHowToUse}
  >
    {showHowTo ? "Hide instructions" : "How to use discount codes"}
  </button>
</div>

{showHowTo && (
  <div className="howto-panel">
    <h5>How to use discount codes</h5>
    <ol>
      <li>Add products to your cart and go to Checkout.</li>
      <li>
        Enter one of the codes above into the <strong>"Discount code"</strong>{" "}
        field.
      </li>
      <li>Click Apply to see the discount before paying.</li>
    </ol>
  </div>
)}


          </div>
        </div>
      </div>
    </section>
  );
};

export default CoffeeOrigin;
