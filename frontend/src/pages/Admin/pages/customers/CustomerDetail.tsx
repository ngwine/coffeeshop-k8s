import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCustomerById, fetchCustomerOrders, deleteCustomer } from '../../../../api/customers';
import { OrdersApi } from '../../../../api/orders';
import BackButton from '../../components/BackButton';
import CustomerProfileCard from './components/detail/CustomerProfileCard';
import CustomerTabs from './components/detail/CustomerTabs';
import EditUserInformationModal from './components/detail/EditUserInformationModal';
import { getOrderDisplayCode, getOrderDisplayCodeRaw } from '../../../../utils/orderDisplayCode';
import { formatVND } from '../../../../utils/currency';

// For customer ID display (not order)
const getDisplayCode = (val: string | number | undefined | null) => {
  const s = String(val || '');
  if (!s) return '';
  const hex = s.replace(/[^a-fA-F0-9]/g, '') || s;
  const last4 = hex.slice(-4).padStart(4, '0');
  return `#${last4}`;
};

type Props = {
  customerId: string | number | null;
  onBack: () => void;
  onOrderClick?: (orderId: string, orderData?: any) => void;
};

const CustomerDetail: React.FC<Props> = ({ customerId: propCustomerId, onBack, onOrderClick }) => {
  const { customerId: urlCustomerId } = useParams<{ customerId: string }>();
  const customerId = propCustomerId || urlCustomerId || null;


  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Address & Billing'>('Overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchOrder, setSearchOrder] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 6;
  const customerDisplayCode = customer ? getDisplayCode(customer._id || customer.id) : '';

  const primaryAddress = useMemo(() => {
    const arr: any[] = customer?.addresses || [];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const pick = (type: string) => arr.find((a: any) => (a.type || '').toLowerCase() === type && a.isDefault)
      || arr.find((a: any) => (a.type || '').toLowerCase() === type);
    const a = pick('shipping') || arr[0];
    if (!a) return null;
    return {
      street: [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
      city: a.city || '',
      state: a.district || '',
      zip: a.postalCode || '',
      country: a.country || ''
    };
  }, [customer]);

  // Calculate stats from orders - chỉ tính các đơn hàng đã thanh toán
  const stats = useMemo(() => {
    const ordersCount = orders.length;
    // Chỉ tính các đơn hàng có paymentStatus = 'paid'
    const totalSpent = orders
      .filter((o) => {
        const paymentStatus = String(o.paymentStatus || '').toLowerCase();
        return paymentStatus === 'paid';
      })
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return { ordersCount, totalSpent };
  }, [orders]);

  // Helper function to get display code for search (use shared utility)
  const getDisplayCodeForSearch = (order: any): string => {
    return getOrderDisplayCodeRaw(order);
  };

  // Filter and paginate orders - search by multiple fields (same logic as OrderList in admin panel)
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (searchOrder) {
      const searchTerm = searchOrder.trim().toLowerCase();
      // Remove "#" if user typed it - allow searching without "#"
      const cleanSearchTerm = searchTerm.replace(/^#+/, '');
      
      if (cleanSearchTerm) {
        // Search by multiple fields: displayCode, order ID, date, status, payment status, total
        filtered = orders.filter(o => {
          const displayCode = getDisplayCodeForSearch(o).toLowerCase();
          const orderId = String(o.id || o._id || '').toLowerCase();
          const date = o.createdAt ? new Date(o.createdAt).toLocaleString().toLowerCase() : '';
          const status = String(o.status || '').toLowerCase();
          const paymentStatus = String(o.paymentStatus || o.status || '').toLowerCase();
          const total = formatVND(Number(o.total) || 0).toLowerCase();
          
          // Check if search term matches any field
          return displayCode.includes(cleanSearchTerm) ||
                 orderId.includes(cleanSearchTerm) ||
                 date.includes(cleanSearchTerm) ||
                 status.includes(cleanSearchTerm) ||
                 paymentStatus.includes(cleanSearchTerm) ||
                 total.includes(cleanSearchTerm);
        });
        
        // Sort by createdAt descending (newest first) when searching
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }
    } else {
      // When not searching, sort by createdAt descending (newest first)
      filtered = [...orders].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return filtered;
  }, [orders, searchOrder]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchOrder]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!customerId && customerId !== 0) {
        setError('No customer ID provided');
        setCustomer(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Clean and validate customer ID
        const idStr = String(customerId).trim();
        if (!idStr) {
          throw new Error('Invalid customer ID');
        }
        
        const res = await fetchCustomerById(idStr);
        
        if (!cancelled) {
          // Check if response indicates success
          if (res?.success === false) {
            throw new Error(res?.message || 'Customer not found');
          }
          
          const cust = res?.data || res;
          if (!cust || (!cust._id && !cust.id)) {
            throw new Error('Customer not found');
          }
          
          setCustomer(cust);
          
          // Load orders - fetch more to ensure we have all orders for history mapping
          try {
            const o = await fetchCustomerOrders(idStr, { page: 1, limit: 1000 });
            const orderList = o?.data || o?.items || [];
            const ordersArray = Array.isArray(orderList) ? orderList : [];
            setOrders(ordersArray);
          } catch (e: any) {
            setOrders([]);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          const errorMessage = e?.response?.data?.message || e?.message || 'Failed to load customer';
          setError(errorMessage);
          setCustomer(null);
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [customerId]);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEditDetails = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveCustomer = async (updatedCustomer: any) => {
    // Update local customer state with updated data
    setCustomer(updatedCustomer);
    // Optionally refresh customer data from API
    try {
      const idStr = String(customerId).trim();
      const res = await fetchCustomerById(idStr);
      if (res?.success !== false) {
        const cust = res?.data || res;
        if (cust) {
          setCustomer(cust);
        }
      }
    } catch (e) {
      // If refresh fails, use the updated customer from modal
      setCustomer(updatedCustomer);
    }
  };


  const handleDeleteOrder = async (orderId: string) => {
    // Find order object to get displayCode
    const order = orders.find(o => String(o.id || o._id) === orderId);
    if (!order) {
      return;
    }
    if (!window.confirm(`Are you sure you want to delete order ${getOrderDisplayCode(order)}?`)) {
      return;
    }
    try {
      // TODO: Implement delete order API call
      // await deleteOrder(orderId);
      // Remove from local state
      setOrders(prev => prev.filter(o => String(o.id || o._id) !== orderId));
    } catch (error: any) {
      alert(error?.message || 'Failed to delete order');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await OrdersApi.updateStatus(orderId, newStatus);
      // Update local state
      setOrders(prev => prev.map(o => {
        const id = String(o.id || o._id);
        if (id === orderId) {
          return { ...o, status: newStatus };
        }
        return o;
      }));
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Failed to update order status');
    }
  };

  const handleDeleteCustomer = () => {
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!customer || isDeleting) return;

    const fallbackIdentifierList = (() => {
      const seen = new Set<string>();
      const add = (value?: string | number | null) => {
        if (value === undefined || value === null) return;
        const str = String(value).trim();
        if (!str) return;
        if (seen.has(str)) return;
        seen.add(str);
      };
      add(customer?._id);
      add(customer?.id);
      add(customerId);
      if (typeof customer?.email === 'string') {
        add(customer.email.trim().toLowerCase());
      }
      return Array.from(seen);
    })();

    if (fallbackIdentifierList.length === 0) {
      setDeleteError('Unable to identify this customer. Please refresh and try again.');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      let deleted = false;
      let lastError: any = null;

      for (const identifier of fallbackIdentifierList) {
        try {
          await deleteCustomer(identifier);
          deleted = true;
          break;
        } catch (error: any) {
          lastError = error;
          if (error?.status !== 404) {
            throw error;
          }
        }
      }

      if (!deleted) {
        throw lastError || new Error('Failed to delete customer');
      }

      setCustomer(null);
      setOrders([]);
      onBack?.();
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Failed to delete customer';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} className="w-fit" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {loading ? (
                <span className="inline-block h-7 w-48 bg-gray-700 rounded animate-pulse"></span>
              ) : customer?._id ? (
                `Customer ID ${getDisplayCode(customer._id)}`
              ) : (
                'Customer'
              )}
            </h2>
            <p className="text-sm text-text-secondary">
              {loading ? (
                <span className="inline-block h-4 w-32 bg-gray-700 rounded animate-pulse mt-1"></span>
              ) : customer?.createdAt ? (
                formatDate(customer.createdAt)
              ) : (
                '—'
              )}
            </p>
          </div>
        </div>
        {!loading && customer && (
          <button 
            className="px-4 py-2 rounded-lg bg-red-600 text-white shadow-none transition-none hover:opacity-100 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleDeleteCustomer}
            disabled={isDeleting}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Customer'}
          </button>
        )}
      </div>

      {loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Left Section - Skeleton */}
          <div className="space-y-6">
            <div className="bg-background-light p-6 rounded-lg shadow-lg">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-700 animate-pulse mb-4"></div>
                <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background-dark p-4 rounded-lg">
                  <div className="h-5 w-5 bg-gray-700 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-8 w-12 bg-gray-700 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-700 rounded mx-auto animate-pulse"></div>
                </div>
                <div className="bg-background-dark p-4 rounded-lg">
                  <div className="h-5 w-5 bg-gray-700 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-8 w-20 bg-gray-700 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-12 bg-gray-700 rounded mx-auto animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section - Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background-light p-6 rounded-lg">
              <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="p-6 rounded-lg bg-red-900/20 border border-red-700/50">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-200 mb-2">Customer not found</h3>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-primary text-white rounded-lg shadow-none transition-none hover:opacity-100 hover:bg-primary"
              style={{
                transition: 'none !important',
                boxShadow: 'none !important',
                WebkitTransition: 'none !important',
                MozTransition: 'none !important',
                OTransition: 'none !important',
              }}
            >
              Back to Customers
            </button>
          </div>
        </div>
      )}

      {customer && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Customer Profile */}
          <div className="space-y-6">
            <CustomerProfileCard
              customer={customer}
              stats={stats}
              primaryAddress={primaryAddress}
              onEditDetails={handleEditDetails}
            />
          </div>

          {/* Right Section - Overview and Orders */}
          <div className="lg:col-span-2 space-y-6">
            <CustomerTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              orders={paginatedOrders}
              allOrders={orders}
              searchOrder={searchOrder}
              onSearchChange={setSearchOrder}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onOrderClick={onOrderClick}
              onDeleteOrder={handleDeleteOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              customer={customer}
              onCustomerUpdate={handleSaveCustomer}
            />
          </div>
        </div>
      )}

      {/* Edit User Information Modal */}
      {customer && (
        <EditUserInformationModal
          customer={customer}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveCustomer}
        />
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-background-light rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-2">Delete customer</h3>
            <p className="text-text-secondary text-sm">
              Are you sure you want to delete customer {customerDisplayCode || 'this record'}? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-sm text-red-400 mt-3">{deleteError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 rounded-lg border border-gray-600 text-text-primary shadow-none transition-none hover:opacity-100 hover:bg-transparent disabled:opacity-50"
                disabled={isDeleting}
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white shadow-none transition-none hover:opacity-100 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                }}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
