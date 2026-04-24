import React from 'react';
import { AddProductFormData } from './ProductInfoSection';

type OrganizeSectionProps = {
  formData: AddProductFormData;
  categories: any[];
  onChange: (field: keyof AddProductFormData, value: any) => void;
};

const OrganizeSection: React.FC<OrganizeSectionProps> = ({ formData, categories, onChange }) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Organize</h3>
    <div className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">
          Category <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            id="category"
            value={formData.category}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary appearance-none"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id || cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">
          Status <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            id="status"
            value={formData.status}
            onChange={(e) => onChange('status', e.target.value as AddProductFormData['status'])}
            className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary appearance-none"
            required
          >
            <option value="Publish">Publish</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

export default OrganizeSection;

