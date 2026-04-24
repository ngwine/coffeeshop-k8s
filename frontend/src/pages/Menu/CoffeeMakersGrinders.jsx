// src/pages/Menu/CoffeeMakersGrinders.jsx
import React from "react";
import "./styles/menu.css";
import MenuCatalogSection from "../Catalog/components/MenuCatalogSection";

export default function CoffeeMakersGrinders() {
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
            <h1>Coffee Makers & Grinders</h1>
            <p>Tools and gears for perfect home brewing</p>
          </div>
        </div>
      </section>

      <MenuCatalogSection
        breadcrumbLabel="Home / Menu / Coffee Makers & Grinders"
        category="Coffee makers and grinders"

      />
    </main>
  );
}
