/** Shared design tokens — single source of truth for the neutral palette, spacing and radii used across every screen. */

export const color = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  border: '#E4E1DC',
  borderStrong: '#D9D5CE',
  chipBg: '#F1EFEA',
  tabTrackBg: '#F4F2ED',
  avatarBg: '#EFEDE9',
  rowDivider: '#EEEBE5',

  textPrimary: '#18181B',
  textSecondary: '#2B2926',
  textTertiary: '#4A4640',
  textQuiet: '#57534E',
  textMuted: '#8B877F',
  textFaint: '#ACA79E',
  eyebrow: '#948F86',
} as const;

export const radius = {
  sm: 7,
  md: 8,
  lg: 10,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
