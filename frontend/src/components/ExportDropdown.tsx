import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileDown, FileSpreadsheet, FileText } from 'lucide-react';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

type ExportDropdownProps = {
  disabled?: boolean;
  onExport?: (format: ExportFormat) => void;
  label?: string;
};

const ExportDropdown: React.FC<ExportDropdownProps> = ({ disabled = false, onExport, label = 'Export' }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleExport = (format: ExportFormat) => {
    if (disabled) return;
    onExport?.(format);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        // Không dùng thuộc tính disabled HTML để vẫn cho phép mở menu, 
        // logic export sẽ tự kiểm tra selected rows ở bên ngoài
        onClick={() => setOpen((prev) => !prev)}
        className={`px-2 sm:px-2.5 md:px-3 py-2 rounded-md flex items-center justify-center gap-1.5 font-medium text-[11px] sm:text-xs md:text-sm whitespace-nowrap h-10 ${
          disabled
            ? 'bg-background-dark border border-gray-700 text-text-secondary opacity-60 cursor-pointer'
            : 'bg-primary text-white cursor-pointer'
        }`}
        style={{
          transition: 'none !important',
          boxShadow: 'none !important',
          WebkitTransition: 'none !important',
          MozTransition: 'none !important',
          OTransition: 'none !important',
          msTransition: 'none !important',
          backgroundColor: disabled ? 'rgb(23, 23, 23)' : 'rgb(124, 58, 237)', // Primary color when enabled
          borderColor: disabled ? 'rgb(55, 65, 81)' : 'transparent',
          color: disabled ? 'rgb(156, 163, 175)' : 'rgb(255, 255, 255)', // White text when enabled
          lineHeight: '1.5',
          boxSizing: 'border-box',
          borderWidth: disabled ? '1px' : '0px',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transition = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = 'rgb(124, 58, 237)'; // Keep primary color
            e.currentTarget.style.color = 'rgb(255, 255, 255)'; // Keep white text
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transition = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = 'rgb(124, 58, 237)'; // Keep primary color
            e.currentTarget.style.color = 'rgb(255, 255, 255)'; // Keep white text
          }
        }}
      >
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>
      {open && !disabled && (
        <div className="absolute right-0 mt-2 w-44 bg-background-light border border-gray-700 rounded-lg shadow-xl z-50 p-2">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-text-primary"
            onClick={() => handleExport('csv')}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FileDown size={16} /> Csv
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-text-primary"
            onClick={() => handleExport('excel')}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-text-primary"
            onClick={() => handleExport('pdf')}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FileText size={16} /> Pdf
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;


