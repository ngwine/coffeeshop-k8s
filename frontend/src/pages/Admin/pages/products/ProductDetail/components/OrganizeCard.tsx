import React from 'react';
import type { ProductFormState, RenderFieldFn } from '../types';

type OrganizeCardProps = {
  productData: ProductFormState;
  renderField: RenderFieldFn;
  onFieldChange: (field: keyof ProductFormState, value: string) => void;
};

const OrganizeCard: React.FC<OrganizeCardProps> = ({ productData, renderField, onFieldChange }) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Organize</h3>
    <div className="space-y-4">
      {renderField('Category', productData.category, {
        onChange: (value) => onFieldChange('category', value),
      })}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
        <select
          value={productData.status}
          onChange={(e) => onFieldChange('status', e.target.value)}
          className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Publish">Publish</option>
          <option value="Inactive">Inactive</option>
          <option value="Draft">Draft</option>
        </select>
      </div>
    </div>
  </div>
);

export default OrganizeCard;















