/**
 * Kisan Design System Tokens
 * Strict adherence to: "Digital agriculture without looking like a dashboard."
 */

export const tokens = {
  colors: {
    bg: '#FAF8F4',
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F4EE',
    surfaceMuted: '#F0EBE1',
    border: '#E8E2D8',
    borderSubtle: '#F0EBE1',
    primary: '#1B4D3E',
    primaryHover: '#143C30',
    primaryLight: '#E8F5F0',
    accent: '#C78520',
    accentHover: '#A86C14',
    accentLight: '#FEF8E7',
    text: '#1C1510',
    textMuted: '#6B5E51',
    textLight: '#9E9182',
    success: '#15803D',
    successBg: '#F0FDF4',
    warning: '#B45309',
    warningBg: '#FFFBEB',
    danger: '#B91C1C',
    dangerBg: '#FEF2F2',
    info: '#0369A1',
    infoBg: '#F0F9FF',
  },
  typography: {
    fontSerif: 'font-serif', // Fraunces
    fontSans: 'font-sans',   // Plus Jakarta Sans
    fontMono: 'font-mono',   // JetBrains Mono
  },
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  },
  shadow: {
    subtle: 'shadow-subtle',
    elevated: 'shadow-elevated',
    floating: 'shadow-floating',
    field: 'shadow-field',
  }
} as const;
