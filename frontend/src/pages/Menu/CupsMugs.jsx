import React from "react";
import "./styles/menu.css";
import MenuCatalogSection from "../Catalog/components/MenuCatalogSection";

export default function CupsMugs() {
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
            <h1>Cup & Mugs</h1>
            <p>Everyday drinkware designed for coffee lovers</p>
          </div>
        </div>
      </section>

      <MenuCatalogSection
        breadcrumbLabel="Home / Menu / Cup & Mugs"
        category="Cups & Mugs"
      />
    </main>
  );
}
