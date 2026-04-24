import React from 'react';
import WishlistCard from './WishlistCard';
import AccountBalanceCard from './AccountBalanceCard';
import LoyaltyProgramCard from './LoyaltyProgramCard';

type OverviewCardsProps = {
  customer?: any;
  orders?: any[];
  onOrderClick?: (orderId: string, orderData?: any) => void;
};

const OverviewCards: React.FC<OverviewCardsProps> = ({ customer, orders = [], onOrderClick }) => {
  const loyalty = customer?.loyalty || {};
  const currentPoints = loyalty.currentPoints || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AccountBalanceCard currentPoints={currentPoints} />
      <LoyaltyProgramCard loyalty={loyalty} orders={orders} onOrderClick={onOrderClick} />
      <WishlistCard customer={customer} />
    </div>
  );
};

export default OverviewCards;

