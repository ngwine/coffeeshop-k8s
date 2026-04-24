import React from 'react';
import { ChevronDown } from 'lucide-react';

type FormInputProps = {
  label: string;
  placeholder: string;
  type?: string;
  id: string;
  className?: string;
};

export const FormInput: React.FC<FormInputProps> = ({ label, placeholder, type = 'text', id, className }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
      {label}
    </label>
    <input
      type={type}
      id={id}
      placeholder={placeholder}
      className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
    />
  </div>
);

type FormSelectProps = {
  label: string;
  id: string;
  children: React.ReactNode;
};

export const FormSelect: React.FC<FormSelectProps> = ({ label, id, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        className="w-full bg-background-dark border border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary appearance-none"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  </div>
);



