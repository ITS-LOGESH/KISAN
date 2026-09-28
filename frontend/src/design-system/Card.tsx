import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'subtle' | 'elevated' | 'field';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  interactive = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    surface: 'bg-white border border-[#E8E2D8] shadow-subtle',
    subtle: 'bg-[#F7F4EE] border border-[#E8E2D8]',
    elevated: 'bg-white border border-[#E8E2D8] shadow-elevated',
    field: 'bg-white border border-[#E8E2D8] shadow-field',
  }[variant];

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-[#1B4D3E]/30 hover:shadow-elevated transition-all duration-200 active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 ${variantStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
