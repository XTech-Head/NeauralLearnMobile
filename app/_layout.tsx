// app/_layout.tsx — root layout: Firebase auth gate + navigation stack
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { useTheme } from "../src/hooks/useTheme";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, isVerified, needsOnboarding } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;

    const currentSegment = segments[0] as string | undefined;
    const inAuthGroup = currentSegment === "(auth)";
    const onOnboarding = currentSegment === "onboarding";

    if (!isSignedIn) {
      if (!inAuthGroup) router.replace("/(auth)/sign-in");
      return;
    }

    // Signed in but not verified yet: leave them wherever the auth flow put
    // them (normally (auth)/verify), but don't let a stray deep link land
    // an unverified user in the app proper.
    if (!isVerified) {
      if (!inAuthGroup) router.replace("/(auth)/verify");
      return;
    }

    // Verified. Don't redirect until we know whether onboarding is needed —
    // needsOnboarding starts null and resolves shortly after verification.
    if (needsOnboarding === null) return;

    if (needsOnboarding) {
      if (!onOnboarding) router.replace("/onboarding" as any);
      return;
    }

    // Fully set up — make sure we're not stuck in auth or onboarding.
    if (inAuthGroup || onOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isLoaded, isSignedIn, isVerified, needsOnboarding, router, segments]);

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function ThemedStack() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: theme.bg },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>
            <ThemedStack />
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
