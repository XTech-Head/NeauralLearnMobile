// app/(auth)/verify.tsx — Firebase email verification gate
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { GhostButton, LogoMark, PrimaryButton } from "../../components/AuthUI";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { authStyles as s } from "../../src/styles/authStyles";

export default function VerifyPage() {
  const { theme } = useTheme();
  const { user, resendVerification, refreshUser, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resent, setResent] = useState(false);

  // Navigation once verified (straight to tabs, or to onboarding first if
  // it hasn't been done yet) is handled centrally by the root layout's
  // AuthGate, which also knows about onboarding state — this screen just
  // needs to keep polling so `isVerified` actually flips.
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckNow = async () => {
    setChecking(true);
    await refreshUser();
    setChecking(false);
  };

  const handleResend = async () => {
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {
      Alert.alert("Couldn't resend", "Please try again in a minute.");
    }
  };

  return (
    <ScreenBackground>
      <View style={[s.scroll, { justifyContent: "center" }]}>
        <View style={[s.card, { alignItems: "center" }]}>
          <LogoMark />
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: theme.primaryLight + "22", alignItems: "center", justifyContent: "center", marginVertical: 18 }}>
            <Ionicons name="mail-outline" size={28} color={theme.primary} />
          </View>
          <Text style={[s.title, { color: theme.text, textAlign: "center" }]}>Check your inbox</Text>
          <Text style={[s.subtitle, { color: theme.textTertiary, textAlign: "center" }]}>
            We sent a verification link to{"\n"}
            <Text style={{ color: theme.text, fontWeight: "600" }}>{user?.email}</Text>
          </Text>

          <View style={[s.form, { width: "100%", marginTop: 6 }]}>
            <PrimaryButton label={checking ? "Checking..." : "I've verified"} onPress={handleCheckNow} loading={checking} />
            <GhostButton label={resent ? "Email sent!" : "Resend email"} onPress={handleResend} />
          </View>

          <View style={s.footerRow}>
            <Text style={[s.footerLink, { color: theme.primary }]} onPress={signOut}>
              Use a different account
            </Text>
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}