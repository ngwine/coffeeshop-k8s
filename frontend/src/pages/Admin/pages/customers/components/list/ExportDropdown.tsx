import React, { useRef, useState, useEffect } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';

type ExportDropdownProps = {
  disabled?: boolean;
  onExport?: (type: 'csv' | 'excel' | 'pdf') => void;
};

const ExportDropdown: React.FC<ExportDropdownProps> = ({ disabled = false, onExport }) => {
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (onExport) {
      onExport(type);
    }
    setShowExport(false);
  };

  return (
    <div className="relative" ref={exportRef}>
      <button
        type="button"
        onClick={() => setShowExport((v) => !v)}
        className={`px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-md flex items-center gap-1 transition font-medium text-[10px] sm:text-[11px] md:text-xs
          ${disabled
            ? 'bg-background-dark border border-gray-700 text-text-secondary opacity-60 cursor-pointer'
            : 'bg-background-dark border border-gray-700 text-text-secondary hover:bg-gray-800 hover:text-white cursor-pointer'}
        `}
      >
        <span className="text-white px-2 sm:px-2.5">
          Export
        </span>
        <ChevronDown size={14} />
      </button>
      {showExport && !disabled && (
        <div className="absolute right-0 mt-2 w-44 bg-background-light border border-gray-700 rounded-lg shadow-xl z-50 p-2">
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background-dark text-text-primary"
          >
            <FileDown size={16} /> Csv
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background-dark text-text-primary"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background-dark text-text-primary"
          >
            <FileText size={16} /> Pdf
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;


