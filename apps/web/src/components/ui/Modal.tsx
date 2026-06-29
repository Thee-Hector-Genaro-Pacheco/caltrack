import React from 'react';
import { X } from 'lucide-react';
import Card from './Card';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalSize;
  glow?: boolean;
  glowType?: 'primary' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  glow = false,
  glowType = 'primary',
  children,
  className = '',
}: ModalProps) {
  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      case 'md':
      default:
        return 'max-w-md';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
      <Card
        variant="panel"
        glow={glow}
        glowType={glowType}
        className={`w-full relative my-auto border border-white/5 ${getSizeClass()} ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          type="button"
        >
          <X size={18} />
        </button>

        {title && (
          <h3 className="text-xl font-bold text-white mb-1">
            {title}
          </h3>
        )}
        
        {description && (
          <p className="text-gray-400 text-xs mb-6 font-sans">
            {description}
          </p>
        )}

        {children}
      </Card>
    </div>
  );
}

export default Modal;
