import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRY_OPTIONS } from '../../constants/countries';

type CountrySelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
};

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select country',
  className = '',
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const filteredCountryOptions = useMemo(() => {
    const term = countrySearch.trim().toLowerCase();
    if (!term) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(term));
  }, [countrySearch]);

  const handleSelect = (country: string) => {
    onChange(country);
    setCountrySearch('');
    setCountryMenuOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setCountrySearch('');
    setCountryMenuOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`} ref={countryDropdownRef}>
      {label && <label className="text-xs uppercase text-text-secondary">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setCountryMenuOpen((prev) => !prev)}
          className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between hover:bg-background-dark hover:transform-none hover:shadow-none"
        >
          <span className={value ? 'text-text-primary' : 'text-text-secondary'}>{value || placeholder}</span>
          <ChevronDown size={16} />
        </button>
        {countryMenuOpen && (
          <div className="absolute z-30 mt-2 w-full bg-background-dark border border-gray-600 rounded-lg shadow-lg p-2 space-y-2">
            <input
              type="text"
              value={countrySearch}
              placeholder="Search country"
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={handleClear}
                className="w-full text-left px-3 py-2 text-text-secondary hover:bg-background-dark/60"
              >
                All countries
              </button>
              {filteredCountryOptions.map((country) => (
                <button
                  type="button"
                  key={country}
                  onClick={() => handleSelect(country)}
                  className="w-full text-left px-3 py-1.5 text-text-primary hover:bg-background-dark/60"
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountrySelect;


