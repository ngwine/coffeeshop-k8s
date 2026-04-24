import React from "react";
import { useSearchParams } from "react-router-dom";
import "../ProductCarousel/product-navbar.css";

const DEFAULT_CATEGORIES = [
  { id: "new", name: "New products" },
  { id: "best", name: "Best sellers" },
  { id: "Roasted coffee", name: "Roasted coffee" },
  { id: "Coffee sets", name: "Coffee sets" },
  { id: "Cups & Mugs", name: "Cups & Mugs" },
  { id: "Coffee makers and grinders", name: "Coffee makers & grinders" },
  
];

export default function ProductNavBar({
  activeCategory = "new",
  onCategoryChange,
  categories = DEFAULT_CATEGORIES,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleClick = (id) => {
    if (onCategoryChange) onCategoryChange(id);

    const next = new URLSearchParams(searchParams);
    if (id && id !== "all") {
      next.set("category", id);
    } else {
      next.delete("category");
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <nav className="product-navbar" aria-label="Product categories">
      <div className="product-navbar-container">
        <ul className="product-navbar-list" role="tablist">
          {categories.map((c) => {
            const isActive = activeCategory === c.id;
            const isDisabled = !!c.disabled;
            return (
              <li
                key={c.id}
                className="product-navbar-item"
                role="presentation"
              >
                <button
                  role="tab"
                  aria-selected={isActive}
                  aria-disabled={isDisabled}
                  className={`product-navbar-link ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() => !isDisabled && handleClick(c.id)}
                  disabled={isDisabled}
                >
                  <span>{c.name}</span>
                  {typeof c.count === "number" && (
                    <span className="badge">{c.count}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
