import React from "react";
import type { ProductFormState } from "../types";

type ProductSummaryProps = {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  productData: ProductFormState;
  formattedPriceDisplay: string;
};

const ProductSummary: React.FC<ProductSummaryProps> = ({
  loading,
  error,
  successMessage,
  productData,
  formattedPriceDisplay,
}) => (
  <div className="bg-background-light p-4 rounded-lg border border-gray-700 text-xs sm:text-sm space-y-3">
    {successMessage && (
      <p className="text-xs sm:text-sm text-green-400 font-medium">
        {successMessage}
      </p>
    )}

    {loading && <p className="text-text-secondary">Loading product data...</p>}

    {!loading && error && <p className="text-red-400">{error}</p>}

    {!loading && !error && (
      <div className="text-text-secondary grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <div className="min-w-0">
          <span className="text-text-primary font-semibold">Product name: </span>
          <span className="break-words">
            {productData.name || "—"}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-text-primary font-semibold">SKU: </span>
          <span className="break-words">
            {productData.sku || "—"}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-text-primary font-semibold">Price: </span>
          {formattedPriceDisplay}
        </div>
        <div className="min-w-0">
          <span className="text-text-primary font-semibold">Stock: </span>
          {productData.stock ? "Available" : "Out of stock"}
        </div>
      </div>
    )}
  </div>
);

export default ProductSummary;
