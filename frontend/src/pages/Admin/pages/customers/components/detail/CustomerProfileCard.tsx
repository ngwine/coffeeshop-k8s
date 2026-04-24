import React from 'react';
import Badge from '../../../../components/Badge';
import { ShoppingCart, DollarSign } from 'lucide-react';
import { formatVND } from '../../../../../../utils/currency';
import { normalizeCountry } from '../../constants/countries';
import { getCustomerCountry, formatMemberSinceDate, formatCustomerStatus } from '../../utils/helpers';

const getDisplayCode = (val: string | number | undefined | null) => {
  const s = String(val || '');
  if (!s) return '';
  const hex = s.replace(/[^a-fA-F0-9]/g, '') || s;
  const last4 = hex.slice(-4).padStart(4, '0');
  return `#${last4}`;
};

type CustomerProfileCardProps = {
  customer: any;
  stats: { ordersCount: number; totalSpent: number };
  primaryAddress: any;
  onEditDetails: () => void;
};

const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({
  customer,
  stats,
  primaryAddress,
  onEditDetails,
}) => {
  return (
    <div className="bg-background-light p-6 rounded-lg shadow-lg">
      <div className="flex flex-col items-center mb-6">
        <img
          src={customer?.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(customer?.email || '')}`}
          alt={customer?.fullName || 'Customer'}
          className="w-24 h-24 rounded-full object-cover mb-4"
        />
        <h3 className="text-xl font-bold text-text-primary">{customer?.fullName || 'Customer'}</h3>
        <p className="text-sm text-text-secondary">
          Customer ID {getDisplayCode(customer?._id || customer?.id)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background-dark p-4 rounded-lg text-center">
          <ShoppingCart className="w-5 h-5 text-text-secondary mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.ordersCount}</p>
          <p className="text-xs text-text-secondary">Orders</p>
        </div>
        <div className="bg-background-dark p-4 rounded-lg text-center">
          <DollarSign className="w-5 h-5 text-text-secondary mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{formatVND(stats.totalSpent)}</p>
          <p className="text-xs text-text-secondary">Spent</p>
        </div>
      </div>

      {/* Details Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-text-primary mb-4">Details</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Username:</span>
            <span className="text-text-primary">{customer?.email?.split('@')[0] || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Email:</span>
            <span className="text-text-primary">{customer?.email || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Status:</span>
            <Badge color={customer?.status === 'inactive' ? 'yellow' : customer?.status === 'banned' ? 'red' : 'green'}>
              {formatCustomerStatus(customer?.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Contact:</span>
            <span className="text-text-primary">{customer?.phone || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Country:</span>
            <span className="text-text-primary">
              {getCustomerCountry(customer, undefined, normalizeCountry) || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Member since:</span>
            <span className="text-text-primary">
              {formatMemberSinceDate(customer?.createdAt || customer?.joinedAt)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onEditDetails}
        className="w-full bg-primary text-white py-2 rounded-lg"
        style={{
          transition: 'none !important',
          boxShadow: 'none !important',
          WebkitTransition: 'none !important',
          MozTransition: 'none !important',
          OTransition: 'none !important',
          backgroundColor: '#7c3aed', // bg-primary
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transition = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = '#7c3aed'; 
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transition = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = '#7c3aed'; 
        }}
      >
        Edit Details
      </button>
    </div>
  );
};

export default CustomerProfileCard;

