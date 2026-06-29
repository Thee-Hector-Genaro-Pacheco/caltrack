import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  fullPage?: boolean;
  minHeight?: string;
}

export function Spinner({
  size = 'md',
  fullPage = false,
  minHeight = '300px',
  className = '',
  ...props
}: SpinnerProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6 border-t-2';
      case 'lg':
        return 'h-12 w-12 border-t-2';
      case 'md':
      default:
        return 'h-10 w-10 border-t-2';
    }
  };

  const spinnerElement = (
    <div
      className={`animate-spin rounded-full border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent ${getSizeStyles()} ${className}`}
      {...props}
    />
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        {spinnerElement}
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight }}
    >
      {spinnerElement}
    </div>
  );
}

export default Spinner;
