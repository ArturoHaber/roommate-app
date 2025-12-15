// Design System for Roommate App - Midnight/Neon Theme

export const COLORS = {
  // Primary palette - Neon Indigo/Violet
  primary: '#818CF8',      // Lighter indigo for dark mode
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',

  // Secondary - Neon Cyan/Teal
  secondary: '#2DD4BF',    // Teal-400
  secondaryLight: '#5EEAD4',
  secondaryDark: '#14B8A6',

  // Accent - Neon Pink/Rose
  accent: '#FB7185',       // Rose-400
  accentLight: '#FDA4AF',
  accentDark: '#F43F5E',

  // Semantic colors
  success: '#34D399',      // Emerald-400
  warning: '#FBBF24',      // Amber-400
  error: '#F87171',        // Red-400
  info: '#60A5FA',         // Blue-400

  // Neutrals - Dark Mode
  white: '#FFFFFF',
  black: '#000000',

  // Slate Scale (Dark to Light)
  gray900: '#020617', // Deepest background
  gray800: '#0F172A', // Card background
  gray700: '#1E293B', // Border/Hover
  gray600: '#334155', // Muted text
  gray500: '#475569',
  gray400: '#64748B',
  gray300: '#94A3B8',
  gray200: '#CBD5E1', // Secondary text
  gray100: '#F1F5F9', // Primary text
  gray50: '#F8FAFC',

  // Backgrounds
  background: '#020617', // Slate-950
  surface: '#0F172A',    // Slate-900
  surfaceElevated: '#1E293B', // Slate-800

  // Text
  textPrimary: '#F1F5F9',   // Slate-100
  textSecondary: '#94A3B8', // Slate-400
  textTertiary: '#64748B',  // Slate-500
  textInverse: '#0F172A',   // Slate-900

  // Borders
  border: '#1E293B',        // Slate-800
  borderLight: '#334155',   // Slate-700

  // Category colors - Neon Pop
  categories: {
    groceries: '#34D399', // Emerald
    utilities: '#60A5FA', // Blue
    rent: '#A78BFA',      // Violet
    supplies: '#FBBF24',  // Amber
    other: '#94A3B8',     // Slate
  },

  // Chore difficulty
  chorePoints: {
    easy: '#34D399',    // 1-2 points
    medium: '#FBBF24',  // 3-4 points
    hard: '#F87171',    // 5+ points
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#818CF8', // Colored glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const GRADIENTS = {
  primary: ['#6366F1', '#8B5CF6'] as const,
  success: ['#10B981', '#34D399'] as const,
  sunset: ['#F43F5E', '#F59E0B'] as const,
  ocean: ['#06B6D4', '#3B82F6'] as const,
  card: ['#1E293B', '#0F172A'] as const,
  glass: ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.6)'] as const,
  glow: ['rgba(99, 102, 241, 0.3)', 'transparent'] as const,
};

