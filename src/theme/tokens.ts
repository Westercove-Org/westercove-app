import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Westercove design tokens — the single source of truth for color, type,
 * spacing, radii, and elevation. Values are lifted verbatim from the
 * official Design System v2 and Developer Handoff Spec v2, not the earlier
 * Lovable demo. Both light and dark ship for every color token.
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
}

const light: ThemeColors = {
  background: '#FFFFFF',
  surfaceAlt: '#F4F6F1',
  card: '#FFFFFF',
  line: '#E0E5DB',
  textPrimary: '#1C231B',
  textMuted: '#5C6B58',
  forest: '#338233',
  emerald: '#0E5F18',
  amethystText: '#3D2F5E',
  amethystTint: '#EEF0F8',
  chipGreen: '#EEF3E8',
  saffron: '#EDC531',
  onAccent: '#FFFFFF',
};

const dark: ThemeColors = {
  background: '#121711',
  surfaceAlt: '#1B211A',
  card: '#1B211A',
  line: '#2C352A',
  textPrimary: '#EEF2E9',
  textMuted: '#93A08F',
  forest: '#6BBF6F',
  emerald: '#0E5F18',
  amethystText: '#CBBDF0',
  amethystTint: '#241D3A',
  chipGreen: '#1F2B1F',
  saffron: '#EDC531',
  onAccent: '#FFFFFF',
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
 * One native system font family (Design System v2 §3): San Francisco on iOS,
 * Roboto on Android, system-ui on web. Size and weight carry the hierarchy;
 * there is no separate display/serif face. Native is selected by leaving
 * fontFamily undefined on the native platforms.
 */
export const fonts = {
  sans: Platform.select({ web: 'system-ui', default: undefined }) as
    | string
    | undefined,
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

/** Type scale (handoff §3.2). Color is applied by the Text component, not here. */
export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontFamily: fonts.sans, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  screenTitle: {
    fontFamily: fonts.sans,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: fonts.sans,
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
  tag: { fontFamily: fonts.sans, fontSize: 11, lineHeight: 14, fontWeight: '700' },
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
