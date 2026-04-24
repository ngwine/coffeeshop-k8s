
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, color, className = '' }) => {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    blue: 'bg-blue-500/10 text-blue-400',
    gray: 'bg-gray-500/10 text-gray-400',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
