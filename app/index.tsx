// app/index.tsx — welcome / splash screen
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenBackground } from '../src/components/ScreenBackground';
import { useTheme } from '../src/hooks/useTheme';
import { radius, space, type } from '../src/themes';

export default function WelcomeScreen() {
  const { theme, isDark } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const btnScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, delay: 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePrimaryPress = () => {
    Animated.sequence([
      Animated.timing(btnScaleAnim, { toValue: 0.96, duration: 90, useNativeDriver: true }),
      Animated.timing(btnScaleAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
    setTimeout(() => router.push('/(auth)/sign-up'), 130);
  };

  return (
    <ScreenBackground>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <View style={s.root}>
        <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.logoBlock}>
            <View style={[s.logoBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[s.logoGlyph, { color: theme.bg }]}>N</Text>
            </View>
            <Text style={[s.logoText, { color: theme.text }]}>
              Neural<Text style={{ color: theme.primary }}>Learn</Text>
            </Text>
          </View>

          <View style={s.headline}>
            <Text style={[s.h1, { color: theme.text }]}>Master AI Learning</Text>
            <Text style={[s.subtitle, { color: theme.textTertiary }]}>
              Personalized lessons and an AI tutor that talks, listens, and reads along with you.
            </Text>
          </View>

          <View style={s.featureGrid}>
            <FeaturePill icon="📚" label="Structured curriculum" theme={theme} />
            <FeaturePill icon="🎙️" label="Talk to your AI tutor" theme={theme} />
            <FeaturePill icon="🎯" label="Personalized path" theme={theme} />
          </View>
        </Animated.View>

        <Animated.View style={[s.ctaBlock, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={handlePrimaryPress} activeOpacity={0.85}>
            <Animated.View style={[s.primaryBtn, { backgroundColor: theme.primary, transform: [{ scale: btnScaleAnim }] }]}>
              <Text style={[s.primaryLabel, { color: theme.bg }]}>Get Started</Text>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} activeOpacity={0.7}>
            <View style={[s.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={[s.secondaryLabel, { color: theme.text }]}>Sign In</Text>
            </View>
          </TouchableOpacity>

          <Text style={[s.footerNote, { color: theme.textTertiary }]}>
            No credit card required · Free to start
          </Text>
        </Animated.View>
      </View>
    </ScreenBackground>
  );
}

function FeaturePill({ icon, label, theme }: { icon: string; label: string; theme: any }) {
  return (
    <View style={[s.pill, { backgroundColor: theme.surfaceStrong, borderColor: theme.borderLight }]}>
      <Text style={s.pillIcon}>{icon}</Text>
      <Text style={[s.pillLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.lg },
  content: { gap: space.xl },
  logoBlock: { alignItems: 'center', gap: 10 },
  logoBadge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoGlyph: { fontSize: 22, fontWeight: '800' },
  logoText: { fontSize: type.h1, fontWeight: '700', letterSpacing: -0.4 },
  headline: { alignItems: 'center', gap: 10 },
  h1: { fontSize: type.display + 8, fontWeight: '800', letterSpacing: -0.8, lineHeight: type.display + 14, textAlign: 'center' },
  subtitle: { fontSize: type.body, lineHeight: 21, textAlign: 'center', paddingHorizontal: space.sm },
  featureGrid: { gap: 9 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: space.md, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1 },
  pillIcon: { fontSize: 17 },
  pillLabel: { fontSize: type.bodySmall, fontWeight: '500' },
  ctaBlock: { gap: 10 },
  primaryBtn: { paddingVertical: 15, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { fontSize: type.body, fontWeight: '700', letterSpacing: -0.2 },
  secondaryBtn: { paddingVertical: 13, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  secondaryLabel: { fontSize: type.body, fontWeight: '600' },
  footerNote: { textAlign: 'center', fontSize: 10.5, marginTop: 4 },
});
