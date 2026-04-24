import React from 'react';
import Badge from 'pages/Admin/components/Badge';
import { CreditCard, Banknote, Smartphone, Building2, Wallet } from 'lucide-react';
import { formatVND } from 'utils/currency';
import { getAvatarUrl } from 'utils/avatar';
import { getOrderStatusColor, getPaymentStatusColor } from 'utils/statusColors';

import { getOrderDisplayCode } from 'utils/orderDisplayCode';

const getDisplayCode = (order: any) => getOrderDisplayCode(order);

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

const paymentStatusFrom = (paymentStatus: string | null | undefined): string => {
  if (!paymentStatus) return 'Pending';
  return String(paymentStatus).charAt(0).toUpperCase() + String(paymentStatus).slice(1).toLowerCase();
};

type OrdersPlacedTableProps = {
  orders: any[];
  searchOrder: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOrderClick?: (orderId: string, orderData?: any) => void;
  onDeleteOrder?: (orderId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: string) => void;
};

const OrdersPlacedTable: React.FC<OrdersPlacedTableProps> = ({
  orders,
  searchOrder,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  onOrderClick,
  onDeleteOrder,
  onUpdateOrderStatus,
}) => {
  const ITEMS_PER_PAGE = 6;

  const handleDelete = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const orderId = String(order.id || order._id);
    if (window.confirm(`Are you sure you want to delete order ${getDisplayCode(order)}?`)) {
      if (onDeleteOrder) {
        onDeleteOrder(orderId);
      }
    }
  };

  return (
    <div className="bg-background-light p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-text-primary">Orders placed</h4>
        <input
          type="text"
          placeholder="Search order"
          value={searchOrder}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onPageChange(1);
          }}
          className="bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="border-b border-gray-700 text-sm text-text-secondary">
              <th className="p-3 w-12 text-center">
                <input 
                  type="checkbox" 
                  aria-label="Select all orders"
                  className="rounded border-gray-600 bg-background-dark cursor-pointer"
                />
              </th>
              <th className="p-3 w-32 text-center">ORDER</th>
              <th className="p-3 w-48 text-left pl-4">DATE</th>
              <th className="p-3 w-36 text-center">ORDER STATUS</th>
              <th className="p-3 w-36 text-center">PAYMENT STATUS</th>
              <th className="p-3 w-32 text-center">METHOD</th>
              <th className="p-3 w-40 text-center">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-text-secondary">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const orderId = String(o.id || o._id);
                return (
                  <tr
                    key={orderId}
                    className="border-b border-gray-700 shadow-none transition-none hover:opacity-100 hover:bg-transparent cursor-pointer"
                    onClick={() => {
                      if (onOrderClick) {
                        onOrderClick(orderId, o);
                      }
                    }}
                    style={{
                      transition: 'none !important',
                      boxShadow: 'none !important',
                      WebkitTransition: 'none !important',
                      MozTransition: 'none !important',
                      OTransition: 'none !important',
                    }}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-600 bg-background-dark cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-primary">
                        {getDisplayCode(o)}
                      </span>
                    </td>
                    <td className="p-3 w-48 text-left pl-4 text-text-secondary">
                      <span className="text-sm whitespace-nowrap">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <Badge color={getOrderStatusColor(o.status || 'Processing')}>
                          {(() => {
                            const status = o.status || 'Processing';
                            return String(status)
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ');
                          })()}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <Badge color={getPaymentStatusColor(paymentStatusFrom(o.paymentStatus || o.status))}>
                          {paymentStatusFrom(o.paymentStatus || o.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center relative group">
                        {(() => {
                          const Icon = getPaymentMethodIcon(o.paymentMethod);
                          const colorClass = getPaymentMethodColor(o.paymentMethod);
                          const label = getPaymentMethodLabel(o.paymentMethod);
                          return (
                            <>
                              <Icon size={20} className={colorClass} />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none shadow-none transition-none z-10 border border-gray-700"
                                style={{
                                  transition: 'none !important',
                                  boxShadow: 'none !important',
                                  WebkitTransition: 'none !important',
                                  MozTransition: 'none !important',
                                  OTransition: 'none !important',
                                }}
                              >
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
                    <td className="p-3 text-center">
                      <span className="text-sm text-text-secondary">
                        {formatVND(Number(o.total) || 0)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-text-secondary">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, orders.length)} of {orders.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded text-text-secondary shadow-none transition-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                if (currentPage !== 1) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
                }
              }}
            >
              «
            </button>
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded text-text-secondary shadow-none transition-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                if (currentPage !== 1) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
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
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 rounded shadow-none transition-none ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary'
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
              <span className="px-2 text-text-secondary">...</span>
            )}
            {totalPages > 5 && (
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 rounded text-text-secondary shadow-none transition-none"
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
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded text-text-secondary shadow-none transition-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                if (currentPage !== totalPages) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
                }
              }}
            >
              ›
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded text-text-secondary shadow-none transition-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                if (currentPage !== totalPages) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(156, 163, 175)';
                }
              }}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPlacedTable;

