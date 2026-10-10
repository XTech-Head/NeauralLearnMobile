// app/index.tsx — welcome / splash screen
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../src/components/ScreenBackground';
import { useTheme } from '../src/hooks/useTheme';
import { radius, space, type } from '../src/themes';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'book-outline',
    title: 'Lessons in order',
    body: 'Each course builds step by step toward your goal',
  },
  {
    icon: 'mic-outline',
    title: 'Talk to your tutor',
    body: 'Ask out loud and hear the answer',
  },
  {
    icon: 'compass-outline',
    title: 'Fits your pace',
    body: 'Lessons adjust as you learn',
  },
];

export default function WelcomeScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // One progress value drives the whole entrance; the halo breathes slowly.
  const enter = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | undefined;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        enter.setValue(1);
        return;
      }
      Animated.timing(enter, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(halo, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(halo, {
            toValue: 0,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [enter, halo]);

  // Fade + small rise for one segment of the shared timeline.
  const stage = (from: number, to: number, rise = 10) => ({
    opacity: enter.interpolate({
      inputRange: [from, to],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [from, to],
          outputRange: [rise, 0],
          extrapolate: 'clamp',
        }),
      },
    ],
  });

  const logoScale = enter.interpolate({
    inputRange: [0, 0.45],
    outputRange: [0.92, 1],
    extrapolate: 'clamp',
  });
  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.09],
  });

  const iconTint = isDark
    ? 'rgba(148, 117, 255, 0.18)'
    : 'rgba(139, 92, 246, 0.12)';

  return (
    <ScreenBackground>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <View
        style={[
          s.root,
          {
            paddingTop: insets.top + space.lg,
            paddingBottom: Math.max(insets.bottom, space.md) + space.sm,
          },
        ]}
      >
        <View style={s.content}>
          {/* Logo + halo: the one memorable moment */}
          <Animated.View
            style={[s.logoBlock, stage(0, 0.45, 0), { transform: [{ scale: logoScale }] }]}
          >
            <View style={s.logoWrap}>
              <Animated.View
                pointerEvents="none"
                style={[
                  s.haloOuter,
                  { backgroundColor: theme.primary, transform: [{ scale: haloScale }] },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  s.haloInner,
                  { backgroundColor: theme.primary, transform: [{ scale: haloScale }] },
                ]}
              />
              <View
                style={[
                  s.logoBadge,
                  { backgroundColor: theme.primaryLight, shadowColor: theme.primary },
                ]}
              >
                <Text style={[s.logoGlyph, { color: theme.bg }]}>N</Text>
              </View>
            </View>
            <Text style={[s.logoText, { color: theme.text }]}>
              Neural<Text style={{ color: theme.primary }}>Learn</Text>
            </Text>
          </Animated.View>

          <Animated.View style={[s.headline, stage(0.15, 0.6)]}>
            <Text style={[s.h1, { color: theme.text }]}>
              Learn with an AI tutor that talks back
            </Text>
            <Text style={[s.subtitle, { color: theme.textTertiary }]}>
              Personalized lessons built around your goals. Ask questions out
              loud and get answers you can follow.
            </Text>
          </Animated.View>

          {/* One grouped list instead of three separate cards */}
          <Animated.View
            style={[
              s.group,
              { backgroundColor: theme.surface, borderColor: theme.border },
              stage(0.3, 0.8),
            ]}
          >
            {FEATURES.map((f, i) => (
              <View
                key={f.title}
                style={[
                  s.row,
                  i < FEATURES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.borderLight,
                  },
                ]}
              >
                <View style={[s.rowIcon, { backgroundColor: iconTint }]}>
                  <Ionicons name={f.icon} size={18} color={theme.primary} />
                </View>
                <View style={s.rowText}>
                  <Text style={[s.rowTitle, { color: theme.text }]}>{f.title}</Text>
                  <Text style={[s.rowBody, { color: theme.textTertiary }]}>{f.body}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

        <Animated.View style={[s.ctaBlock, stage(0.5, 1)]}>
          <PressScale
            onPress={() => router.push('/(auth)/sign-up')}
            label="Get started"
          >
            <View style={[s.primaryBtn, { backgroundColor: theme.primary }]}>
              <Text style={[s.primaryLabel, { color: theme.bg }]}>Get started</Text>
            </View>
          </PressScale>

          <PressScale
            onPress={() => router.push('/(auth)/sign-in')}
            label="Sign in to an existing account"
          >
            <View
              style={[
                s.secondaryBtn,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
            >
              <Text style={[s.secondaryLabel, { color: theme.text }]}>
                I already have an account
              </Text>
            </View>
          </PressScale>

          <Text style={[s.footerNote, { color: theme.textTertiary }]}>
            Free to start. No credit card needed.
          </Text>
        </Animated.View>
      </View>
    </ScreenBackground>
  );
}

// Springy press feedback, same feel as iOS buttons.
function PressScale({
  onPress,
  label,
  children,
}: {
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.lg },
  content: { flex: 1, justifyContent: 'center', gap: space.xl },

  logoBlock: { alignItems: 'center' },
  logoWrap: {
    width: 136,
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    opacity: 0.06,
  },
  haloInner: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.1,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  logoGlyph: { fontSize: 25, fontWeight: '800' },
  logoText: {
    marginTop: -14,
    fontSize: type.h1,
    fontWeight: '700',
    letterSpacing: -0.4,
  },

  headline: { alignItems: 'center', gap: 10 },
  h1: {
    fontSize: type.display + 4,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: type.display + 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: type.body,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: space.sm,
  },

  group: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: space.md,
    paddingVertical: 13,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: type.body, fontWeight: '600' },
  rowBody: { fontSize: type.bodySmall },

  ctaBlock: { gap: 10 },
  primaryBtn: {
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontSize: type.body, fontWeight: '700', letterSpacing: -0.2 },
  secondaryBtn: {
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryLabel: { fontSize: type.body, fontWeight: '600' },
  footerNote: { textAlign: 'center', fontSize: 11.5, marginTop: 4 },
});