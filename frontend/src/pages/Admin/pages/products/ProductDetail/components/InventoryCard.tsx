import React from 'react';
import type { ProductFormState, RenderFieldFn } from '../types';

type InventoryCardProps = {
  productData: ProductFormState;
  renderField: RenderFieldFn;
  onFieldChange: (field: keyof ProductFormState, value: string) => void;
};

const InventoryCard: React.FC<InventoryCardProps> = ({ productData, renderField, onFieldChange }) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Inventory</h3>
    <div className="space-y-4">
      {renderField('Quantity', productData.quantity, {
        required: true,
        type: 'number',
        onChange: (value) => onFieldChange('quantity', value),
      })}
    </div>
  </div>
);

export default InventoryCard;















