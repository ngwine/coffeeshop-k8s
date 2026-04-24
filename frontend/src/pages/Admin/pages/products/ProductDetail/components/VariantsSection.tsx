import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';

export type VariantOption = {
  label: string;
  priceDelta: number;
};

export type ProductVariant = {
  name: string;
  options: VariantOption[];
};

type VariantsSectionProps = {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
};

const VariantsSection: React.FC<VariantsSectionProps> = ({ variants, onChange }) => {
  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      name: '',
      options: [{ label: '', priceDelta: 0 }],
    };
    onChange([...variants, newVariant]);
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    onChange(newVariants);
  };

  const handleVariantNameChange = (index: number, name: string) => {
    const newVariants = [...variants];
    newVariants[index].name = name;
    onChange(newVariants);
  };

  const handleAddOption = (variantIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options.push({ label: '', priceDelta: 0 });
    onChange(newVariants);
  };

  const handleRemoveOption = (variantIndex: number, optionIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options.splice(optionIndex, 1);
    if (newVariants[variantIndex].options.length === 0) {
      newVariants[variantIndex].options.push({ label: '', priceDelta: 0 });
    }
    onChange(newVariants);
  };

  const handleOptionChange = (
    variantIndex: number,
    optionIndex: number,
    field: keyof VariantOption,
    value: string | number
  ) => {
    const newVariants = [...variants];
    const option = newVariants[variantIndex].options[optionIndex];
    
    if (field === 'priceDelta') {
        option[field] = Number(value) || 0;
    } else {
        option[field] = value as string;
    }
    
    onChange(newVariants);
  };

  return (
    <div className="bg-background-light p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Product Options (Variants)</h3>
        <button
          onClick={handleAddVariant}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus size={14} />
          Add Option Group
        </button>
      </div>

      <div className="space-y-6">
        {variants.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
            <p className="text-sm text-text-secondary italic">No options defined for this product.</p>
            <p className="text-xs text-text-secondary mt-1">Add groups like "Size", "Color" or "Weight".</p>
          </div>
        ) : (
          variants.map((variant, vIdx) => (
            <div key={vIdx} className="p-4 border border-gray-700 rounded-lg bg-background-dark/30 relative">
              <button
                onClick={() => handleRemoveVariant(vIdx)}
                className="absolute top-4 right-4 text-text-secondary hover:text-red-400 transition-colors"
                title="Remove group"
              >
                <Trash2 size={16} />
              </button>

              <div className="mb-4 pr-10">
                <label className="block text-xs font-medium text-text-secondary mb-1">Group Name (e.g. Weight)</label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => handleVariantNameChange(vIdx, e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-text-secondary mb-1">Values & Price Adjustments</label>
                {variant.options.map((option, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => handleOptionChange(vIdx, oIdx, 'label', e.target.value)}
                        placeholder="Option label (e.g. 250g)"
                        className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                      />
                    </div>
                    <div className="w-32 relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">+$</span>
                       <input
                        type="number"
                        value={option.priceDelta}
                        onChange={(e) => handleOptionChange(vIdx, oIdx, 'priceDelta', e.target.value)}
                        placeholder="0"
                        className="w-full bg-background-dark border border-gray-600 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveOption(vIdx, oIdx)}
                      className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => handleAddOption(vIdx)}
                  className="mt-2 flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Plus size={12} />
                  Add another value
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <p className="mt-4 text-[10px] text-text-secondary italic leading-relaxed">
        💡 Price adjustments (+$) will be added to the base price of the product when selected by the customer.
      </p>
    </div>
  );
};

export default VariantsSection;
