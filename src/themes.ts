// src/themes.ts — white/purple light theme, black→purple gradient dark theme
import { moderateScale, scale, verticalScale } from "./utils/scale";

export const DARK_THEME = {
  mode: "dark" as const,
  // Flat fallback (status bar, native splash) — the real background is the
  // gradient below, rendered by <ScreenBackground>.
  bg: "#05040A",
  bgSecondary: "#110E18",
  bgTertiary: "#181524",

  surface: "rgba(21, 17, 29, 0.78)",
  surfaceStrong: "rgba(29, 22, 38, 0.97)",

  border: "rgba(196, 181, 253, 0.13)",
  borderLight: "rgba(196, 181, 253, 0.08)",

  text: "#F5F3FF",
  textSecondary: "#D4CCE8",
  textTertiary: "#9C95B6",

  primary: "#A78BFA",
  primaryLight: "#C4B5FD",
  primaryDark: "#7C3AED",

  success: "#6EE7B7",
  warning: "#FCD34D",
  danger: "#F87171",
  info: "#A5F3FC",

  overlay: "rgba(11, 8, 18, 0.6)",
};

export const LIGHT_THEME = {
  mode: "light" as const,
  bg: "#FFFFFF",
  bgSecondary: "#FAF9FD",
  bgTertiary: "#F1ECFB",

  surface: "rgba(255, 255, 255, 0.9)",
  surfaceStrong: "rgba(248, 246, 253, 0.97)",

  border: "rgba(124, 58, 237, 0.14)",
  borderLight: "rgba(124, 58, 237, 0.08)",

  text: "#1C1726",
  textSecondary: "#584F6B",
  textTertiary: "#8B84A0",

  primary: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryDark: "#5B21B6",

  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#0891B2",

  overlay: "rgba(255, 255, 255, 0.6)",
};

export type Theme = typeof DARK_THEME;

// Dark mode's real background — black fading into deep purple. Feed this
// straight to <LinearGradient colors={DARK_GRADIENT}>.
export const DARK_GRADIENT = ["#050308", "#120D1B", "#08060D"] as const;
export const DARK_GRADIENT_LOCATIONS = [0, 0.55, 1] as const;

// Light mode's background — white with the faintest purple wash, not flat.
export const LIGHT_GRADIENT = ["#FFFFFF", "#F7F3FE", "#FFFFFF"] as const;
export const LIGHT_GRADIENT_LOCATIONS = [0, 0.5, 1] as const;

// ── Type scale — deliberately smaller than before, and moderately
// responsive so it doesn't feel oversized on compact phones. ──────────
export const type = {
  display: moderateScale(26), // page titles ("Explore", "Progress")
  h1: moderateScale(20), // card/section headlines
  h2: moderateScale(16), // subheads
  body: moderateScale(14),
  bodySmall: moderateScale(12.5),
  caption: moderateScale(11),
};

// ── Spacing scale ──────────────────────────────────────────────
export const space = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
  xxl: scale(32),
};

export const radius = {
  sm: scale(10),
  md: scale(14),
  lg: scale(18),
  xl: scale(22),
  pill: 999,
};

export const vspace = {
  sm: verticalScale(8),
  md: verticalScale(16),
  lg: verticalScale(24),
};

// iOS-like soft shadows
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const transitions = { fast: 150, normal: 300, slow: 500 };
