// app/leaderboard.tsx — top learners by total XP
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenBackground } from "../src/components/ScreenBackground";
import { ErrorState } from "../src/components/ErrorState";
import { useTheme } from "../src/hooks/useTheme";
import { getLeaderboard } from "../src/lib/db";
import { radius, space, type } from "../src/themes";

const MEDAL_COLORS = ["#FCD34D", "#C4C4C4", "#D08A5A"];

export default function LeaderboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getLeaderboard(20);
      setRows(data);
    } catch (e) {
      console.error("Leaderboard load error:", e);
      setError("Couldn't load the leaderboard. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenBackground>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>Leaderboard</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {rows.map((row, i) => (
            <View key={row.id} style={[s.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={s.rankWrap}>
                {i < 3 ? (
                  <Ionicons name="medal" size={20} color={MEDAL_COLORS[i]} />
                ) : (
                  <Text style={[s.rankText, { color: theme.textTertiary }]}>{i + 1}</Text>
                )}
              </View>
              <View style={[s.avatar, { backgroundColor: theme.primaryLight }]}>
                <Text style={[s.avatarText, { color: theme.bg }]}>
                  {(row.username ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.username, { color: theme.text }]}>{row.username}</Text>
                {row.current_streak_days > 0 && (
                  <Text style={[s.streak, { color: theme.textTertiary }]}>
                    🔥 {row.current_streak_days} day streak
                  </Text>
                )}
              </View>
              <Text style={[s.xp, { color: theme.primary }]}>{row.total_xp?.toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingBottom: space.sm },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  title: { fontSize: type.h1 + 2, fontWeight: "800" },
  content: { paddingHorizontal: space.md, paddingBottom: 50, gap: 9 },
  row: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: radius.lg, borderWidth: 1, padding: 12 },
  rankWrap: { width: 24, alignItems: "center" },
  rankText: { fontSize: type.bodySmall, fontWeight: "700" },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: type.bodySmall, fontWeight: "800" },
  username: { fontSize: type.bodySmall, fontWeight: "700" },
  streak: { fontSize: 10.5, marginTop: 2 },
  xp: { fontSize: type.body, fontWeight: "800" },
});