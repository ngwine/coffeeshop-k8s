import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { OrderDetail as OrderDetailType, Order } from '../../types';
import OrderList from './OrderList';
import OrderDetailComponent from './OrderDetail';
import OrdersApi, { fetchOrderById } from '../../../../api/orders';
import { fetchCustomerById } from '../../../../api/customers';

interface OrdersProps {
  initialOrderId?: string | null;
  initialOrderData?: any | null;
  fromCustomer?: boolean;
  onOrderClose?: () => void;
  onBackToCustomer?: () => void;
}


// Adapt backend order payload to OrderDetailType used by UI
const adaptOrderDetail = (o: any): OrderDetailType => {
  const normalizeAddress = (addr: any) => {
    if (!addr) return undefined;
    // If already normalized
    if (addr.street || addr.city || addr.state || addr.zip || addr.country) return addr;
    // Normalize from customer-style address
    const street = [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ');
    const city = addr.city || '';
    const state = addr.district || '';
    const zip = addr.postalCode || '';
    const country = addr.country || '';
    if (street || city || state || zip || country) {
      return { street, city, state, zip, country };
    }
    return undefined;
  };
  // Handle items - check multiple possible formats
  let items: any[] = [];
  if (Array.isArray(o.items) && o.items.length > 0) {
    items = o.items.map((it: any, idx: number) => ({
      id: it.id || it.productId || it._id || idx + 1,
      name: it.name || it.productName || it.sku || 'Item',
      variant: it.variant || it.sku || undefined,
      price: Number(it.price || it.unitPrice || 0),
      quantity: Number(it.quantity || it.qty || it.amount || 1),
    }));
  } else if (o.item && Array.isArray(o.item)) {
    // Alternative field name
    items = o.item.map((it: any, idx: number) => ({
      id: it.id || it.productId || it._id || idx + 1,
      name: it.name || it.productName || it.sku || 'Item',
      variant: it.variant || it.sku || undefined,
      price: Number(it.price || it.unitPrice || 0),
      quantity: Number(it.quantity || it.qty || it.amount || 1),
    }));
  }
  // Use values directly from backend - don't recalculate
  const subtotal = o.subtotal != null ? Number(o.subtotal) : items.reduce((s: number, it: any) => s + it.price * it.quantity, 0);
  // Get shippingFee directly from backend - handle both undefined and 0 values
  const shippingFee = (o.shippingFee !== undefined && o.shippingFee !== null) ? Number(o.shippingFee) : 0;
  const discount = o.discount != null ? Number(o.discount) : 0;
  const pointsUsed = o.pointsUsed != null ? Number(o.pointsUsed) : 0;
  const pointsEarned = o.pointsEarned != null ? Number(o.pointsEarned) : 0;
  const tax = o.tax != null ? Number(o.tax) : 0;
  // Use total directly from backend - don't recalculate
  const total = o.total != null ? Number(o.total) : (subtotal + shippingFee - discount + tax);
  // Use paymentStatus directly from backend
  const paymentStatus = o.paymentStatus ? String(o.paymentStatus) : 'Pending';
  const customer = {
    id: (o.customerId && (o.customerId._id || o.customerId)) || '',
    name: (o.customerName) || (o.customerEmail ? o.customerEmail.split('@')[0] : 'Customer'),
    email: o.customerEmail,
    phone: (o.customerPhone) || '',
    avatar: `https://i.pravatar.cc/80?u=${encodeURIComponent(o.customerEmail || o.id)}`,
    totalOrders: undefined as any,
  } as any;
  return {
    id: String(o._id || o.id || ''),
    displayCode: (o.displayCode && typeof o.displayCode === 'string' && o.displayCode.trim().length > 0) ? String(o.displayCode).trim() : null, // 4-character alphanumeric code for display
    date: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
    paymentStatus,
    status: o.status ? (o.status[0].toUpperCase() + o.status.slice(1)) : 'Processing',
    items,
    subtotal,
    shippingFee,
    discount,
    tax,
    total,
    pointsUsed,
    pointsEarned,
    shippingActivity: (() => {
      const provided = Array.isArray(o.shippingActivity) ? o.shippingActivity : [];
      if (provided.length > 0) {
        return provided
          .filter((activity: any) => activity && (activity.status || activity.description))
          .map((activity: any) => ({
            status: activity.status,
            description: activity.description,
            date: activity.date,
            time: activity.time,
            completed: Boolean(activity.completed),
          }));
      }

      const created = o.createdAt ? new Date(o.createdAt) : new Date();
      const formatStepTime = (offsetDays: number) => {
        const d = new Date(created);
        d.setDate(d.getDate() + offsetDays);
        return {
          date: d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
          time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        };
      };

      const baseStatus = String(o.status || 'processing').toLowerCase();
      const statusAlias: Record<string, string> = {
        ready_to_pickup: 'shipped',
        readytopickup: 'shipped',
        ready: 'shipped',
      };
      const normalizedStatus = statusAlias[baseStatus] || baseStatus;

      const stepDefinitions = [
        { key: 'pending', title: 'Order placed', description: 'We have received your order.' },
        { key: 'processing', title: 'Processing', description: 'We are preparing your items.' },
        { key: 'shipped', title: 'Shipped', description: 'The package has been handed to the carrier.' },
        { key: 'delivered', title: 'Delivered', description: 'The order has been delivered.' },
      ];

      const statusRank: Record<string, number> = {
        pending: 0,
        processing: 1,
        shipped: 2,
        delivered: 3,
      };

      const isCancelled = normalizedStatus === 'cancelled';
      const isRefunded = normalizedStatus === 'refunded';
      const maxCompletedIndex = (() => {
        if (isCancelled) return 0;
        if (isRefunded) return statusRank.delivered;
        return Object.prototype.hasOwnProperty.call(statusRank, normalizedStatus)
          ? statusRank[normalizedStatus]
          : 0;
      })();

      const steps = stepDefinitions.map((def, index) => ({
        status: def.title,
        description: def.description,
        completed: index <= maxCompletedIndex,
        ...formatStepTime(index),
      }));

      const visibleSteps = steps.filter((_, index) => index <= Math.max(Math.min(maxCompletedIndex, stepDefinitions.length - 1), 0));

      if (isCancelled) {
        visibleSteps.push({
          status: 'Cancelled',
          description: 'The order was cancelled.',
          completed: true,
          ...formatStepTime(stepDefinitions.length),
        });
      }

      if (isRefunded) {
        visibleSteps.push({
          status: 'Refunded',
          description: 'Payment has been refunded.',
          completed: true,
          ...formatStepTime(stepDefinitions.length),
        });
      }
      return visibleSteps as any;
    })(),
    shippingAddress: normalizeAddress(o.shippingAddress) || normalizeAddress(o.shipping) || { street: '', city: '', state: '', zip: '', country: '' },
    paymentMethod: o.paymentMethod || 'cod', // Keep as string if it's a string from backend
    paymentType: typeof o.paymentMethod === 'object' ? (o.paymentMethod?.type || o.paymentType) : (o.paymentMethod || o.paymentType),
    customer,
  } as any;
};

const Orders: React.FC<OrdersProps> = ({ initialOrderId: propOrderId = null, initialOrderData = null, fromCustomer = false, onOrderClose, onBackToCustomer }) => {
  const { orderId: urlOrderId } = useParams<{ orderId: string }>();
  const initialOrderId = propOrderId || urlOrderId || null;
  // Use useMemo to compute selectedOrder from initialOrderId or initialOrderData
  const initialOrder = useMemo(() => {
    // If we have initialOrderData, adapt it immediately to avoid fetch
    if (initialOrderData) {
      return adaptOrderDetail(initialOrderData) as any;
    }
    // Otherwise, will be loaded from API in useEffect
    return null;
  }, [initialOrderId, initialOrderData]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailType | null>(initialOrder);

  // Reset state when initialOrderId changes from parent
  useEffect(() => {
    if (initialOrderId === null) {
      // Only reset if explicitly set to null (not just undefined)
      setSelectedOrder(null);
      setSelectedOrderId(null);
    } else if (initialOrderData) {
      // If we have initialOrderData, use it immediately
      const adapted = adaptOrderDetail(initialOrderData) as any;
      setSelectedOrder(adapted);
      setSelectedOrderId(String(initialOrderId));
    }
  }, [initialOrderId, initialOrderData]);

  useEffect(() => {
    const run = async () => {
      if (initialOrderId) {
    try {
      const res = await fetchOrderById(initialOrderId);
      const data = res?.data || res;
      if (data) {
          const detail: any = adaptOrderDetail(data) as any;
        // Hydrate customer from DB by id or email
        try {
          const cid = (data.customerId && (data.customerId._id || data.customerId)) || null;
          const key = cid || data.customerEmail;
          if (key) {
            const cres = await fetchCustomerById(String(key));
            const c = cres?.data || cres;
            if (c) {
              detail.customer = {
                id: c.id || c._id,
                name: c.fullName || detail.customer?.name,
                email: c.email || detail.customer?.email,
                phone: c.phone || detail.customer?.phone,
                avatar: c.avatarUrl || detail.customer?.avatar,
                totalOrders: detail.customer?.totalOrders,
              } as any;

              // Hydrate addresses if order lacks them
              const pickAddress = (arr: any[], type: string) => {
                if (!Array.isArray(arr)) return null;
                const def = arr.find((a: any) => (a.type || '').toLowerCase() === type && a.isDefault);
                const first = arr.find((a: any) => (a.type || '').toLowerCase() === type) || arr[0];
                const a = def || first;
                if (!a) return null;
                return {
                  street: [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
                  city: a.city || '',
                  state: a.district || '',
                  zip: a.postalCode || '',
                  country: a.country || '',
                };
              };
              if (!detail.shippingAddress || !detail.shippingAddress.street) {
                const addr = pickAddress(c.addresses, 'shipping');
                if (addr) detail.shippingAddress = addr as any;
              }

              // Hydrate payment method/type from customer default paymentMethods
              if (!detail.paymentType || !detail.paymentMethod || !detail.paymentMethod.type) {
                const pms: any[] = c.paymentMethods || [];
                const def = pms.find(pm => pm.isDefault) || pms[0];
                if (def) {
                  detail.paymentType = def.type;
                  if (def.type === 'card') {
                    detail.paymentMethod = { type: 'card', brand: def.brand, last4: def.last4 } as any;
                  } else if (def.type === 'bank') {
                    detail.paymentMethod = { type: 'bank', provider: def.provider, last4: def.card?.last4, brand: def.card?.brand } as any;
                  } else if (def.type === 'cash') {
                    detail.paymentMethod = { type: 'cash' } as any;
                  }
                }
              }
            }
          }
        } catch {}
        // Preserve shippingFee from data after adaptOrderDetail and after customer hydration
        if (data.shippingFee !== undefined && data.shippingFee !== null) {
          detail.shippingFee = Number(data.shippingFee);
        }
        setSelectedOrder(detail);
        setSelectedOrderId(String(data._id || data.id));
        return;
      }
    } catch (e) {
      setSelectedOrder(null);
      setSelectedOrderId(null);
    }
      } else {
        setSelectedOrder(null);
        setSelectedOrderId(null);
      }
    };
    run();
  }, [initialOrderId]);

  const handleOrderClick = async (orderId: string, orderData?: any) => {
    // Always try to fetch full order detail from API first to get items
    try {
      const res = await fetchOrderById(orderId);
      const data = res?.data || res;
      if (data && data.items && Array.isArray(data.items) && data.items.length > 0) {
        const detail: any = adaptOrderDetail(data) as any;
        try {
          const cid = (data.customerId && (data.customerId._id || data.customerId)) || null;
          const key = cid || data.customerEmail;
          if (key) {
            const cres = await fetchCustomerById(String(key));
            const c = cres?.data || cres;
            if (c) {
              detail.customer = {
                id: c.id || c._id,
                name: c.fullName || detail.customer?.name,
                email: c.email || detail.customer?.email,
                phone: c.phone || detail.customer?.phone,
                avatar: c.avatarUrl || detail.customer?.avatar,
                totalOrders: detail.customer?.totalOrders,
              } as any;
            }
          }
        } catch (e) {
        }
        const finalOrderId = String(data._id || data.id || orderId);
        setSelectedOrder(detail);
        setSelectedOrderId(finalOrderId);
        return;
      }
    } catch (e) {
    }
    
    // Fallback: Use orderData from list if available
    if (orderData) {
      try {
        const detail: any = adaptOrderDetail(orderData) as any;
        
        // If no items, try to fetch from API again (even if it might fail)
        if (!detail.items || detail.items.length === 0) {
          try {
            const res = await fetchOrderById(orderId);
            const apiData = res?.data || res;
            if (apiData && apiData.items && Array.isArray(apiData.items) && apiData.items.length > 0) {
              const adaptedApiData = adaptOrderDetail(apiData);
              detail.items = adaptedApiData.items;
            }
          } catch (e) {
          }
        }
        
        // Try to enrich with customer info
        try {
          const cid = (orderData.customerId && (orderData.customerId._id || orderData.customerId)) || null;
          const key = cid || orderData.customerEmail;
          if (key) {
            const cres = await fetchCustomerById(String(key));
            const c = cres?.data || cres;
            if (c) {
              detail.customer = {
                id: c.id || c._id,
                name: c.fullName || detail.customer?.name || orderData.customerName,
                email: c.email || detail.customer?.email || orderData.customerEmail,
                phone: c.phone || detail.customer?.phone || orderData.customerPhone,
                avatar: c.avatarUrl || detail.customer?.avatar,
                totalOrders: detail.customer?.totalOrders,
              } as any;

              // Hydrate shipping address from customer if order lacks it
              if (!detail.shippingAddress || !detail.shippingAddress.street) {
                const pickAddress = (arr: any[], type: string) => {
                  if (!Array.isArray(arr)) return null;
                  const def = arr.find((a: any) => (a.type || '').toLowerCase() === type && a.isDefault);
                  const first = arr.find((a: any) => (a.type || '').toLowerCase() === type) || arr[0];
                  const a = def || first;
                  if (!a) return null;
                  return {
                    street: [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
                    city: a.city || '',
                    state: a.district || '',
                    zip: a.postalCode || '',
                    country: a.country || '',
                  };
                };
                const addr = pickAddress(c.addresses || [], 'shipping');
                if (addr) {
                  detail.shippingAddress = addr as any;
                }
              }
            }
          }
        } catch (e) {
        }
        
        const finalOrderId = String(orderData._id || orderData.id || orderId);
        setSelectedOrder(detail);
        setSelectedOrderId(finalOrderId);
        return;
      } catch (e) {
      }
    }
    
    // If we still don't have order detail, try to create from list data
    if (orderData) {
      const basicDetail = adaptOrderDetail(orderData);
      setSelectedOrder(basicDetail);
      setSelectedOrderId(String(orderId));
    }
  };

  const handleBack = () => {
    setSelectedOrder(null);
    setSelectedOrderId(null);
    if (fromCustomer && onBackToCustomer) {
      // If came from customer, go back to customer detail
      onBackToCustomer();
    } else if (onOrderClose) {
      // Otherwise, go back to order list
      onOrderClose();
    }
  };

  // Update selectedOrder when initialOrder changes
  useEffect(() => {
    if (initialOrder && initialOrderId) {
      setSelectedOrder(initialOrder);
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrder, initialOrderId]);

  // Check initialOrder first, then fallback to state
  const orderToShow = initialOrder || selectedOrder;
  const orderIdToShow = initialOrderId || selectedOrderId;

  // Refresh order data function
  const handleRefreshOrder = async () => {
    if (!orderIdToShow) return;
    try {
      const res = await fetchOrderById(orderIdToShow);
      const data = res?.data || res;
      if (data) {
        const detail: any = adaptOrderDetail(data) as any;
        // Hydrate customer from DB by id or email
        try {
          const cid = (data.customerId && (data.customerId._id || data.customerId)) || null;
          const key = cid || data.customerEmail;
          if (key) {
            const cres = await fetchCustomerById(String(key));
            const c = cres?.data || cres;
            if (c) {
              detail.customer = {
                id: c.id || c._id,
                name: c.fullName || detail.customer?.name,
                email: c.email || detail.customer?.email,
                phone: c.phone || detail.customer?.phone,
                avatar: c.avatarUrl || detail.customer?.avatar,
                totalOrders: detail.customer?.totalOrders,
              } as any;

              // Hydrate addresses if order lacks them
              const pickAddress = (arr: any[], type: string) => {
                if (!Array.isArray(arr)) return null;
                const def = arr.find((a: any) => (a.type || '').toLowerCase() === type && a.isDefault);
                const first = arr.find((a: any) => (a.type || '').toLowerCase() === type) || arr[0];
                const a = def || first;
                if (!a) return null;
                return {
                  street: [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
                  city: a.city || '',
                  state: a.district || '',
                  zip: a.postalCode || '',
                  country: a.country || '',
                };
              };
              if (!detail.shippingAddress || !detail.shippingAddress.street) {
                const addr = pickAddress(c.addresses, 'shipping');
                if (addr) detail.shippingAddress = addr as any;
              }

              // Hydrate payment method/type from customer default paymentMethods
              if (!detail.paymentType || !detail.paymentMethod || !detail.paymentMethod.type) {
                const pms: any[] = c.paymentMethods || [];
                const def = pms.find(pm => pm.isDefault) || pms[0];
                if (def) {
                  detail.paymentType = def.type;
                  if (def.type === 'card') {
                    detail.paymentMethod = { type: 'card', brand: def.brand, last4: def.last4 } as any;
                  } else if (def.type === 'bank') {
                    detail.paymentMethod = { type: 'bank', provider: def.provider, last4: def.card?.last4, brand: def.card?.brand } as any;
                  } else if (def.type === 'cash') {
                    detail.paymentMethod = { type: 'cash' } as any;
                  }
                }
              }
            }
          }
        } catch {}
        // Preserve shippingFee from data after adaptOrderDetail and after customer hydration
        if (data.shippingFee !== undefined && data.shippingFee !== null) {
          detail.shippingFee = Number(data.shippingFee);
        }
        setSelectedOrder(detail);
      }
    } catch (e) {
    }
  };

  // Always show detail if we have both order and orderId
  if (orderToShow && orderIdToShow) {
    return <OrderDetailComponent order={orderToShow} onBack={handleBack} onRefresh={handleRefreshOrder} />;
  }

  return <OrderList onOrderClick={handleOrderClick} />;
};

export default Orders;

