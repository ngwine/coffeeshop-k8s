import React from 'react';
import ExportDropdown from '../../../../../../components/ExportDropdown';
import { ExportFormat } from '../../../../../../utils/exportUtils';

type CustomerListHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddCustomer?: () => void;
  exportDisabled?: boolean;
  onExport?: (type: ExportFormat) => void;
};

const CustomerListHeader: React.FC<CustomerListHeaderProps> = ({
  searchValue,
  onSearchChange,
  onAddCustomer,
  exportDisabled = false,
  onExport,
}) => {
  return (
    <div className="flex flex-row items-center mb-4 md:mb-6 gap-2 md:gap-4 w-full min-w-0">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary flex-shrink-0 mr-3">Customers</h2>
      {/* Hàng search + nút: desktop 1 hàng, màn nhỏ có thể xuống dòng để dropdown không bị ẩn */}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 w-full md:w-auto min-w-0 max-w-full overflow-visible">
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Search customer"
          className="bg-background-dark border border-gray-600 rounded-lg px-3 md:px-4 py-1.5 md:py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64 md:w-72 text-sm md:text-base min-w-[200px] max-w-full"
        />
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <ExportDropdown disabled={exportDisabled} onExport={onExport} />
          {onAddCustomer && (
            <button
              onClick={onAddCustomer}
              className="bg-primary text-white px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-md hover:bg-primary/90 transition-colors text-[11px] sm:text-xs md:text-sm whitespace-nowrap"
            >
              + Add Customer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerListHeader;


