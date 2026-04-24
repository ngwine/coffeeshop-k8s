import React from 'react';
import { DollarSign } from 'lucide-react';
import { formatVND } from 'utils/currency';

type AccountBalanceCardProps = {
  currentPoints?: number;
};

const AccountBalanceCard: React.FC<AccountBalanceCardProps> = ({ currentPoints = 0 }) => {
  const safePoints = Math.max(0, currentPoints);
  // 1 point = 1,000 VND
  const accountBalance = safePoints * 1000;

  return (
    <div className="bg-background-light p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-purple-400" />
        </div>
        <h4 className="text-base font-semibold text-text-primary">Account Balance</h4>
      </div>
      <p className="text-lg font-bold text-white mb-1">
        <span className="text-purple-400 whitespace-nowrap">{formatVND(accountBalance)}</span> Credit Left
      </p>
      <p className="text-xs text-text-secondary">
        Account balance for next purchase ({safePoints.toLocaleString('vi-VN')} points)
      </p>
    </div>
  );
};

export default AccountBalanceCard;

