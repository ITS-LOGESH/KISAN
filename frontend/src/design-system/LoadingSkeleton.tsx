import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
}) => {
  const variantStyles = {
    rect: 'rounded-2xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-[#E8E2D8]/60 ${variantStyles} ${className}`}
    />
  );
};
