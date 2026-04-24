import React, { useEffect, useState, useRef } from 'react';
import { OrderDetail as OrderDetailType, ShippingActivity, OrderStatus } from '../../types';
import Badge from '../../components/Badge';
import { Edit, ShoppingCart, CheckCircle2, Plus, X, ChevronDown, Calendar } from 'lucide-react';
import { formatVND } from '../../../../utils/currency';
import { fetchCustomerById } from '../../../../api/customers';
import { OrdersApi } from '../../../../api/orders';
import { getAvatarUrl } from '../../../../utils/avatar';
import { getOrderStatusColor, getPaymentStatusColor } from '../../../../utils/statusColors';
import BackButton from '../../components/BackButton';
import { saveState, loadState, clearState } from '../../../../utils/statePersistence';
import { getOrderDisplayCode } from '../../../../utils/orderDisplayCode';

interface OrderDetailProps {
  order: OrderDetailType;
  onBack: () => void;
  onRefresh?: () => Promise<void>;
}

const ORDER_STATUSES = [
  'pending',
  'processing',
  'ready to pickup',
  'dispatched',
  'out for delivery',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'returned'
];

const OrderDetail: React.FC<OrderDetailProps> = ({ order, onBack, onRefresh }) => {
  const orderId = String(order.id || (order as any)._id || '');
  const stateKey = `order_detail_${orderId}`;
  
  // Load persisted state from sessionStorage
  const persistedState = loadState<{
    shippingActivity?: ShippingActivity[];
    formData?: ShippingActivity;
    showEditModal?: boolean;
  }>(stateKey);
  
  const [shippingActivity, setShippingActivity] = useState<ShippingActivity[]>(
    persistedState?.shippingActivity || order.shippingActivity || []
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ShippingActivity>(
    persistedState?.formData || {
      status: '',
      description: '',
      date: '',
      time: '',
      completed: false,
    }
  );
  const [saving, setSaving] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [customerData, setCustomerData] = useState<any>(order.customer || null);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    saveState(stateKey, {
      shippingActivity,
      formData,
      showEditModal,
    });
  }, [stateKey, shippingActivity, formData, showEditModal]);

  useEffect(() => {
    // Only update from order if there's no persisted state
    if (!persistedState?.shippingActivity) {
      setShippingActivity(order.shippingActivity || []);
    }
  }, [order.shippingActivity, persistedState]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Import shared utility for order display code
  const getOrderDisplayCodeFunc = (orderOrVal: any) => getOrderDisplayCode(orderOrVal);
  
  // Function to format customer ID (extract last 4 hex chars)
  const getCustomerDisplayCode = (val: string | number | undefined | null) => {
    const s = String(val || '');
    if (!s) return '';
    const hex = s.replace(/[^a-fA-F0-9]/g, '') || s;
    const last4 = hex.slice(-4).padStart(4, '0');
    return `#${last4}`;
  };

  const formatAddress = (addr: any) => {
    if (!addr) return '';
    const parts = [addr.street, addr.city, addr.state, addr.zip, addr.country]
      .filter(Boolean)
      .map((p: string) => String(p).trim());
    return parts.join(', ');
  };
  const [hydratedShipping, setHydratedShipping] = useState<any>(order.shippingAddress);
  const shippingAddrText = formatAddress(hydratedShipping);

  const addressLines = (addr: any): string[] => {
    if (!addr) return [];
    const lines: string[] = [];
    if (addr.street) lines.push(String(addr.street));
    if (addr.city && !addr.state && !addr.zip) {
      lines.push(String(addr.city));
    } else if (addr.city) {
      lines.push(String(addr.city));
    }
    if (addr.zip || addr.state) {
      const third = [addr.zip, addr.state].filter(Boolean).join(', ');
      if (third) lines.push(third);
    }
    if (addr.country) lines.push(String(addr.country));
    return lines.length ? lines : [];
  };
  const shippingLines = addressLines(hydratedShipping);

  // Fetch customer data if not available in order
  useEffect(() => {
    // If order already has customer object with ID, use it
    if (order.customer?._id || order.customer?.id) {
      setCustomerData(order.customer);
      return;
    }
    
    // If we already have customerData, don't fetch again
    if (customerData?._id || customerData?.id) return;
    
    // Try to fetch customer by email or customerId
    const key = (order as any)?.customerEmail || order.customer?.email || (order as any)?.customerId;
    if (!key) return;
    
    (async () => {
      try {
        const res = await fetchCustomerById(String(key));
        const c = res?.data || res;
        if (c) {
          setCustomerData(c);
        }
      } catch {}
    })();
  }, [order]);

  // Enrich from customer profile if order lacks address
  useEffect(() => {
    const needShipping = !shippingLines.length;
    const key = (order as any)?.customer?.id || (order as any)?.customerEmail || customerData?.email;
    if (!key || !needShipping) return;
    (async () => {
      try {
        const res = await fetchCustomerById(String(key));
        const c = res?.data || res;
        const arr: any[] = c?.addresses || [];
        if (Array.isArray(arr) && arr.length) {
          const pick = (type: string) => arr.find((a: any) => (a.type || '').toLowerCase() === type && a.isDefault)
            || arr.find((a: any) => (a.type || '').toLowerCase() === type);
          const norm = (a: any) => a ? ({
            street: [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
            city: a.city || '',
            state: a.district || '',
            zip: a.postalCode || '',
            country: a.country || ''
          }) : undefined;
          if (needShipping) setHydratedShipping(norm(pick('shipping') || arr[0]));
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, customerData]);

  const handleOpenEditModal = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(shippingActivity[index]);
    } else {
      setEditingIndex(null);
      setFormData({
        status: '',
        description: '',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        completed: false,
      });
    }
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingIndex(null);
    setFormData({
      status: '',
      description: '',
      date: '',
      time: '',
      completed: false,
    });
  };

  const handleSaveActivity = async () => {
    if (!formData.status || !formData.description) {
      alert('Please fill in status and description');
      return;
    }

    try {
      setSaving(true);
      const updatedActivity = [...shippingActivity];
      
      if (editingIndex !== null) {
        // Update existing activity
        updatedActivity[editingIndex] = formData;
      } else {
        // Add new activity
        updatedActivity.push(formData);
      }

      // Determine order status from the latest activity
      let newStatus: any = order.status;
      if (updatedActivity.length > 0) {
        // Get the latest activity (last one in array)
        const latestActivity = updatedActivity[updatedActivity.length - 1];
        if (latestActivity?.status) {
          // Map activity status to order status
          const statusMap: Record<string, string> = {
            'pending': 'pending',
            'processing': 'processing',
            'ready to pickup': 'ready to pickup',
            'dispatched': 'dispatched',
            'out for delivery': 'out for delivery',
            'shipped': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
            'refunded': 'refunded',
            'returned': 'returned',
          };
          newStatus = statusMap[latestActivity.status.toLowerCase()] || latestActivity.status;
        }
      }

      // Get order ID - try multiple formats
      const orderId = String(order.id || (order as any)._id || (order as any).id || '');
      if (!orderId) {
        alert('Error: Order ID is missing. Cannot update shipping activity.');
        return;
      }
      // Update via API - include both shippingActivity and status
      const response = await OrdersApi.update(orderId, { 
        shippingActivity: updatedActivity,
        status: newStatus as any
      });
      
      setShippingActivity(updatedActivity);
      handleCloseModal();
      
      // Clear persisted state after successful save
      clearState(stateKey);
      
      // Refresh order data if callback provided
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      
      // Extract error message
      let errorMessage = 'Failed to update shipping activity';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Extract status code
      const statusCode = error?.status || error?.response?.status || 'Unknown';
      
      alert(`Error: ${errorMessage}\nStatus: ${statusCode}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (index: number) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      setSaving(true);
      const updatedActivity = shippingActivity.filter((_, i) => i !== index);
      
      // Determine order status from remaining activities
      let newStatus: any = 'pending'; // Default status if no activities left
      if (updatedActivity.length > 0) {
        // Get the latest activity (last one in array)
        const latestActivity = updatedActivity[updatedActivity.length - 1];
        if (latestActivity?.status) {
          // Map activity status to order status
          const statusMap: Record<string, string> = {
            'pending': 'pending',
            'processing': 'processing',
            'ready to pickup': 'ready to pickup',
            'dispatched': 'dispatched',
            'out for delivery': 'out for delivery',
            'shipped': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
            'refunded': 'refunded',
            'returned': 'returned',
          };
          newStatus = statusMap[latestActivity.status.toLowerCase()] || latestActivity.status;
        }
      } else {
        // If no activities left, set to pending
        newStatus = 'pending';
      }
      
      // Get order ID - try multiple formats
      const orderId = String(order.id || (order as any)._id || (order as any).id || '');
      if (!orderId) {
        alert('Error: Order ID is missing. Cannot delete shipping activity.');
        return;
      }
      // Update via API - include both shippingActivity and status
      const response = await OrdersApi.update(orderId, { 
        shippingActivity: updatedActivity,
        status: newStatus as any
      });
      
      setShippingActivity(updatedActivity);
      
      // Clear persisted state after successful delete
      clearState(stateKey);
      
      // Refresh order data if callback provided
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      
      // Extract error message
      let errorMessage = 'Failed to delete shipping activity';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Extract status code
      const statusCode = error?.status || error?.response?.status || 'Unknown';
      
      alert(`Error: ${errorMessage}\nStatus: ${statusCode}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-background-light p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            <BackButton onClick={onBack} label="Back to orders" className="mt-1" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-text-primary">Order {getOrderDisplayCodeFunc(order)}</h1>
                <Badge color={getPaymentStatusColor(order.paymentStatus || 'Pending')}>
                  {order.paymentStatus || 'Pending'}
                </Badge>
                <Badge color={getOrderStatusColor(order.status)}>
                  {(() => {
                    const status = order.status || 'Pending';
                    // Format status text: capitalize first letter of each word
                    return String(status)
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');
                  })()}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">{order.date}</p>
            </div>
          </div>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Delete Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="bg-background-light p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-text-primary">Order details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700 text-sm text-text-secondary">
                    <th className="p-3">PRODUCTS</th>
                    <th className="p-3 text-center">PRICE</th>
                    <th className="p-3 text-center">QTY</th>
                    <th className="p-3 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-text-primary">{item.name || 'Product'}</p>
                            {item.variant && (
  <p className="text-sm text-text-secondary">
    {typeof item.variant === 'object'
      ? (item.variant as any).value ||
        (item.variant as any).name ||
        JSON.stringify(item.variant)
      : item.variant}
  </p>
)}

                          </div>
                        </td>
                        <td className="p-3 text-text-secondary text-center whitespace-nowrap">{formatVND(item.price || 0)}</td>
                        <td className="p-3 text-text-secondary text-center">{item.quantity || 1}</td>
                        <td className="p-3 text-text-secondary text-right whitespace-nowrap">{formatVND((item.price || 0) * (item.quantity || 1))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-text-secondary">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(() => {
              // Logic Loyalty: 
              // - Điểm tích = 10% giá trị đơn hàng / 1000 (1 point = 1,000 VND)
              // - Ví dụ: 1,000,000 VND → 100 points (tương đương 100,000 VND)
              // - Giá trị đơn hàng = subtotal - discount (nếu có)
              const rawSubtotal = Number(order.subtotal) || 0;
              const rawDiscount = Number(order.discount) || 0;

              // Điểm đã dùng (nếu backend có lưu) hoặc suy ra từ discount (1 point = 1,000 VND)
              const rawPointsUsed = Number((order as any).pointsUsed ?? 0);
              const inferredPointsFromDiscount =
                rawDiscount !== 0 ? Math.round(Math.abs(rawDiscount) / 1000) : 0;
              const pointsUsed = rawPointsUsed || inferredPointsFromDiscount;

              // Discount hiển thị: ưu tiên số tiền từ backend, nếu không có thì lấy theo pointsUsed
              const displayDiscount =
                rawDiscount !== 0
                  ? `-${formatVND(Math.abs(rawDiscount))}`
                  : pointsUsed > 0
                    ? `-${formatVND(pointsUsed * 1000)}`
                    : formatVND(0);

              // Điểm tích được: (10% * total) / 1000, 1 point = 1,000 VND
              const orderTotal = Number(order.total) || 0;
              const calculatedPointsEarned = Math.floor((orderTotal * 0.1) / 1000); // 10% / 1000, 1 point = 1,000 VND

              // Nếu backend đã tính sẵn pointsEarned thì ưu tiên dùng, ngược lại dùng công thức trên
              const rawPointsEarned = Number((order as any).pointsEarned ?? 0);
              const effectivePointsEarned = rawPointsEarned || calculatedPointsEarned;

              return (
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal:</span>
                    <span className="text-text-primary font-medium whitespace-nowrap">
                      {formatVND(rawSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Loyalty Points Used:</span>
                    <span className="text-text-primary font-medium">
                      {pointsUsed} points
                      {pointsUsed > 0 && (
                        <span className="text-xs text-text-secondary ml-2 whitespace-nowrap">
                          (giảm {formatVND(pointsUsed * 1000)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Discount:</span>
                    <span className="text-text-primary font-medium whitespace-nowrap">
                      {displayDiscount}
                      {pointsUsed > 0 && (
                        <span className="text-xs text-text-secondary ml-2">
                          (từ {pointsUsed} points)
                        </span>
                      )}
                    </span>
                  </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping Fee:</span>
                <span className="text-text-primary font-medium whitespace-nowrap">
                  {formatVND(order.shippingFee || 0)}
                </span>
              </div>
                  <div className="flex justify-between pt-2 border-t border-gray-700 font-bold text-lg">
                    <span className="text-text-primary font-semibold">Total:</span>
                    <span className="text-text-primary font-medium whitespace-nowrap">
                      {formatVND(order.total || 0)}
                    </span>
                  </div>
                  {/* Points Earned – chỉ hiển thị khi đơn hàng thành công (delivered) */}
                  {order.status &&
                    String(order.status).toLowerCase() === 'delivered' && (
                      <div className="flex justify-between pt-2 border-t border-gray-700 mt-2">
                        <span className="text-text-secondary">Points Earned:</span>
                        <span className="text-green-400 font-medium">
                          +{effectivePointsEarned.toLocaleString('vi-VN')} points
                          {effectivePointsEarned > 0 && (
                            <span className="text-xs text-text-secondary ml-2 whitespace-nowrap">
                              (trị giá {formatVND(effectivePointsEarned * 1000)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                </div>
              );
            })()}
          </div>

          {/* Shipping Activity */}
          <div className="bg-background-light p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Shipping activity</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {shippingActivity.length} {shippingActivity.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
              <button
                onClick={() => handleOpenEditModal(null)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                Add Activity
              </button>
            </div>
            <div className="relative pl-8">
              {/* Vertical line */}
              <div className={`absolute left-[14px] top-0 bottom-0 w-0.5 transition-colors ${
                shippingActivity.length > 0 
                  ? 'bg-gradient-to-b from-primary via-primary/50 to-gray-700' 
                  : 'bg-gray-700'
              }`}></div>
              
              {shippingActivity.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background-dark mb-4">
                    <CheckCircle2 size={24} className="text-gray-600" />
                  </div>
                  <p className="text-base font-medium">No shipping activities yet</p>
                  <p className="text-sm mt-2 text-text-secondary/70">Click "Add Activity" to track order progress</p>
                </div>
              ) : (
                shippingActivity.map((activity, index) => {
                  const isLast = index === shippingActivity.length - 1;
                  
                  // Show tick for all activities that have a status
                  // If an activity has a status, it means it has occurred and should show tick
                  const shouldShowTick = Boolean(activity.status);
                  
                  return (
                    <div key={index} className="relative mb-6 last:mb-0 group">
                  {/* Circle marker */}
                      <div className={`absolute -left-10 top-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        shouldShowTick 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/50' 
                          : 'bg-background-dark border-gray-600'
                      }`}>
                        {shouldShowTick && (
                          <CheckCircle2 size={16} className="text-white" strokeWidth={2.5} />
                        )}
                      </div>
                      
                      {/* Activity Card */}
                      <div className="bg-background-dark rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-all group-hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                color={getOrderStatusColor(activity.status)}
                              >
                                {activity.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-text-primary leading-relaxed mb-2">
                              {activity.description}
                            </p>
                            {(activity.date || activity.time) && (
                              <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <Calendar size={12} />
                                <span>
                                  {activity.date} {activity.time}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 transition-opacity ${
                            shippingActivity.length === 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(index);
                              }}
                              className="p-2 text-text-secondary hover:text-primary hover:bg-background-light rounded-lg transition-colors"
                              title="Edit activity"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteActivity(index);
                              }}
                              className="p-2 text-text-secondary hover:text-red-400 hover:bg-background-light rounded-lg transition-colors"
                              title="Delete activity"
                              disabled={saving}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Edit Activity Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
              <div className="bg-background-light rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-text-primary">
                    {editingIndex !== null ? 'Edit Activity' : 'Add Activity'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Status <span className="text-red-400">*</span>
                    </label>
                    <div className="relative" ref={statusDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setStatusDropdownOpen((prev) => !prev)}
                        className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between hover:bg-background-dark/80 transition-colors"
                      >
                        <span className={formData.status ? 'text-text-primary' : 'text-text-secondary'}>
                          {formData.status 
                            ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1)
                            : 'Select status'}
                        </span>
                        <ChevronDown 
                          size={16} 
                          className={`text-text-secondary transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {statusDropdownOpen && (
                        <div className="absolute z-50 mt-2 w-full bg-background-dark border border-gray-600 rounded-lg shadow-xl overflow-hidden">
                          <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                            {ORDER_STATUSES.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, status });
                                  setStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                  formData.status === status
                                    ? 'bg-primary/20 text-primary font-semibold'
                                    : 'text-text-primary hover:bg-background-light/50'
                                }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                      placeholder="Activity description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Date
                      </label>
                      <input
                        type="text"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                        placeholder="e.g., Dec 25, 2024"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Time
                      </label>
                      <input
                        type="text"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                        placeholder="e.g., 10:30 AM"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="completed"
                      checked={formData.completed}
                      onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-dark text-primary focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="completed" className="text-sm text-text-secondary">
                      Mark as completed
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-background-dark border border-gray-600 rounded-lg text-text-primary hover:bg-background-dark/80 hover:border-gray-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveActivity}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingIndex !== null ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Side Info */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-background-light p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-text-primary mb-4">Customer details</h2>
            <div className="flex flex-col items-center mb-4">
              <img 
                src={getAvatarUrl(
                  order.customer?.email ? String(order.customer.email).toLowerCase().trim() : undefined,
                  order.customer?._id || order.customer?.id,
                  order.customer?.avatarUrl || order.customer?.avatar, // Use same approach as customer component
                  80
                )} 
                alt={order.customer?.name || 'Customer'} 
                className="w-20 h-20 rounded-xl mb-3"
              />
              <p className="font-bold text-text-primary">{order.customer?.name || customerData?.fullName || customerData?.name || 'Customer'}</p>
              {(customerData?._id || customerData?.id || order.customer?.id || order.customer?._id || (order as any)?.customerId) && (
                <p className="text-sm text-text-secondary">Customer ID: {getCustomerDisplayCode(customerData?._id || customerData?.id || (order as any)?.customerId || order.customer?.id || order.customer?._id)}</p>
              )}
              {!!order.customer?.totalOrders && (
                <div className="flex items-center gap-2 mt-2 text-text-secondary">
                  <ShoppingCart size={16} />
                  <span className="text-sm">{order.customer.totalOrders} Orders</span>
                </div>
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-text-secondary mb-1">Email:</p>
                <p className="text-text-primary">{order.customer?.email || '-'}</p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Mobile:</p>
                <p className="text-text-primary">{order.customer?.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-background-light p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-text-primary mb-4">Shipping address</h2>
            <div className="text-sm text-text-secondary leading-relaxed">
              {shippingLines.length > 0 ? (
                shippingLines.map((ln, i) => (
                  <p key={i}>{ln}</p>
                ))
              ) : (
                <p>-</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-background-light p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-text-primary mb-1">Payment</h2>
            {(() => {
              const rawPm: any =
                (order as any).paymentMethod !== undefined
                  ? (order as any).paymentMethod
                  : order.paymentMethod;

              // Chuẩn hoá type từ dữ liệu thực tế trong Mongo
              let pmType = '';
              if (typeof rawPm === 'string') {
                pmType = rawPm.toLowerCase();
              } else if (rawPm?.type) {
                pmType = String(rawPm.type).toLowerCase();
              } else if ((order as any).paymentType) {
                pmType = String((order as any).paymentType).toLowerCase();
              }

              // Map ra label dễ đọc
              const typeLabelMap: Record<string, string> = {
                cod: 'Cash on delivery',
                cash: 'Cash',
                vnpay: 'VNPay / Internet Banking',
                momo: 'MoMo',
                zalopay: 'ZaloPay',
                paypal: 'PayPal',
                card: 'Card',
                credit: 'Credit card',
                debit: 'Debit card',
                bank: 'Bank transfer',
                banking: 'Bank transfer',
                transfer: 'Bank transfer',
              };

              const normalizedType = pmType || (typeof rawPm === 'string' ? rawPm.toLowerCase() : '');
              const displayLabel =
                (normalizedType && typeLabelMap[normalizedType]) ||
                (normalizedType ? normalizedType.toUpperCase() : '-');

              const pm = typeof rawPm === 'string' ? { type: normalizedType } : rawPm || {};

              return (
                <div className="space-y-1 text-sm text-text-secondary">
                  <p>
                    Method:{' '}
                    <span className="text-text-primary">
                      {displayLabel}
                    </span>
                  </p>

                  {/* Thông tin chi tiết thêm cho một số loại thanh toán nếu có dữ liệu */}
                  {['bank', 'banking', 'transfer'].includes(normalizedType) && (
                    <>
                      <p>
                        Linked Bank:{' '}
                        <span className="text-text-primary">{pm.provider || pm.bankName || '-'}</span>
                      </p>
                      <p>
                        Account / Card:{' '}
                        <span className="text-text-primary">
                          {pm.last4 ? `******${pm.last4}` : pm.accountNumber || '-'}
                        </span>
                      </p>
                    </>
                  )}

                  {['card', 'credit', 'debit'].includes(normalizedType) && (
                    <>
                      <p>
                        Brand:{' '}
                        <span className="text-text-primary">{pm.brand || '-'}</span>
                      </p>
                      <p>
                        Card Number:{' '}
                        <span className="text-text-primary">
                          {pm.last4 ? `******${pm.last4}` : '-'}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
