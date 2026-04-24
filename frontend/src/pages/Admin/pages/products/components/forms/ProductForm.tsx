/* eslint-disable */
import React, { useState, useEffect } from 'react';

export type ProductFormValues = {
  name?: string;
  sku?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  price?: number;
  quantity?: number;
  status?: 'Publish' | 'Inactive';
  stock?: boolean;
};

type ProductFormProps = {
  initialValues?: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onCancel?: () => void;
  saving?: boolean;
  title?: string;
};

const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  saving,
  title = 'Product',
}) => {
  const [values, setValues] = useState<ProductFormValues>({
    name: '',
    sku: '',
    imageUrl: '',
    description: '',
    category: '',
    price: 0,
    quantity: 0,
    status: 'Publish',
    stock: true,
    ...(initialValues || {}),
  });

  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const setField = (field: keyof ProductFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-background-light p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">{title} Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
              value={values.name || ''}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">SKU</label>
              <input
                className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
                value={values.sku || ''}
                onChange={(e) => setField('sku', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <input
                className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
                value={values.category || ''}
                onChange={(e) => setField('category', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Image URL</label>
            <input
              className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
              value={values.imageUrl || ''}
              onChange={(e) => setField('imageUrl', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              rows={4}
              className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
              value={values.description || ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Price (đ)</label>
              <input
                type="number"
                className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
                value={values.price ?? 0}
                onChange={(e) => setField('price', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
              <input
                type="number"
                className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
                value={values.quantity ?? 0}
                onChange={(e) => setField('quantity', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <select
                className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary"
                value={values.status || 'Publish'}
                onChange={(e) => setField('status', e.target.value as ProductFormValues['status'])}
              >
                <option value="Publish">Publish</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!values.stock} onChange={(e) => setField('stock', e.target.checked)} />
            <span className="text-sm text-text-secondary">In stock</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {onCancel && (
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
              onClick={onCancel}
              disabled={!!saving}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="px-4 py-2 rounded bg-primary text-white disabled:opacity-60"
            onClick={() => onSubmit(values)}
            disabled={!!saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;















