import React from 'react';
import type { ProductFormState } from '../types';

type PricingCardProps = {
  productData: ProductFormState;
  inputDisplayPrice: string;
  formattedPrice: string;
  onPriceInputChange: (value: string) => void;
  onFieldChange: (field: keyof ProductFormState, value: boolean) => void;
};

const PricingCard: React.FC<PricingCardProps> = ({
  productData,
  inputDisplayPrice,
  formattedPrice,
  onPriceInputChange,
  onFieldChange,
}) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Pricing</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Price <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">₫</span>
          <input
            type="text"
            inputMode="numeric"
            value={inputDisplayPrice}
            onChange={(e) => onPriceInputChange(e.target.value)}
            className="w-full bg-background-dark border border-gray-600 rounded-lg pl-6 pr-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">Formatted: {formattedPrice}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">In stock</span>
        <label className="relative inline-flex items-center cursor-default">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={productData.stock}
            onChange={(e) => onFieldChange('stock', e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-primary">
            <div
              className={`h-5 w-5 bg-white rounded-full mt-0.5 ml-0.5 transition-transform ${
                productData.stock ? 'translate-x-5' : ''
              }`}
            />
          </div>
        </label>
      </div>
    </div>
  </div>
);

export default PricingCard;

