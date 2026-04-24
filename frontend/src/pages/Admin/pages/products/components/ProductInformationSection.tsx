import React from 'react';
import { FormInput } from './FormFields';

const ProductInformationSection: React.FC = () => {
  return (
    <div className="bg-background-light p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Product Information</h3>
      <div className="space-y-4">
        <FormInput label="Name" placeholder="Product title" id="product-name" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="SKU" placeholder="SKU" id="sku" />
          <FormInput label="Barcode" placeholder="0123-4567" id="barcode" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={6}
            placeholder="Product Description"
            className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductInformationSection;



