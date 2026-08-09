import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Westercove design tokens — the single source of truth for color, type,
 * spacing, radii, and elevation. The light palette and typography are lifted
 * from the current Lovable reference (warm parchment, Source Serif 4 headings,
 * Inter body); the dark palette is a warm-dark derivative. Both light and dark
 * ship for every color token.
 */

export interface ThemeColors {
  /** App surface background. */
  background: string;
  /** Compose pill, subtle fills. */
  surfaceAlt: string;
  /** Cards (with border). */
  card: string;
  /** Borders, dividers. */
  line: string;
  /** Body and headings. */
  textPrimary: string;
  /** Meta, captions, placeholder. */
  textMuted: string;
  /** Active nav, section labels, links, mic, chips — the interactive accent. */
  forest: string;
  /** Crisis banner, crisis cards, primary CTA buttons. NEVER red. */
  emerald: string;
  /** Reflective surface text. */
  amethystText: string;
  /** Entry tags, hard-date card fills. */
  amethystTint: string;
  /** Command chip background. */
  chipGreen: string;
  /** Landscape horizon glow — imagery only, never text/interactive. */
  saffron: string;
  /** Text/icon color on emerald and forest fills. */
  onAccent: string;
  /** Serif display headings (deep amethyst in the reference). */
  heading: string;
}

const light: ThemeColors = {
  background: '#F6F1E7',
  surfaceAlt: '#EDE4D0',
  card: '#FBF7EE',
  line: '#E1D6BE',
  textPrimary: '#313E47',
  textMuted: '#6A7078',
  forest: '#338233',
  emerald: '#0E5F18',
  amethystText: '#26114E',
  amethystTint: '#EEF0F8',
  chipGreen: '#EEF3E8',
  saffron: '#EDC531',
  onAccent: '#FFFFFF',
  heading: '#190933',
};

// Warm-dark derivative — the reference ships light-only, so these are designed
// to keep the parchment character legible at night.
const dark: ThemeColors = {
  background: '#1A1712',
  surfaceAlt: '#241F18',
  card: '#221D16',
  line: '#3A3226',
  textPrimary: '#EDE4D0',
  textMuted: '#A89F8D',
  forest: '#6BBF6F',
  emerald: '#0E5F18',
  amethystText: '#CBB8F0',
  amethystTint: '#2A2140',
  chipGreen: '#24301F',
  saffron: '#EDC531',
  onAccent: '#FFFFFF',
  heading: '#CBB8F0',
};

export const palette = { light, dark } as const;

/** 4pt base spacing scale. Screen side padding is 20; stacked-card gap 12. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  /** Screen side padding (handoff §3.3). */
  screen: 20,
  /** Gap between stacked cards. */
  cardGap: 12,
  /** Card inner padding. */
  cardInner: 16,
} as const;

/** Corner radii (handoff §3.3). Crisis banner is full-bleed (0). */
export const radii = {
  chip: 9,
  tag: 9,
  button: 12,
  card: 14,
  avatar: 12,
  inputPill: 25,
  banner: 0,
} as const;

/**
 * Two families, loaded via expo-font in the root layout (see _layout.tsx):
 * Source Serif 4 for display/headings, Inter for body and labels. Custom
 * fonts on native carry weight in the family name (fontWeight is ignored for
 * non-system faces on Android), so each weight is its own face here.
 */
export const fonts = {
  serif: 'SourceSerif4_400Regular',
  serifSemibold: 'SourceSerif4_600SemiBold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export type TypographyVariant =
  | 'display'
  | 'screenTitle'
  | 'sectionLabel'
  | 'cardTitle'
  | 'body'
  | 'bodySmall'
  | 'meta'
  | 'tag';

/** Type scale. Color is applied by the Text component, not here. */
export const typography: Record<TypographyVariant, TextStyle> = {
  display: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySmall: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  meta: { fontFamily: fonts.sans, fontSize: 11, lineHeight: 14, fontWeight: '400' },
  tag: { fontFamily: fonts.sansBold, fontSize: 11, lineHeight: 14, fontWeight: '700' },
};

/**
 * Elevation: light mode is a 1px line border plus a soft primary-tinted
 * shadow; dark mode is border-only, no shadow (handoff §3.3).
 */
export function cardElevation(scheme: 'light' | 'dark'): ViewStyle {
  const colors = palette[scheme];
  const border: ViewStyle = { borderWidth: 1, borderColor: colors.line };
  if (scheme === 'dark') return border;
  return {
    ...border,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(20,40,20,0.05)' } as unknown as ViewStyle,
      default: {
        shadowColor: 'rgb(20,40,20)',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      },
    }),
  };
}

/** Layout breakpoint: at/above this width, use the web side-rail nav. */
export const WIDE_BREAKPOINT = 1024;
/** Content is centered and capped at this width on large screens. */
export const MAX_CONTENT_WIDTH = 640;

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
}

export const lightTheme: Theme = { scheme: 'light', colors: light };
export const darkTheme: Theme = { scheme: 'dark', colors: dark };
