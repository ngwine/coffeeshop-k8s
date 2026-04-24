import React from 'react';
import { RefreshCw } from 'lucide-react';

type ProductStatus = 'Publish' | 'Inactive' | 'Draft';

export type AddProductFormData = {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  status: ProductStatus;
  stock: boolean;
  variants: import('../../ProductDetail/components/VariantsSection').ProductVariant[];
};

type ProductInfoSectionProps = {
  formData: AddProductFormData;
  onChange: (field: keyof AddProductFormData, value: any) => void;
  onGenerateSKU: () => void;
};

const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({ 
  formData, 
  onChange, 
  onGenerateSKU 
}) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Product Information</h3>
    <div className="space-y-4">
      <div>
        <label htmlFor="product-name" className="block text-sm font-medium text-text-secondary mb-1">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="product-name"
          placeholder="Product title"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
          required
        />
      </div>
      <div>
        <label htmlFor="sku" className="block text-sm font-medium text-text-secondary mb-1">
          SKU <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="sku"
            placeholder="SKU will be auto-generated when category is selected"
            value={formData.sku}
            onChange={(e) => onChange('sku', e.target.value)}
            className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            required
          />
          <button
            type="button"
            onClick={onGenerateSKU}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Generate new SKU"
            aria-label="Generate SKU"
            disabled={!formData.category}
          >
            <RefreshCw
              size={14}
              className={`${formData.category ? 'text-text-secondary hover:text-text-primary' : 'text-gray-600'}`}
            />
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={6}
          placeholder="Product Description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary min-h-[150px] resize-none"
        />
      </div>

      {/* Unique attributes removed */}
    </div>
  </div>
);

export default ProductInfoSection;

