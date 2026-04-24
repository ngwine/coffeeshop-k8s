import React from 'react';
import { Plus } from 'lucide-react';
import { FormInput, FormSelect } from './FormFields';

const VariantsSection: React.FC = () => {
  return (
    <div className="bg-background-light p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Variants</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect label="Options" id="options">
            <option>Size</option>
            <option>Color</option>
            <option>Material</option>
          </FormSelect>
          <FormInput label="Value" placeholder="Enter size" id="size-value" className="self-end" />
        </div>
        <button className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
          <Plus size={16} /> Add another option
        </button>
      </div>
    </div>
  );
};

export default VariantsSection;


