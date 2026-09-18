// app/(tabs)/progress.tsx — XP, streaks, achievements
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ErrorState } from "../../src/components/ErrorState";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import {
    getAllAchievements,
    getLearningStats,
    getUserAchievements,
    getUserStats,
    getWeeklyActivity,
} from "../../src/lib/db";
import { radius, space, type } from "../../src/themes";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function ProgressScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [learningStats, setLearningStats] = useState({
    quizzesPassed: 0,
    projectsSubmitted: 0,
    coursesCompleted: 0,
  });
  const [weekly, setWeekly] = useState<any[]>([]);
  const [earned, setEarned] = useState<any[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authUser) return;
    setError(null);
    try {
      const [s1, w, e, a, ls] = await Promise.all([
        getUserStats(authUser.uid),
        getWeeklyActivity(authUser.uid),
        getUserAchievements(authUser.uid),
        getAllAchievements(),
        getLearningStats(authUser.uid),
      ]);
      setStats(s1);
      setWeekly(w);
      setEarned(e);
      setAllAchievements(a);
      setLearningStats(ls);
    } catch (err) {
      console.error("Progress load error:", err);
      setError(
        "Couldn't load your progress. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ScreenBackground style={s.center}>
        <ActivityIndicator color={theme.primary} />
      </ScreenBackground>
    );
  }

  if (error) {
    return (
      <ScreenBackground>
        <ErrorState message={error} onRetry={load} />
      </ScreenBackground>
    );
  }

  const earnedIds = new Set(earned.map((e) => e.achievement_id));
  const maxMinutes = Math.max(...weekly.map((d) => d.minutesLearned ?? 0), 1);

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.titleRow}>
          <Text style={[s.title, { color: theme.text }]}>Progress</Text>
          <TouchableOpacity
            style={[
              s.leaderboardBtn,
              {
                backgroundColor: isDark
                  ? "rgba(35, 27, 46, 0.82)"
                  : theme.surfaceStrong,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push("/leaderboard")}
          >
            <Ionicons name="podium" size={14} color={theme.primary} />
            <Text style={[s.leaderboardBtnText, { color: theme.primary }]}>
              Rankings
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          <StatCard
            icon="flash"
            label="Total XP"
            value={stats?.total_xp ?? 0}
            theme={theme}
          />
          <StatCard
            icon="flame"
            label="Streak"
            value={stats?.current_streak_days ?? 0}
            theme={theme}
          />
          <StatCard
            icon="trophy"
            label="Best"
            value={stats?.longest_streak_days ?? 0}
            theme={theme}
          />
        </View>

        <View style={s.statsRow}>
          <StatCard
            icon="help-circle"
            label="Quizzes passed"
            value={learningStats.quizzesPassed}
            theme={theme}
          />
          <StatCard
            icon="construct"
            label="Projects"
            value={learningStats.projectsSubmitted}
            theme={theme}
          />
          <StatCard
            icon="school"
            label="Courses done"
            value={learningStats.coursesCompleted}
            theme={theme}
          />
        </View>

        <View
          style={[
            s.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>
            This week
          </Text>
          <View style={s.weekBar}>
            {weekly.map((day, i) => {
              const h = Math.max(
                16,
                Math.round((day.minutesLearned / maxMinutes) * 62),
              );
              const isToday = i === weekly.length - 1;
              return (
                <View key={i} style={s.weekDay}>
                  <View style={s.barContainer}>
                    <View
                      style={[
                        s.bar,
                        {
                          height: h,
                          backgroundColor: day.goalMet
                            ? theme.success
                            : isToday
                              ? theme.primary
                              : theme.bgTertiary,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      s.dayLabel,
                      { color: isToday ? theme.primary : theme.textTertiary },
                    ]}
                  >
                    {DAY_LABELS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text
          style={[s.sectionTitle, { color: theme.textTertiary, marginTop: 2 }]}
        >
          Achievements
        </Text>
        <View style={s.achievementGrid}>
          {allAchievements.map((a) => {
            const isEarned = earnedIds.has(a.id);
            return (
              <View
                key={a.id}
                style={[
                  s.achievementCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(24, 18, 32, 0.88)"
                      : theme.surface,
                    borderColor: theme.border,
                  },
                  !isEarned && { opacity: 0.4 },
                ]}
              >
                <View
                  style={[
                    s.achievementIcon,
                    {
                      backgroundColor: isEarned
                        ? theme.primaryLight + "22"
                        : theme.bgTertiary,
                    },
                  ]}
                >
                  <Ionicons
                    name={a.icon as any}
                    size={18}
                    color={isEarned ? theme.primary : theme.textTertiary}
                  />
                </View>
                <Text style={[s.achievementName, { color: theme.text }]}>
                  {a.name}
                </Text>
                <Text
                  style={[s.achievementDesc, { color: theme.textTertiary }]}
                  numberOfLines={2}
                >
                  {a.description}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

function StatCard({
  icon,
  label,
  value,
  theme,
}: {
  icon: any;
  label: string;
  value: number;
  theme: any;
}) {
  return (
    <View
      style={[
        s.statCard,
        {
          backgroundColor: theme.surfaceStrong,
          borderColor: theme.border,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={theme.primary} />
      <Text style={[s.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: theme.textTertiary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: 110,
    gap: space.md,
  },
  title: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.5 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leaderboardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  leaderboardBtnText: { fontSize: type.caption, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 9 },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 5,
  },
  statValue: { fontSize: type.h1, fontWeight: "800" },
  statLabel: { fontSize: 10.5, fontWeight: "500" },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.md },
  sectionTitle: { fontSize: type.caption, fontWeight: "600", marginBottom: 10 },
  weekBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 88,
  },
  weekDay: { flex: 1, alignItems: "center", gap: 6 },
  barContainer: { height: 64, justifyContent: "flex-end" },
  bar: { width: 14, borderRadius: 7 },
  dayLabel: { fontSize: 10, fontWeight: "500" },
  achievementGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
  achievementCard: {
    width: "47%",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    gap: 5,
  },
  achievementIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementName: {
    fontSize: type.bodySmall,
    fontWeight: "700",
    marginTop: 3,
  },
  achievementDesc: { fontSize: 10.5, lineHeight: 14 },
});
