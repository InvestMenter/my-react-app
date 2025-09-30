import React, { useState } from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen), isOpen } as any);
          }
          if (child.type === SelectContent && isOpen) {
            return React.cloneElement(child, { 
              onSelect: (selectedValue: string) => {
                onValueChange?.(selectedValue);
                setIsOpen(false);
              }
            } as any);
          }
        }
        return null;
      })}
    </div>
  );
};

export const SelectTrigger = ({ children, onClick, isOpen }: any) => (
  <button
    onClick={onClick}
    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {children}
    <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
);

export const SelectContent = ({ children, onSelect }: any) => (
  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { onSelect } as any);
      }
      return child;
    })}
  </div>
);

export const SelectItem = ({ value, children, onSelect }: any) => (
  <div
    onClick={() => onSelect?.(value)}
    className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
  >
    {children}
  </div>
);

export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-gray-500">{placeholder}</span>
);