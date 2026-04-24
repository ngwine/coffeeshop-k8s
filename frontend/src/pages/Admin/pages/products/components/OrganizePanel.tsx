import React from 'react';
import { Plus, X } from 'lucide-react';
import { FormSelect } from './FormFields';

const OrganizePanel: React.FC = () => {
  return (
    <div className="bg-background-light p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Organize</h3>
      <div className="space-y-4">
        <FormSelect label="Vendor" id="vendor">
          <option>Select Vendor</option>
          <option>Trung Nguyên Legend</option>
          <option>Highlands Coffee</option>
          <option>Phúc Long</option>
          <option>The Coffee House</option>
        </FormSelect>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <FormSelect label="Category" id="category">
            <option>Select Category</option>
            <option>Roasted coffee</option>
            <option>Coffee sets</option>
            <option>Cups & Mugs</option>
            <option>Coffee makers and grinders</option>
          </FormSelect>
          <button
            className="self-end bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-primary hover:border-primary transition-colors"
            aria-label="Add category"
          >
            <Plus size={16} />
          </button>
        </div>
        <FormSelect label="Collection" id="collection">
          <option>Select collection</option>
          <option>Signature Line</option>
          <option>Seasonal</option>
          <option>Accessories</option>
        </FormSelect>
        <FormSelect label="Status" id="status">
          <option>Published</option>
          <option>Draft</option>
          <option>Inactive</option>
        </FormSelect>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 p-2 border border-gray-600 rounded-lg bg-background-dark">
            <span className="flex items-center gap-1 bg-primary/20 text-primary text-sm px-2 py-1 rounded">Normal <X size={14} /></span>
            <span className="flex items-center gap-1 bg-primary/20 text-primary text-sm px-2 py-1 rounded">Standard <X size={14} /></span>
            <span className="flex items-center gap-1 bg-primary/20 text-primary text-sm px-2 py-1 rounded">Premium <X size={14} /></span>
            <input placeholder="Add tag" className="bg-transparent focus:outline-none flex-1 text-sm text-text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizePanel;



