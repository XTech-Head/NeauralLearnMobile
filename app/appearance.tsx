// app/appearance.tsx — light / dark / system theme picker
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenBackground } from "../src/components/ScreenBackground";
import { useThemePreference, type ThemePreference } from "../src/context/ThemeContext";
import { useTheme } from "../src/hooks/useTheme";
import { radius, space, type } from "../src/themes";

const OPTIONS: { value: ThemePreference; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "light", label: "Light", sub: "White background, purple accents", icon: "sunny" },
  { value: "dark", label: "Dark", sub: "Black to purple gradient", icon: "moon" },
  { value: "system", label: "System", sub: "Match your device setting", icon: "phone-portrait" },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <ScreenBackground>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>Appearance</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.content}>
        {OPTIONS.map((opt) => {
          const selected = preference === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                s.row,
                { backgroundColor: theme.surface, borderColor: selected ? theme.primary : theme.border },
                selected && { backgroundColor: theme.primaryLight + "14" },
              ]}
              onPress={() => setPreference(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[s.iconWrap, { backgroundColor: theme.bgTertiary }]}>
                <Ionicons name={opt.icon} size={19} color={selected ? theme.primary : theme.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: theme.text }]}>{opt.label}</Text>
                <Text style={[s.sub, { color: theme.textTertiary }]}>{opt.sub}</Text>
              </View>
              {selected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingBottom: space.sm },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  title: { fontSize: type.h1 + 2, fontWeight: "800" },
  content: { paddingHorizontal: space.md, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.lg, borderWidth: 1.5, padding: 14 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: type.body, fontWeight: "700" },
  sub: { fontSize: type.caption, marginTop: 2 },
});