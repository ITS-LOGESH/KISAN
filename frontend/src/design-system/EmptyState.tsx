import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-3xl border border-dashed border-[#E8E2D8] bg-[#F7F4EE]/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#E8E2D8] flex items-center justify-center text-[#1B4D3E] shadow-subtle">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="font-serif font-bold text-xl text-[#1C1510] tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-[#6B5E51] font-light max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
