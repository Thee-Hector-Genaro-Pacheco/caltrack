import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className = '', containerClassName = '', type = 'text', ...props }, ref) => {
    const inputStyles = `w-full bg-slate-900/60 border border-gray-700 rounded-lg py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${
      icon ? 'pl-10 pr-4' : 'px-4'
    } ${className}`;

    if (icon) {
      return (
        <div className={`relative ${containerClassName}`}>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 flex items-center pointer-events-none">
            {icon}
          </div>
          <input ref={ref} type={type} className={inputStyles} {...props} />
        </div>
      );
    }

    return <input ref={ref} type={type} className={inputStyles} {...props} />;
  }
);

Input.displayName = 'Input';

export default Input;
