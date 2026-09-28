import React from 'react';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'demo';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'sm',
  dot = true,
  className = '',
}) => {
  const styles = {
    success: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    info: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
    neutral: 'bg-[#F4EDE4] text-[#5C4535] border-[#E8DC CE]',
    demo: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
  }[status];

  const dotColors = {
    success: 'bg-[#15803D]',
    warning: 'bg-[#B45309]',
    danger: 'bg-[#B91C1C]',
    info: 'bg-[#0369A1]',
    neutral: 'bg-[#8C6B4E]',
    demo: 'bg-[#D97706]',
  }[status];

  const sizeStyle = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-mono font-semibold rounded-full border tracking-wide uppercase ${sizeStyle} ${styles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      <span>{children}</span>
    </span>
  );
};
