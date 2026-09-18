// src/hooks/useTheme.ts — resolves the active theme + gradient, respecting
// the user's light/dark/system preference (see ThemeContext).
import {
    DARK_GRADIENT,
    DARK_GRADIENT_LOCATIONS,
    DARK_THEME,
    LIGHT_GRADIENT,
    LIGHT_GRADIENT_LOCATIONS,
    LIGHT_THEME,
} from "../themes";
import { useThemePreference } from "../context/ThemeContext";

export function useTheme() {
  const { isDark } = useThemePreference();
  return {
    theme: isDark ? DARK_THEME : LIGHT_THEME,
    gradient: isDark ? DARK_GRADIENT : LIGHT_GRADIENT,
    gradientLocations: isDark ? DARK_GRADIENT_LOCATIONS : LIGHT_GRADIENT_LOCATIONS,
    isDark,
  };
}