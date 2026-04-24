import React from 'react';
import { formatCurrencyInput } from '../utils';
import { formatVND } from 'utils/currency';
import { AddProductFormData } from './ProductInfoSection';

type PricingSectionProps = {
  formData: AddProductFormData;
  onChange: (field: keyof AddProductFormData, value: any) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  priceInputRef?: React.RefObject<HTMLInputElement>;
};

const PricingSection: React.FC<PricingSectionProps> = ({ formData, onChange, onPriceChange, priceInputRef }) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Pricing</h3>
    <div className="space-y-4">
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">
          Quantity <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          id="quantity"
          min={0}
          placeholder="0"
          value={formData.quantity}
          onChange={(e) => onChange('quantity', e.target.value)}
          className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
          required
        />
      </div>
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-text-secondary mb-1">
          Price <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">₫</span>
          <input
            ref={priceInputRef}
            type="text"
            inputMode="numeric"
            id="price"
            placeholder="0"
            value={formData.price || ''}
            onChange={onPriceChange}
            className="w-full bg-background-dark border border-gray-600 rounded-lg pl-6 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            required
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {formData.price ? formatVND(Number(formData.price)) : formatVND(0)}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">In stock</span>
        <label htmlFor="stock-toggle" className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="stock-toggle"
            className="sr-only peer"
            checked={formData.stock}
            onChange={(e) => onChange('stock', e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
    </div>
  </div>
);

export default PricingSection;

