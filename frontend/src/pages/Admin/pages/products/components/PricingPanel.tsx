import React from 'react';
import { FormInput } from './FormFields';

const PricingPanel: React.FC = () => {
  return (
    <div className="bg-background-light p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Pricing</h3>
      <div className="space-y-4">
        <FormInput label="Base Price" placeholder="Price" id="base-price" />
        <FormInput label="Discounted Price" placeholder="Discounted Price" id="discounted-price" />
        <div className="flex items-center justify-between">
          <label htmlFor="charge-tax" className="text-sm font-medium text-text-primary">
            Charge tax on this product
          </label>
          <label htmlFor="charge-tax" className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="charge-tax" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">In stock</span>
          <label htmlFor="stock-toggle" className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="stock-toggle" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PricingPanel;



