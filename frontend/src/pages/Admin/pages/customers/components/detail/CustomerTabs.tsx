import React from 'react';
import { User, MapPin } from 'lucide-react';
import OverviewCards from './overview/OverviewCards';
import OrdersPlacedTable from './overview/OrdersPlacedTable';
import AddressBillingTab from './AddressBillingTab';

type CustomerTabsProps = {
  activeTab: 'Overview' | 'Address & Billing';
  onTabChange: (tab: 'Overview' | 'Address & Billing') => void;
  orders: any[];
  allOrders?: any[];
  searchOrder: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOrderClick?: (orderId: string, orderData?: any) => void;
  onDeleteOrder?: (orderId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: string) => void;
  customer?: any;
  onCustomerUpdate?: (updatedCustomer: any) => void;
};

const CustomerTabs: React.FC<CustomerTabsProps> = ({
  activeTab,
  onTabChange,
  orders,
  allOrders = [],
  searchOrder,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  onOrderClick,
  onDeleteOrder,
  onUpdateOrderStatus,
  customer,
  onCustomerUpdate,
}) => {
  return (
    <>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        {(['Overview', 'Address & Billing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary'
            }`}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              msTransition: 'none !important',
              backgroundColor: 'transparent !important',
              opacity: '1 !important',
              transform: 'none !important',
              WebkitTransform: 'none !important',
              MozTransform: 'none !important',
              OTransform: 'none !important',
              msTransform: 'none !important',
              color: activeTab === tab ? '#7c3aed' : 'rgb(156, 163, 175)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.setProperty('transition', 'none', 'important');
              e.currentTarget.style.setProperty('box-shadow', 'none', 'important');
              e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
              e.currentTarget.style.setProperty('opacity', '1', 'important');
              e.currentTarget.style.setProperty('transform', 'none', 'important');
              e.currentTarget.style.setProperty('color', activeTab === tab ? '#7c3aed' : 'rgb(156, 163, 175)', 'important');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.setProperty('transition', 'none', 'important');
              e.currentTarget.style.setProperty('box-shadow', 'none', 'important');
              e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
              e.currentTarget.style.setProperty('opacity', '1', 'important');
              e.currentTarget.style.setProperty('transform', 'none', 'important');
              e.currentTarget.style.setProperty('color', activeTab === tab ? '#7c3aed' : 'rgb(156, 163, 175)', 'important');
            }}
          >
            <div
              className="flex items-center gap-2"
              style={{
                transition: 'none !important',
                boxShadow: 'none !important',
                WebkitTransition: 'none !important',
                MozTransition: 'none !important',
                OTransition: 'none !important',
                msTransition: 'none !important',
                transform: 'none !important',
                WebkitTransform: 'none !important',
                MozTransform: 'none !important',
                OTransform: 'none !important',
                msTransform: 'none !important',
              }}
            >
              {tab === 'Overview' && <User size={16} />}
              {tab === 'Address & Billing' && <MapPin size={16} />}
              {tab}
            </div>
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <>
          <OverviewCards customer={customer} orders={allOrders} onOrderClick={onOrderClick} />
          <OrdersPlacedTable
            orders={orders}
            searchOrder={searchOrder}
            onSearchChange={onSearchChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onOrderClick={onOrderClick}
            onDeleteOrder={onDeleteOrder}
            onUpdateOrderStatus={onUpdateOrderStatus}
          />
        </>
      )}

      {activeTab === 'Address & Billing' && (
        <AddressBillingTab customer={customer} onCustomerUpdate={onCustomerUpdate} />
      )}
    </>
  );
};

export default CustomerTabs;

