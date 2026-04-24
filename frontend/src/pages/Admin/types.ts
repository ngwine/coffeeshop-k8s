export enum OrderStatus {
  Pending = 'Pending',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
  Processing = 'Processing',
}

export enum ProductStatus {
  Publish = 'Publish',
  Inactive = 'Inactive',
}

export interface User {
  id: number;
  name: string;
  avatar: string;
  email: string;
  role: 'Admin' | 'Member' | 'Guest';
  lastLogin: string;
  status: 'Active' | 'Inactive';
}

export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  category: string;
  stock: boolean;
  sku: string;
  price: number;
  quantity: number;
  status: ProductStatus;
}

export interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
    avatar: string;
    email: string;
    id?: string;
    _id?: string;
    avatarUrl?: string;
    phone?: string;
    totalOrders?: number;
  };
  payment: number;
  status: OrderStatus;
  paymentMethod: {
    type: 'Mastercard' | 'Visa' | 'PayPal';
    last4: string;
  };
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
}

export interface OrderItem {
  id: number;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface ShippingActivity {
  status: string;
  description: string;
  date?: string;
  time?: string;
  completed: boolean;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  shippingActivity: ShippingActivity[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shippingFee?: number;
  pointsUsed?: number;
  pointsEarned?: number;
}

export interface Category {
    id: number;
    name: string;
    productCount: number;
    status: 'Active' | 'Inactive';
}