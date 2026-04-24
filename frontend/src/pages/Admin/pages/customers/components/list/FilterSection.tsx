import React from 'react';
import { RotateCcw } from 'lucide-react';
import CountrySelectWithAlphabet from '../shared/CountrySelectWithAlphabet';
import NumberFilterInput from '../shared/NumberFilterInput';
import JoinDatePicker from '../shared/JoinDatePicker';

type FilterSectionProps = {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  countryFilter: string;
  onCountryFilterChange: (value: string) => void;
  ordersMin: string;
  onOrdersMinChange: (value: string) => void;
  ordersMax: string;
  onOrdersMaxChange: (value: string) => void;
  joinStart: string;
  onJoinStartChange: (value: string) => void;
  joinEnd: string;
  onJoinEndChange: (value: string) => void;
  onResetFilters: () => void;
};

const FilterSection: React.FC<FilterSectionProps> = ({
  statusFilter,
  onStatusFilterChange,
  countryFilter,
  onCountryFilterChange,
  ordersMin,
  onOrdersMinChange,
  ordersMax,
  onOrdersMaxChange,
  joinStart,
  onJoinStartChange,
  joinEnd,
  onJoinEndChange,
  onResetFilters,
}) => {
  return (
    <div className="relative bg-background-dark/40 border border-gray-700 rounded-lg pt-3.5 pr-2.5 pb-2.5 pl-2.5 mb-3 w-full min-w-0 overflow-hidden">
      <button
        type="button"
        onClick={onResetFilters}
        className="absolute right-2 top-2 p-1.5 rounded-lg border border-gray-600 text-text-secondary hover:text-white hover:border-primary bg-background-dark"
        aria-label="Reset filters"
      >
        <RotateCcw size={14} />
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        <div className="space-y-1.5 min-w-0">
          <label className="text-[11px] uppercase text-text-secondary block">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full bg-background-dark border border-gray-600 rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-w-0 h-9"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        <div className="min-w-0">
          <CountrySelectWithAlphabet
            value={countryFilter}
            onChange={onCountryFilterChange}
            label="Country"
          />
        </div>
        <div className="min-w-0">
          <NumberFilterInput
            label="Orders min"
            value={ordersMin}
            onChange={onOrdersMinChange}
          />
        </div>
        <div className="min-w-0">
          <NumberFilterInput
            label="Orders max"
            value={ordersMax}
            onChange={onOrdersMaxChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 mt-2.5">
        <div className="min-w-0">
          <JoinDatePicker
            label="Join date (from)"
            value={joinStart}
            onChange={onJoinStartChange}
          />
        </div>
        <div className="min-w-0">
          <JoinDatePicker
            label="Join date (to)"
            value={joinEnd}
            onChange={onJoinEndChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSection;




