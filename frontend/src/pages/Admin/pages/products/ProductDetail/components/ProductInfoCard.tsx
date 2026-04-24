import React from 'react';
import type { ProductFormState, RenderFieldFn } from '../types';

type ProductInfoCardProps = {
  productData: ProductFormState;
  renderField: RenderFieldFn;
  onFieldChange: (field: keyof ProductFormState, value: string) => void;
};

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ productData, renderField, onFieldChange }) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Product Information</h3>
    <div className="space-y-4">
      {renderField('Name', productData.name, {
        required: true,
        onChange: (value) => onFieldChange('name', value),
      })}
      {renderField('SKU', productData.sku, {
        required: true,
        onChange: (value) => onFieldChange('sku', value),
      })}
      {renderField('Description', productData.description, {
        multiline: true,
        onChange: (value) => onFieldChange('description', value),
      })}
    </div>
  </div>
);

export default ProductInfoCard;















