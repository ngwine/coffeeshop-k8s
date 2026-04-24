import React from "react";
import "./styles/menu.css";
import MenuCatalogSection from "../Catalog/components/MenuCatalogSection";

export default function RoastCoffee() {
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
            <h1>Roast Coffee</h1>
            <p>Signature roasted beans for every brewing style</p>
          </div>
        </div>
      </section>

      <MenuCatalogSection
        breadcrumbLabel="Home / Menu / Roast Coffee"
        category="Roasted coffee"
      />
    </main>
  );
}