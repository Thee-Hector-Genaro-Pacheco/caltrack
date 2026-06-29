import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10';
      case 'secondary':
        return 'bg-[#1f2937] hover:bg-[#374151] border border-white/5 text-gray-200';
      case 'danger':
        return 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20';
      case 'success':
        return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20';
      case 'outline':
        return 'bg-transparent hover:bg-white/5 border border-gray-700 text-gray-300 hover:text-white';
      case 'ghost':
        return 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white';
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-1.5 px-3 text-xs';
      case 'lg':
        return 'py-3 px-6 text-base';
      case 'md':
      default:
        return 'py-2.5 px-4 text-sm';
    }
  };

  return (
    <button
      type={type}
      className={`btn-transition font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
