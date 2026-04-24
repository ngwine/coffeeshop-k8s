import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./styles/menu.css";
import MenuCatalogSection from "../Catalog/components/MenuCatalogSection";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

// Mapping slugs to standard labels/names for backward compatibility
const SLUG_TO_NAME_MAP = {
  "coffee-sets": "Coffee sets",
  "cups-mugs": "Cups & Mugs",
  "roast-coffee": "Roasted coffee",
  "coffee-makers-grinders": "Coffee makers and grinders"
};

export default function CategoryMenuPage() {
  const { categorySlug } = useParams();
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategoryInfo() {
      try {
        setLoading(true);
        // We could fetch the specifically named category or list all and find match
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        
        const json = await res.json();
        const categories = json.data || [];

        // 1. Try mapping first (for hardcoded compatible slugs)
        let foundName = SLUG_TO_NAME_MAP[categorySlug];

        // 2. Fallback: Search in categories list (slugify names to match)
        if (!foundName) {
           const slugify = (text) => 
             text.toString().toLowerCase()
               .replace(/\s+/g, '-')
               .replace(/[^\w-]+/g, '')
               .replace(/--+/g, '-')
               .replace(/^-+/, '')
               .replace(/-+$/, '');

           const cat = categories.find(c => {
             const name = typeof c === 'string' ? c : c.name;
             return slugify(name) === categorySlug;
           });
           
           if (cat) {
             foundName = typeof cat === 'string' ? cat : cat.name;
           }
        }

        // 3. Last fallback: use slug as name (capitalized)
        if (!foundName) {
          foundName = categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }

        setCategoryName(foundName);
      } catch (err) {
        console.error("Error identifying category:", err);
        setCategoryName(categorySlug);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryInfo();
  }, [categorySlug]);

  if (loading) return <div className="order-container"><p>Loading category...</p></div>;

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
            <h1>{categoryName}</h1>
            <p>Explore our premium collection of {categoryName.toLowerCase()}</p>
          </div>
        </div>
      </section>

      <MenuCatalogSection
        breadcrumbLabel={`Home / Menu / ${categoryName}`}
        category={categoryName}
      />
    </main>
  );
}
