import React from 'react';
import Badge from '../../../../components/Badge';
import { formatVND } from '../../../../../../utils/currency';
import { getDisplayCode, getCustomerCountry, formatMemberSinceDate, getMemberSinceDate, formatCustomerStatus } from '../../utils/helpers';
import { normalizeCountry } from '../../constants/countries';

type CustomerTableProps = {
  customers: any[];
  selectedIds: string[];
  orderStats: Record<string, { totalOrders: number; totalSpent: number; firstOrder?: string; country?: string }>;
  loading: boolean;
  error: string | null;
  allChecked: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onSelectCustomer: (id: string) => void;
};

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedIds,
  orderStats,
  loading,
  error,
  allChecked,
  onToggleAll,
  onToggleOne,
  onSelectCustomer,
}) => {
  return (
    <div className="overflow-x-auto w-full -mx-3 md:-mx-4 lg:-mx-6 px-3 md:px-4 lg:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <table className="w-full text-left min-w-[600px] sm:min-w-[700px] md:min-w-[800px]">
        <thead>
          <tr className="border-b border-gray-700 text-sm text-text-secondary">
            <th className="p-2 md:p-3 w-10 text-center">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={onToggleAll}
                aria-label="Select all customers"
                className="rounded border-gray-600 bg-background-dark cursor-pointer"
              />
            </th>
            <th className="p-2 md:p-3 min-w-[180px]">Customer</th>
            <th className="p-2 md:p-3 whitespace-nowrap hidden md:table-cell">Customer ID</th>
            <th className="p-2 md:p-3 whitespace-nowrap hidden lg:table-cell">Country</th>
            <th className="p-2 md:p-3 whitespace-nowrap">Status</th>
            <th className="p-2 md:p-3 text-center whitespace-nowrap">Total Orders</th>
            <th className="p-2 md:p-3 text-right whitespace-nowrap pl-4 md:pl-8">Total Spent</th>
            <th className="p-2 md:p-3 whitespace-nowrap pl-4 md:pl-8 hidden sm:table-cell">Member Since</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="p-3 text-text-secondary text-sm" colSpan={8}>
                Loading...
              </td>
            </tr>
          )}
          {error && !loading && (
            <tr>
              <td className="p-3 text-red-300 text-sm" colSpan={8}>
                {error}
              </td>
            </tr>
          )}
          {!loading &&
            !error &&
            customers.map((customer: any) => {
              const id = String(customer.id || customer._id);
              const stats = orderStats[(customer.email || '').toLowerCase()];
              const totalOrders = stats?.totalOrders ?? customer.totalOrders ?? customer.orderCount ?? 0;
              const totalSpent = stats?.totalSpent ?? Number(customer.totalSpent ?? customer.totalPayment ?? 0);
              const memberSince = getMemberSinceDate(customer, stats?.firstOrder);
              // Always use customer data from MongoDB only - no fallback to orders data
              const countryDisplay = getCustomerCountry(customer, undefined, normalizeCountry) || '—';
              return (
                <tr
                  key={id}
                  className="border-b border-gray-700 hover:bg-gray-800/40 transition-colors cursor-pointer"
                  onClick={() => onSelectCustomer(id)}
                >
                  <td className="p-2 md:p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      onChange={() => onToggleOne(id)}
                      aria-label={`Select customer ${customer.fullName || customer.name}`}
                      className="rounded border-gray-600 bg-background-dark cursor-pointer"
                    />
                  </td>
                  <td className="p-2 md:p-3">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <img
                        src={customer.avatarUrl || customer.avatar}
                        alt={customer.fullName || customer.name}
                        className="w-7 h-7 md:w-9 md:h-9 rounded-full flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-primary text-sm truncate">{customer.fullName || customer.name}</p>
                        <p className="text-sm text-text-secondary truncate hidden sm:block">{customer.email}</p>
                        <p className="text-sm text-text-secondary truncate sm:hidden">{getDisplayCode(id)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 md:p-3 text-text-secondary text-sm hidden md:table-cell">{getDisplayCode(id)}</td>
                  <td className="p-2 md:p-3 text-text-secondary whitespace-nowrap text-sm hidden lg:table-cell">{countryDisplay}</td>
                  <td className="p-2 md:p-3">
                    <Badge
                      color={
                        customer.status === 'inactive'
                          ? 'yellow'
                          : customer.status === 'banned'
                            ? 'red'
                            : 'green'
                      }
                      className="text-sm"
                    >
                      {formatCustomerStatus(customer.status)}
                    </Badge>
                  </td>
                  <td className="p-2 md:p-3 text-center text-text-secondary whitespace-nowrap text-sm">{totalOrders}</td>
                  <td className="p-2 md:p-3 text-right text-text-secondary whitespace-nowrap pl-4 md:pl-8 text-sm">
                    {formatVND(totalSpent)}
                  </td>
                  <td className="p-2 md:p-3 text-text-secondary whitespace-nowrap pl-4 md:pl-8 text-sm hidden sm:table-cell">
                    {formatMemberSinceDate(memberSince)}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;

