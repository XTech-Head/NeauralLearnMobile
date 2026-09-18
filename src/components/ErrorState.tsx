// src/components/ErrorState.tsx — shown instead of a stuck spinner or empty
// list when a fetch fails, with a way to actually recover.
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { radius, space, type } from "../themes";

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  /** Set while a retry is in flight, so the button shows a busy state. */
  retrying?: boolean;
  /** Renders compact (no icon, less padding) — for inline sections rather than a full screen. */
  compact?: boolean;
}

export function ErrorState({
  message = "Something went wrong loading this.",
  onRetry,
  retrying,
  compact,
}: ErrorStateProps) {
  const { theme } = useTheme();

  if (compact) {
    return (
      <View style={[s.compactRoot, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[s.compactText, { color: theme.textSecondary }]}>{message}</Text>
        <TouchableOpacity onPress={onRetry} disabled={retrying}>
          <Text style={[s.retryLinkText, { color: theme.primary }]}>
            {retrying ? "Retrying..." : "Retry"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={[s.iconWrap, { backgroundColor: theme.danger + "18" }]}>
        <Ionicons name="cloud-offline-outline" size={26} color={theme.danger} />
      </View>
      <Text style={[s.title, { color: theme.text }]}>Couldn&apos;t load this</Text>
      <Text style={[s.message, { color: theme.textTertiary }]}>{message}</Text>
      <TouchableOpacity
        style={[s.retryBtn, { backgroundColor: theme.primary, opacity: retrying ? 0.6 : 1 }]}
        onPress={onRetry}
        disabled={retrying}
      >
        <Ionicons name="refresh" size={15} color={theme.bg} />
        <Text style={[s.retryBtnText, { color: theme.bg }]}>{retrying ? "Retrying..." : "Try again"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: space.xl, gap: 4 },
  iconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  title: { fontSize: type.h1, fontWeight: "700" },
  message: { fontSize: type.bodySmall, textAlign: "center", lineHeight: 19, marginTop: 4 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18 },
  retryBtnText: { fontSize: type.bodySmall, fontWeight: "700" },

  compactRoot: { borderRadius: radius.md, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  compactText: { flex: 1, fontSize: type.bodySmall },
  retryLinkText: { fontSize: type.bodySmall, fontWeight: "700" },
});