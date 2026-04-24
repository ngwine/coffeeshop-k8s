import React from "react";
import "./styles/menu.css";
import MenuCatalogSection from "../Catalog/components/MenuCatalogSection";

export default function CoffeeSets() {
  return (
    <main className="order-container">
      <section
        className="takeaway-hero"
        style={{
          backgroundImage: "url('/images/takeaway-hero.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <div className="hero-content">
            <h1>Coffee Sets</h1>
            <p>Bundles curated for gifting and home brewing</p>
          </div>
        </div>
      </section>

      <MenuCatalogSection
        breadcrumbLabel="Home / Menu / Coffee Sets"
        category="Coffee sets"
      />
    </main>
  );
}
