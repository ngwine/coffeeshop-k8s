import React, { useEffect, useState } from 'react';
import { fetchOrders } from '../../../../api/orders';
import { fetchCustomerById } from '../../../../api/customers';
import { OrderStatus } from '../../types';
import Badge from '../../components/Badge';
import { Calendar, CheckCircle, Wallet, AlertCircle, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import { formatVND } from '../../../../utils/currency';
import { getAvatarUrl } from '../../../../utils/avatar';
import { getOrderStatusColor, getPaymentStatusColor } from '../../../../utils/statusColors';
import { getOrderDisplayCode, getOrderDisplayCodeRaw } from '../../../../utils/orderDisplayCode';
import ExportDropdown from '../../../../components/ExportDropdown';
import { exportRows, ExportColumn, ExportFormat } from '../../../../utils/exportUtils';

interface OrderListProps {
  onOrderClick: (orderId: string, orderData?: any) => void;
}

const ITEMS_PER_PAGE = 10;

type OrderExportRow = {
  orderCode: string;
  date: string;
  customer: string;
  email: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string;
};

const ORDER_EXPORT_COLUMNS: ExportColumn<OrderExportRow>[] = [
  { key: 'orderCode', label: 'Order' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'total', label: 'Total' },
];

const OrderList: React.FC<OrderListProps> = ({ onOrderClick }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, { email?: string; _id?: string; id?: string; avatarUrl?: string }>>({});
  const [stats, setStats] = useState({ pendingCount: 0, completedCount: 0, refundedCount: 0, failedCount: 0 });


  const getPaymentMethodIcon = (paymentMethod: any) => {
    if (!paymentMethod) return Wallet;
    
    let methodType = '';
    if (typeof paymentMethod === 'string') {
      methodType = paymentMethod.toLowerCase();
    } else if (paymentMethod?.type) {
      methodType = String(paymentMethod.type).toLowerCase();
    }
    
    switch (methodType) {
      case 'cod':
      case 'cash':
        return Banknote;
      case 'card':
      case 'credit':
      case 'debit':
        return CreditCard;
      case 'vnpay':
      case 'momo':
      case 'zalopay':
      case 'paypal':
        return Smartphone;
      case 'bank':
      case 'banking':
      case 'transfer':
        return Building2;
      default:
        return Wallet;
    }
  };

  const getPaymentMethodColor = (paymentMethod: any) => {
    if (!paymentMethod) return 'text-gray-400';
    
    let methodType = '';
    if (typeof paymentMethod === 'string') {
      methodType = paymentMethod.toLowerCase();
    } else if (paymentMethod?.type) {
      methodType = String(paymentMethod.type).toLowerCase();
    }
    
    switch (methodType) {
      case 'cod':
      case 'cash':
        return 'text-green-400';
      case 'card':
      case 'credit':
      case 'debit':
        return 'text-blue-400';
      case 'vnpay':
        return 'text-blue-500';
      case 'momo':
        return 'text-pink-400';
      case 'zalopay':
        return 'text-cyan-400';
      case 'paypal':
        return 'text-indigo-400';
      case 'bank':
      case 'banking':
      case 'transfer':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPaymentMethodLabel = (paymentMethod: any) => {
    if (!paymentMethod) return 'COD';
    
    if (typeof paymentMethod === 'string') {
      const methodMap: { [key: string]: string } = {
        'cod': 'COD',
        'vnpay': 'VNPay',
        'momo': 'MoMo',
        'zalopay': 'ZaloPay',
        'card': 'Card',
        'bank': 'Bank',
        'cash': 'Cash'
      };
      return methodMap[paymentMethod.toLowerCase()] || paymentMethod.toUpperCase();
    }
    
    if (paymentMethod?.type) {
      return String(paymentMethod.type).toUpperCase();
    }
    
    return 'COD';
  };

  // Import shared utility for order display code
  const getDisplayCode = (order: any) => getOrderDisplayCode(order);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Send search query directly - simple like CustomerList
        // Only send q if searchQuery is not empty
        const searchParam = searchQuery.trim();
        const res = await fetchOrders({ 
          q: searchParam || undefined,
          page: currentPage, 
          limit: itemsPerPage 
        } as any);
        const items = res?.data || res?.items || [];
        const totalCount = res?.pagination?.total ?? res?.total ?? items.length;
        
        if (!cancelled) {
          setRows(items);
          setTotal(totalCount);
          
          // Fetch customer data for all unique customer emails/IDs to get avatarUrl
          const uniqueCustomers = new Set<string>();
          items.forEach((order: any) => {
            const email = order.customerEmail ? String(order.customerEmail).toLowerCase().trim() : null;
            const cid = order.customerId ? (typeof order.customerId === 'object' ? (order.customerId._id || order.customerId.id) : String(order.customerId)) : null;
            if (email) uniqueCustomers.add(email);
            if (cid) uniqueCustomers.add(cid);
          });
          
          // Fetch all unique customers in parallel
          const customerPromises = Array.from(uniqueCustomers).map(async (key) => {
            try {
              const cres = await fetchCustomerById(key);
              const c = cres?.data || cres;
              if (c && !cancelled) {
                return {
                  key: key.toLowerCase(),
                  email: c.email ? String(c.email).toLowerCase().trim() : null,
                  _id: c._id || c.id,
                  id: c.id || c._id,
                  avatarUrl: c.avatarUrl,
                };
              }
            } catch (e) {
              // Ignore errors for individual customer fetches
            }
            return null;
          });
          
          const customerResults = await Promise.all(customerPromises);
          const newCustomerMap: Record<string, { email?: string; _id?: string; id?: string; avatarUrl?: string }> = {};
          customerResults.forEach((result) => {
            if (result) {
              // Map by email
              if (result.email) {
                newCustomerMap[result.email] = result;
              }
              // Map by id
              if (result._id) {
                newCustomerMap[result._id] = result;
              }
              if (result.id && result.id !== result._id) {
                newCustomerMap[result.id] = result;
              }
            }
          });
          
          if (!cancelled) {
            setCustomerMap(newCustomerMap);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [currentPage, itemsPerPage, searchQuery]);

  // Fetch stats from all orders (separate from paginated data)
  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        // Fetch all orders for stats (use large limit to get all)
        const res = await fetchOrders({ 
          limit: 10000, // Large limit to get all orders for stats
          includeItems: false // Don't need items for stats
        } as any);
        const allItems = res?.data || res?.items || [];
        
        // Calculate stats based on order status
        const newStats = {
          pendingCount: allItems.filter((o: any) => getOrderStatusCategory(o.status) === 'Pending').length,
          completedCount: allItems.filter((o: any) => getOrderStatusCategory(o.status) === 'Delivered').length,
          refundedCount: allItems.filter((o: any) => getOrderStatusCategory(o.status) === 'Refunded').length,
          failedCount: allItems.filter((o: any) => getOrderStatusCategory(o.status) === 'Cancelled').length,
        };
        
        if (!cancelled) {
          setStats(newStats);
        }
      } catch (e) {
        // Ignore errors for stats
      }
    };
    
    fetchStats();
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => { 
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Map order status to stats category
  const getOrderStatusCategory = (orderStatus?: string): 'Pending' | 'Delivered' | 'Refunded' | 'Cancelled' => {
    if (!orderStatus) return 'Pending';
    const s = orderStatus.toLowerCase().trim();

    // Delivered: delivered, shipped
    if (['delivered', 'shipped'].includes(s)) {
      return 'Delivered';
    }

    // Refunded: refunded, returned
    if (['refunded', 'returned'].includes(s)) {
      return 'Refunded';
    }

    // Cancelled: cancelled, canceled, failed
    if (['cancelled', 'canceled', 'failed'].includes(s)) {
      return 'Cancelled';
    }

    // Pending: pending, processing, ready to pickup, dispatched, out for delivery, and any other status
    return 'Pending';
  };

  const paymentStatusFrom = (status?: string) => {
    if (!status) return 'Pending';
    const s = status.toLowerCase();
    if (['paid', 'delivered', 'shipped', 'processing'].includes(s)) return 'Paid';
    if (['pending', 'created'].includes(s)) return 'Pending';
    if (['refunded'].includes(s)) return 'Refunded';
    if (['failed', 'cancelled', 'canceled'].includes(s)) return 'Failed';
    return 'Pending';
  };

  const formatOrderStatusText = (status?: string) => {
    const value = status || 'Processing';
    return value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatOrderDate = (date?: string) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return '';
    }
  };

  // Use rows directly from API (server-side pagination and filtering)
  const totalPages = Math.ceil(total / itemsPerPage);
  const paginatedRows = rows;

  // Calculate selection state based on paginated rows
  const pageOrderIds = paginatedRows.map((order) => String(order.id || order._id)).filter(Boolean);
  const allChecked = pageOrderIds.length > 0 && pageOrderIds.every((id) => selectedIds.includes(id));
  const noneChecked = selectedIds.length === 0;

  // Toggle all orders on current page
  const toggleAll = () => {
    setSelectedIds((prev) =>
      allChecked
        ? prev.filter((id) => !pageOrderIds.includes(id))
        : [...prev, ...pageOrderIds.filter((id) => !prev.includes(id))]
    );
  };

  // Toggle single order
  const toggleOne = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const buildOrderExportRows = (): OrderExportRow[] => {
    if (!selectedIds.length) return [];
    const selectedSet = new Set(selectedIds);
    return rows
      .filter((order) => selectedSet.has(String(order.id || order._id)))
      .map((order) => ({
        orderCode: getDisplayCode(order),
        date: formatOrderDate(order.createdAt),
        customer: order.customerName || order.customerEmail?.split('@')[0]?.replace(/\./g, ' ') || 'Customer',
        email: order.customerEmail || '',
        status: formatOrderStatusText(order.status),
        paymentStatus: paymentStatusFrom(order.paymentStatus || order.status),
        paymentMethod: getPaymentMethodLabel(order.paymentMethod),
        total: formatVND(Number(order.total) || 0),
      }));
  };

  const handleExport = (format: ExportFormat) => {
    const exportRowsData = buildOrderExportRows();
    if (!exportRowsData.length) {
      alert('Please select at least one order to export.');
      return;
    }
    exportRows(exportRowsData, ORDER_EXPORT_COLUMNS, format, 'orders');
  };

  const displayStartIndex = total > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const displayEndIndex = Math.min(currentPage * itemsPerPage, total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-background-light p-3 md:p-4 rounded-lg flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-text-primary">{stats.pendingCount}</p>
            <p className="text-xs md:text-sm text-text-secondary md:text-base">Pending</p>
          </div>
        </div>
        <div className="bg-background-light p-3 md:p-4 rounded-lg flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-green-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-text-primary">{stats.completedCount}</p>
            <p className="text-xs md:text-sm md:text-base text-text-secondary">Delivered</p>
          </div>
        </div>
        <div className="bg-background-light p-3 md:p-4 rounded-lg flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-gray-500/20 rounded-lg">
            <Wallet className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-text-primary">{stats.refundedCount}</p>
            <p className="text-xs md:text-sm md:text-base text-text-secondary">Refunded</p>
          </div>
        </div>
        <div className="bg-background-light p-3 md:p-4 rounded-lg flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-text-primary">{stats.failedCount}</p>
            <p className="text-xs md:text-sm md:text-base text-text-secondary">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-background-light p-4 md:p-6 rounded-lg shadow-lg">
        <div className="flex flex-row items-center mb-4 md:mb-6 gap-3 md:gap-4 w-full min-w-0">
          {/* Hàng search + Export: desktop 1 hàng, màn nhỏ có thể xuống dòng để dropdown không bị ẩn */}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3 w-full md:w-auto min-w-0 max-w-full overflow-visible">
            <input
            type="text"
            placeholder="Search Order"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            onKeyDown={(e) => {
              // Allow Enter key to trigger search (already handled by useEffect)
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="bg-background-dark border border-gray-600 rounded-lg px-3 md:px-4 py-1.5 md:py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary text-sm md:text-base w-full sm:w-64 md:w-72 min-w-[200px] max-w-full"
          />
            <div className="flex items-center gap-3 flex-shrink-0">
              <ExportDropdown disabled={noneChecked} onExport={handleExport} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 md:mx-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left min-w-[1200px]">
            <thead>
              <tr className="border-b border-gray-700 text-xs md:text-sm text-text-secondary">
                <th className="p-2 md:p-3 w-10 md:w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={allChecked} 
                    onChange={toggleAll} 
                    aria-label="Select all orders"
                    className="rounded border-gray-600 bg-background-dark cursor-pointer"
                  />
                </th>
                <th className="p-2 md:p-3 min-w-[80px] text-center">ORDER</th>
                <th className="p-2 md:p-3 min-w-[120px] text-left pl-2 md:pl-4">DATE</th>
                <th className="p-2 md:p-3 min-w-[180px] text-left pl-2 md:pl-4 pr-2 md:pr-4">CUSTOMERS</th>
                <th className="p-2 md:p-3 min-w-[100px] text-center">ORDER STATUS</th>
                <th className="p-2 md:p-3 min-w-[100px] text-center">PAYMENT STATUS</th>
                <th className="p-2 md:p-3 min-w-[60px] text-center">METHOD</th>
                <th className="p-2 md:p-3 min-w-[100px] text-center">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="p-3 text-text-secondary text-center" colSpan={8}>Loading...</td></tr>
              )}
              {error && !loading && (
                <tr><td className="p-3 text-red-300 text-center" colSpan={8}>{error}</td></tr>
              )}
              {!loading && paginatedRows.length === 0 && (
                <tr><td className="p-3 text-text-secondary text-center" colSpan={8}>No orders found</td></tr>
              )}
              {!loading && paginatedRows.map((order) => {
                const orderId = order.id || order._id;
                if (!orderId) {
                  return null;
                }
                const orderIdStr = String(orderId);
                const isChecked = selectedIds.includes(orderIdStr);
                return (
                <tr
                  key={orderIdStr}
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (orderIdStr) {
                      onOrderClick(orderIdStr, order);
                    }
                  }}
                >
                  <td className="p-2 md:p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleOne(orderIdStr)}
                      className="rounded border-gray-600 bg-background-dark cursor-pointer"
                    />
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <span className="font-semibold text-primary text-xs md:text-sm">
                      {getDisplayCode(order)}
                    </span>
                  </td>
                  <td className="p-2 md:p-3 text-left pl-2 md:pl-4 text-text-secondary">
                    <span className="text-xs md:text-sm whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </span>
                  </td>
                  <td className="p-2 md:p-3 text-left pl-2 md:pl-4 pr-2 md:pr-4">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        {(() => {
                          // Get customer data from map - same approach as customer component
                          const normalizedEmail = order.customerEmail ? String(order.customerEmail).toLowerCase().trim() : null;
                          const cid = order.customerId ? (typeof order.customerId === 'object' ? (order.customerId._id || order.customerId.id) : String(order.customerId)) : null;
                          const customerData = normalizedEmail ? customerMap[normalizedEmail] : (cid ? customerMap[cid] : null);
                          
                          // Use same approach as customer component: email, _id || id, avatarUrl || avatar
                          return (
                            <img
                              src={getAvatarUrl(
                                customerData?.email || normalizedEmail,
                                customerData?._id || customerData?.id || cid,
                                customerData?.avatarUrl,
                                40
                              )}
                              alt={order.customerEmail || 'Customer'}
                              className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                            />
                          );
                        })()}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="font-medium text-text-secondary truncate text-xs md:text-sm">{order.customerName || order.customerEmail?.split('@')[0]?.replace(/\./g, ' ') || 'Customer'}</p>
                        <p className="text-xs md:text-sm text-text-secondary truncate">{order.customerEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <div className="flex justify-center">
                      <Badge color={getOrderStatusColor(order.status || 'Processing')}>
                        <span className="text-xs md:text-sm">{formatOrderStatusText(order.status)}</span>
                      </Badge>
                    </div>
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <div className="flex justify-center">
                      <Badge color={getPaymentStatusColor(paymentStatusFrom(order.paymentStatus || order.status))}>
                        <span className="text-xs md:text-sm">{paymentStatusFrom(order.paymentStatus || order.status)}</span>
                      </Badge>
                    </div>
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <div className="flex items-center justify-center relative group">
                      {(() => {
                        const Icon = getPaymentMethodIcon(order.paymentMethod);
                        const colorClass = getPaymentMethodColor(order.paymentMethod);
                        const label = getPaymentMethodLabel(order.paymentMethod);
                        return (
                          <>
                            <Icon size={18} className={colorClass} />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-gray-700">
                              {label}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-gray-800"></div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <span className="text-xs md:text-sm text-text-secondary font-medium whitespace-nowrap">
                      {formatVND(Number(order.total) || 0)}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 md:mt-6 gap-3 text-xs md:text-sm text-text-secondary">
            <p className="text-center sm:text-left">Showing {displayStartIndex} to {displayEndIndex} of {total} entries</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                «
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      isActive
                        ? 'bg-primary text-white'
                        : ''
                    }`}
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      WebkitTransition: 'none !important',
                      MozTransition: 'none !important',
                      OTransition: 'none !important',
                      backgroundColor: isActive ? 'rgb(124, 58, 237)' : 'transparent',
                      color: isActive ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = isActive ? 'rgb(124, 58, 237)' : 'transparent';
                      e.currentTarget.style.color = isActive ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transition = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = isActive ? 'rgb(124, 58, 237)' : 'transparent';
                      e.currentTarget.style.color = isActive ? 'rgb(255, 255, 255)' : 'rgb(156, 163, 175)';
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2">...</span>
              )}
              {totalPages > 5 && (
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-3 py-1 rounded-md"
                  style={{
                    transition: 'none !important',
                    boxShadow: 'none !important',
                    WebkitTransition: 'none !important',
                    MozTransition: 'none !important',
                    OTransition: 'none !important',
                    backgroundColor: 'transparent',
                    color: 'rgb(156, 163, 175)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgb(156, 163, 175)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgb(156, 163, 175)';
                  }}
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                ›
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  transition: 'none !important',
                  boxShadow: 'none !important',
                  WebkitTransition: 'none !important',
                  MozTransition: 'none !important',
                  OTransition: 'none !important',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.transition = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
