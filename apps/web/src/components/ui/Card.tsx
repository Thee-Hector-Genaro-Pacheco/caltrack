import React from 'react';

export type CardVariant = 'card' | 'panel';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  glow?: boolean;
  glowType?: 'primary' | 'success' | 'warning' | 'danger';
}

export function Card({
  children,
  variant = 'card',
  glow = false,
  glowType = 'primary',
  className = '',
  ...props
}: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'panel':
        return 'glass-panel p-6 rounded-2xl';
      case 'card':
      default:
        return 'glass-card p-6 rounded-xl border border-white/5';
    }
  };

  const getGlowStyles = () => {
    if (!glow) return '';
    switch (glowType) {
      case 'success':
        return 'glow-success';
      case 'warning':
        return 'glow-warning';
      case 'danger':
        // Custom danger styling if any, otherwise standard glow
        return 'box-shadow: 0 0 20px -3px rgba(239, 68, 68, 0.3)';
      case 'primary':
      default:
        return 'glow-primary';
    }
  };

  return (
    <div
      className={`${getVariantStyles()} ${getGlowStyles()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
