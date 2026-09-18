// components/AuthUI.tsx — theme-aware auth building blocks
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    type TextInputProps,
} from "react-native";
import { useTheme } from "../src/hooks/useTheme";
import { radius, space, type as typeScale } from "../src/themes";

export function LogoMark() {
  const { theme } = useTheme();
  return (
    <View style={logo.wrap}>
      <View style={[logo.badge, { backgroundColor: theme.primaryLight }]}>
        <Text style={[logo.glyph, { color: theme.bg }]}>N</Text>
      </View>
      <Text style={[logo.wordmark, { color: theme.text }]}>
        Neural<Text style={{ color: theme.primary }}>Learn</Text>
      </Text>
    </View>
  );
}

const logo = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 6 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 17, fontWeight: "800" },
  wordmark: { fontSize: typeScale.h1, fontWeight: "700", letterSpacing: -0.3 },
});

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function AuthInput({ label, error, ...props }: AuthInputProps) {
  const { theme } = useTheme();
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!error) return;
    Animated.sequence([
      Animated.timing(shake, {
        toValue: 4,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -4,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 2,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [error]);

  return (
    <Animated.View style={{ transform: [{ translateX: shake }] }}>
      <Text style={[inp.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          inp.input,
          {
            borderColor: theme.border,
            backgroundColor: theme.bgTertiary,
            color: theme.text,
          },
          error ? { borderColor: theme.danger } : null,
        ]}
        placeholderTextColor={theme.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {error ? (
        <Text style={[inp.error, { color: theme.danger }]}>{error}</Text>
      ) : null}
    </Animated.View>
  );
}

const inp = StyleSheet.create({
  label: { marginBottom: 7, fontSize: typeScale.bodySmall, fontWeight: "600" },
  input: {
    height: 46,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    borderWidth: 1,
    fontSize: typeScale.body,
  },
  error: { marginTop: 5, fontSize: typeScale.caption },
});

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          btn.primary,
          { backgroundColor: theme.primary },
          (disabled || loading) && btn.disabled,
        ]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.bg} size="small" />
        ) : (
          <Text style={[btn.primaryLabel, { color: theme.bg }]}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[
        btn.ghost,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[btn.ghostLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const btn = StyleSheet.create({
  primary: {
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
  primaryLabel: { fontSize: typeScale.body, fontWeight: "700" },
  ghost: {
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  ghostLabel: { fontSize: typeScale.bodySmall, fontWeight: "600" },
});
