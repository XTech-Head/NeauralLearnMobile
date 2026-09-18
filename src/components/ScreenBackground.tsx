// src/components/ScreenBackground.tsx — gradient backdrop + safe-area aware
// wrapper used by every screen. Handles the black→purple (dark) / white→
// purple-wash (light) gradient in one place, and respects each device's
// safe area so content doesn't sit under a notch/status bar or get
// clipped by a home indicator.
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";

interface ScreenBackgroundProps {
  children: React.ReactNode;
  /** Skip top safe-area padding (e.g. screens with their own custom header). */
  noTopInset?: boolean;
  style?: ViewStyle;
}

export function ScreenBackground({ children, noTopInset, style }: ScreenBackgroundProps) {
  const { gradient, gradientLocations } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradient as unknown as readonly [string, string, ...string[]]}
        locations={gradientLocations as unknown as readonly [number, number, ...number[]]}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[
          styles.content,
          { paddingTop: noTopInset ? 0 : insets.top, paddingBottom: insets.bottom },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
