import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  showDot?: boolean;
  dotClassName?: string;
}

export function Badge({
  children,
  variant = 'default',
  showDot = false,
  className = '',
  dotClassName = '',
  ...props
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'danger':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'info':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'default':
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getDotStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      case 'info':
        return 'bg-indigo-500';
      case 'default':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getVariantStyles()} ${className}`}
      {...props}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${getDotStyles()} ${dotClassName}`} />
      )}
      {children}
    </span>
  );
}

export function InstrumentStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'ACTIVE'
      ? 'success'
      : status === 'CALIBRATION_DUE'
      ? 'warning'
      : status === 'OVERDUE'
      ? 'danger'
      : 'default';
  return (
    <Badge variant={variant} showDot>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export function CalibrationStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'APPROVED'
      ? 'success'
      : status === 'PENDING_REVIEW'
      ? 'warning'
      : status === 'REJECTED'
      ? 'danger'
      : 'default';
  return (
    <Badge variant={variant}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export function ReferenceStandardStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'ACTIVE'
      ? 'success'
      : status === 'DUE_SOON'
      ? 'warning'
      : status === 'EXPIRED'
      ? 'danger'
      : 'default';
  return (
    <Badge variant={variant}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export function WorkOrderStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'COMPLETED'
      ? 'success'
      : status === 'IN_PROGRESS'
      ? 'warning'
      : status === 'OPEN'
      ? 'info'
      : 'danger';
  return (
    <Badge variant={variant}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export default Badge;
