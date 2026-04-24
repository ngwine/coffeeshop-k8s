import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div
    className={`bg-background-light rounded-lg shadow-lg 
    p-3 md:p-4 lg:p-6 ${className}`}
  >
    {children}
  </div>
);

export default Card;







