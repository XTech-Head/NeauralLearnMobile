// app/(auth)/sign-in.tsx — Firebase email/password sign-in
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { AuthInput, LogoMark, PrimaryButton } from "../../components/AuthUI";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { authStyles as s } from "../../src/styles/authStyles";

function friendlyError(code: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email or password doesn't match our records.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a bit.";
    default:
      return "Something went wrong signing in. Please try again.";
  }
}

export default function SignInPage() {
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Enter both your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(friendlyError(e?.code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.kav}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              s.card,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <LogoMark />
            <Text style={[s.title, { color: theme.text }]}>Welcome back</Text>
            <Text style={[s.subtitle, { color: theme.textTertiary }]}>
              Sign in to keep your streak alive.
            </Text>

            <View style={s.form}>
              <AuthInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <AuthInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {error && (
                <Text style={[s.errorText, { color: theme.danger }]}>
                  {error}
                </Text>
              )}
              <PrimaryButton
                label="Sign In"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>

            <View style={s.footerRow}>
              <Text style={[s.footerText, { color: theme.textTertiary }]}>
                Don&apos;t have an account?{" "}
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <Text
                  style={StyleSheet.flatten([
                    s.footerLink,
                    { color: theme.primary },
                  ])}
                >
                  Sign up
                </Text>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
