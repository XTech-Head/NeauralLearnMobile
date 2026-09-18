// app/(auth)/sign-up.tsx — Firebase email/password sign-up
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
    case "auth/email-already-in-use":
      return "That email is already registered — try signing in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    default:
      return "Something went wrong creating your account. Please try again.";
  }
}

export default function SignUpPage() {
  const { theme } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
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
    if (!username || !email || !password) {
      setError("Fill in every field to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
      router.replace("/(auth)/verify");
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
            <Text style={[s.title, { color: theme.text }]}>
              Create your account
            </Text>
            <Text style={[s.subtitle, { color: theme.textTertiary }]}>
              Start learning in under a minute.
            </Text>

            <View style={s.form}>
              <AuthInput
                label="Username"
                placeholder="your_name"
                value={username}
                onChangeText={setUsername}
              />
              <AuthInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <AuthInput
                label="Password"
                placeholder="At least 6 characters"
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
                label="Create Account"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>

            <View style={s.footerRow}>
              <Text style={[s.footerText, { color: theme.textTertiary }]}>
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Text
                  style={StyleSheet.flatten([
                    s.footerLink,
                    { color: theme.primary },
                  ])}
                >
                  Sign in
                </Text>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
