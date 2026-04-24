/**
 * Utility functions for consistent status color mapping across the application
 */

export type StatusColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

/**
 * Get color for order status
 * Consistent mapping across OrderList, OrderDetail, and Shipping Activity
 */
export function getOrderStatusColor(status: string | null | undefined): StatusColor {
  if (!status) return 'gray';
  const s = String(status).toLowerCase().trim();
  
  // Completed/Delivered statuses - Green
  if (s.includes('delivered') || s === 'delivered') {
    return 'green';
  }
  
  // Ready to pickup - Green
  if (s.includes('ready to pickup') || s.includes('readytopickup') || s.includes('ready_to_pickup') || s.includes('ready')) {
    return 'green';
  }
  
  // Shipped/Dispatched/Out for delivery - Blue
  if (s.includes('shipped') || s === 'shipped') {
    return 'blue';
  }
  if (s.includes('dispatched') || s === 'dispatched') {
    return 'blue';
  }
  if (s.includes('out for delivery') || s.includes('outfordelivery') || s.includes('out_for_delivery')) {
    return 'blue';
  }
  
  // Processing - Blue
  if (s.includes('processing') || s === 'processing') {
    return 'blue';
  }
  
  // Pending - Yellow
  if (s.includes('pending') || s === 'pending') {
    return 'yellow';
  }
  
  // Cancelled/Refunded/Returned - Red
  if (s.includes('cancelled') || s.includes('canceled') || s === 'cancelled' || s === 'canceled') {
    return 'red';
  }
  if (s.includes('refunded') || s === 'refunded') {
    return 'red';
  }
  if (s.includes('returned') || s === 'returned') {
    return 'red';
  }
  
  return 'gray';
}

/**
 * Get color for payment status
 */
export function getPaymentStatusColor(status: string | null | undefined): StatusColor {
  if (!status) return 'gray';
  const s = String(status).toLowerCase().trim();
  
  if (s === 'paid' || s.includes('paid')) {
    return 'green';
  }
  if (s === 'pending' || s.includes('pending')) {
    return 'yellow';
  }
  if (s === 'failed' || s.includes('failed')) {
    return 'red';
  }
  if (s === 'refunded' || s.includes('refunded')) {
    return 'red';
  }
  
  return 'gray';
}

/**
 * Get CSS classes for status badge (for Shipping Activity timeline)
 * Returns Tailwind classes that match Badge component colors
 */
export function getStatusBadgeClasses(status: string | null | undefined): string {
  const color = getOrderStatusColor(status);
  
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  
  return colorClasses[color];
}

























