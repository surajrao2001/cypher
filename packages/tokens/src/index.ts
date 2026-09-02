export const nightCypherColors = {
  bg: '#0A0A0A',
  surface: '#121212',
  elevated: '#1A1A1A',
  border: '#2A2A2A',
  textPrimary: '#F5F5F5',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  accentPrimary: '#FF4D00',
  accentPrimaryHover: '#FF6A2B',
  accentSecondary: '#DFFF00',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const nightCypherFonts = {
  display: 'Bebas Neue',
  body: 'Barlow',
} as const;

export const nightCypherSpacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
} as const;

export type NightCypherColors = typeof nightCypherColors;
export type NightCypherFonts = typeof nightCypherFonts;
