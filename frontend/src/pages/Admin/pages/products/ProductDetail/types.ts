import type { ReactNode } from 'react';
export type ProductFormState = {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  status: 'Publish' | 'Inactive' | 'Draft';
  stock: boolean;
  imageUrl: string;
};

export type ProductPrefill = Partial<
  Omit<ProductFormState, 'price' | 'quantity'> & {
    price?: string | number;
    quantity?: string | number;
    id?: string | number;
    _id?: string;
  }
>;

export type RenderFieldOptions = {
  required?: boolean;
  type?: string;
  multiline?: boolean;
  onChange?: (value: string) => void;
};

export type RenderFieldFn = (
  label: string,
  value: string,
  options?: RenderFieldOptions,
) => ReactNode;

