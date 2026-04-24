import React from 'react';
import { ChevronLeft } from 'lucide-react';

type BackButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Back', className }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center p-2 rounded-md bg-background-dark border border-gray-700 text-text-secondary hover:bg-background-dark hover:transform-none hover:shadow-none ${className || ''}`}
      aria-label={label}
      title={label}
    >
      <ChevronLeft size={18} />
      <span className="sr-only">{label}</span>
    </button>
  );
};

export default BackButton;


