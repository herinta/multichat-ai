import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyles = "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 shadow-sm shadow-blue-200",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    ghost: "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
