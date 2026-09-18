// src/utils/scale.ts — responsive sizing so the UI doesn't feel oversized
// on smaller phones or cramped on larger ones.
import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Baseline: a standard ~6.1" phone (iPhone 13/14-class). Everything scales
// relative to this so a 5.4" phone and a 6.7" phone both feel right.
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/** Scales horizontally — use for widths, horizontal padding/margins. */
export function scale(size: number) {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/** Scales vertically — use for heights, vertical padding/margins. */
export function verticalScale(size: number) {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * Scales gently (factor 0.5 by default) — use for font sizes and radii,
 * where you want *some* adaptation but not a 1:1 stretch (a 32px title
 * shouldn't balloon on a tablet-sized phone).
 */
export function moderateScale(size: number, factor = 0.5) {
  return size + (scale(size) - size) * factor;
}

/** Rounds to the nearest device pixel to avoid blurry 0.5px borders. */
export function px(size: number) {
  return PixelRatio.roundToNearestPixel(size);
}

export const screen = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };
