import React from 'react';

type NumberFilterInputProps = {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  min?: number;
};

const NumberFilterInput: React.FC<NumberFilterInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Enter value',
  min = 0,
}) => (
  <div className="space-y-1.5 min-w-0">
    {label && <label className="text-[11px] uppercase text-text-secondary block">{label}</label>}
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-background-dark border border-gray-600 rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-w-0 h-9"
    />
  </div>
);

export default NumberFilterInput;




