import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  className?: string;
  disabled?: boolean;
}

export const Button = ({ children, onClick, variant = 'default', className = '', disabled = false }: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors px-4 py-2';
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 hover:bg-gray-50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};