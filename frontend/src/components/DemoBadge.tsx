import React from 'react';
import { Tag } from 'lucide-react';

interface DemoBadgeProps {
  label?: string | null;
  size?: 'sm' | 'md';
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ label = 'DEMO DATA', size = 'sm' }) => {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center space-x-1 font-bold rounded uppercase tracking-wider ${
        isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } bg-amber-100 text-amber-900 border border-amber-300 shadow-sm shrink-0`}
      title="Demonstration data — not live farm measurements."
    >
      <Tag className={isSm ? 'w-2.5 h-2.5 text-amber-700' : 'w-3 h-3 text-amber-700'} />
      <span>{label || 'DEMO DATA'}</span>
    </span>
  );
};
