// app/(tabs)/index.tsx — home dashboard
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
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
import { getHomeData, getWeeklyActivity } from "../../src/lib/db";
import { radius, space, type } from "../../src/themes";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type HomeData = Awaited<ReturnType<typeof getHomeData>>;
type WeeklyData = Awaited<ReturnType<typeof getWeeklyActivity>>;

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user: authUser } = useAuth();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyData>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const load = useCallback(async () => {
    if (!authUser) return;
    setError(null);
    try {
      const [data, weekly] = await Promise.all([
        getHomeData(authUser.uid),
        getWeeklyActivity(authUser.uid),
      ]);
      setHomeData(data);
      setWeeklyActivity(weekly);
    } catch (e) {
      console.error("Home data error:", e);
      setError(
        "Couldn't load your dashboard. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ScreenBackground style={s.center}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[s.loadingText, { color: theme.textTertiary }]}>
          Loading...
        </Text>
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

  const { user, enrolledCourses, todayActivity } = homeData ?? {};
  const dailyGoalMinutes = user?.daily_goal_minutes ?? 20;
  const todayMinutes = todayActivity?.minutes_learned ?? 0;
  const goalPct = Math.min(
    100,
    Math.round((todayMinutes / dailyGoalMinutes) * 100),
  );
  const lessonsToday = todayActivity?.lessons_completed ?? 0;
  const xpToday = todayActivity?.xp_earned ?? 0;
  const maxMinutes = Math.max(
    ...weeklyActivity.map((d) => d.minutesLearned ?? 0),
    1,
  );

  return (
    <ScreenBackground>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={theme.primary}
          />
        }
      >
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: theme.textTertiary }]}>
              {greeting}
            </Text>
            <Text style={[s.username, { color: theme.text }]}>
              {user?.username ?? "Learner"}
            </Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity
              style={[
                s.iconButton,
                {
                  backgroundColor: isDark ? theme.surface : theme.bgTertiary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push("/(tabs)/ai")}
            >
              <Ionicons
                name="notifications-outline"
                size={19}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {(user?.current_streak_days ?? 0) > 0 && (
              <View
                style={[
                  s.streakBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(246, 190, 53, 0.12)"
                      : theme.surfaceStrong,
                    borderColor: isDark
                      ? "rgba(246, 190, 53, 0.26)"
                      : theme.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 12 }}>🔥</Text>
                <Text style={[s.streakText, { color: theme.warning }]}>
                  {user?.current_streak_days}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            s.heroCard,
            {
              backgroundColor: isDark
                ? "rgba(28, 22, 36, 0.95)"
                : theme.surfaceStrong,
              borderColor: theme.border,
              shadowColor: isDark ? "#000000" : theme.primary,
              shadowOpacity: isDark ? 0.28 : 0.08,
              shadowRadius: isDark ? 18 : 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: isDark ? 8 : 4,
            },
          ]}
        >
          <View style={s.heroTopRow}>
            <View
              style={[
                s.heroBadge,
                {
                  backgroundColor: theme.primary + "18",
                  borderColor: theme.primary + "30",
                },
              ]}
            >
              <Text style={[s.heroKicker, { color: theme.primary }]}>
                Level
              </Text>
            </View>
            <Text style={[s.heroLevel, { color: theme.primary }]}>
              Lvl {Math.max(1, Math.floor((user?.total_xp ?? 0) / 250) + 1)}
            </Text>
          </View>
          <Text style={[s.heroTitle, { color: theme.text }]}>
            {user?.total_xp?.toLocaleString() ?? 0} XP
          </Text>
          <Text style={[s.heroSubtitle, { color: theme.textTertiary }]}>
            Keep your momentum going.
          </Text>
          <View style={s.heroStatsRow}>
            <HeroStat value={xpToday} label="today" theme={theme} />
            <HeroStat value={lessonsToday} label="lessons" theme={theme} />
            <HeroStat
              value={user?.longest_streak_days ?? 0}
              label="best"
              theme={theme}
            />
          </View>
        </View>

        <View
          style={[
            s.goalCard,
            {
              backgroundColor: isDark
                ? "rgba(27, 20, 35, 0.88)"
                : theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={s.goalTop}>
            <Text style={[s.goalLabel, { color: theme.textTertiary }]}>
              Daily goal
            </Text>
            <Text style={[s.goalPct, { color: theme.primary }]}>
              {goalPct}%
            </Text>
          </View>
          <View style={[s.progressBar, { backgroundColor: theme.bgTertiary }]}>
            <View
              style={[
                s.progressFill,
                { width: `${goalPct}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>
          <View style={s.goalBottom}>
            <Text style={[s.goalSub, { color: theme.textTertiary }]}>
              {todayMinutes} / {dailyGoalMinutes} min
            </Text>
            {goalPct >= 100 && (
              <View
                style={[
                  s.goalDoneBadge,
                  {
                    backgroundColor: theme.success + "20",
                    borderColor: theme.success + "40",
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={11}
                  color={theme.success}
                />
                <Text style={[s.goalDoneText, { color: theme.success }]}>
                  Goal met
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            s.weeklyCard,
            {
              backgroundColor: isDark ? "rgba(25, 19, 32, 0.9)" : theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>
            This week
          </Text>
          <View style={s.weekBar}>
            {weeklyActivity.map((day, i) => {
              const h = Math.max(
                16,
                Math.round((day.minutesLearned / maxMinutes) * 52),
              );
              const isToday = i === weeklyActivity.length - 1;
              return (
                <View key={i} style={s.weekDay}>
                  <View style={s.barContainer}>
                    <View
                      style={[
                        s.bar,
                        {
                          height: h,
                          backgroundColor: isToday
                            ? theme.primary
                            : theme.bgTertiary,
                        },
                        day.goalMet && { backgroundColor: theme.success },
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

        {enrolledCourses && enrolledCourses.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>
              Continue learning
            </Text>
            {enrolledCourses
              .slice(0, 5)
              .map(({ enrollment, course, category, instructor }) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    s.lessonCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(24, 18, 32, 0.9)"
                        : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/course/[courseId]",
                      params: { courseId: course.id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.courseIconDot,
                      {
                        backgroundColor: `${category.color}15`,
                        borderColor: `${category.color}30`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={17}
                      color={category.color}
                    />
                  </View>
                  <View style={s.lessonInfo}>
                    <Text style={[s.lessonTitle, { color: theme.text }]}>
                      {course.title}
                    </Text>
                    <Text style={[s.lessonTag, { color: theme.textTertiary }]}>
                      {instructor.name} · {course.duration_minutes} min
                    </Text>
                    <View style={s.miniProgressRow}>
                      <View
                        style={[
                          s.miniBar,
                          { backgroundColor: theme.bgTertiary },
                        ]}
                      >
                        <View
                          style={[
                            s.miniFill,
                            {
                              width: `${enrollment.progress_percent}%`,
                              backgroundColor: theme.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[s.miniPct, { color: theme.textTertiary }]}>
                        {enrollment.progress_percent}%
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="play-circle"
                    size={22}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              ))}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function HeroStat({
  value,
  label,
  theme,
}: {
  value: number;
  label: string;
  theme: any;
}) {
  return (
    <View
      style={[
        s.heroStat,
        { backgroundColor: theme.bgTertiary, borderColor: theme.borderLight },
      ]}
    >
      <Text style={[s.heroStatValue, { color: theme.text }]}>{value}</Text>
      <Text style={[s.heroStatLabel, { color: theme.textTertiary }]}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    gap: space.md,
    paddingBottom: 110,
  },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: type.bodySmall },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { fontSize: type.bodySmall, marginBottom: 3 },
  username: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  streakText: { fontSize: type.caption, fontWeight: "700" },

  heroCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: space.lg,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroKicker: { fontSize: type.caption, fontWeight: "700" },
  heroLevel: { fontSize: type.caption, fontWeight: "700" },
  heroTitle: {
    fontSize: type.display + 2,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubtitle: { fontSize: type.bodySmall, lineHeight: 18, marginBottom: 4 },
  heroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  heroStat: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
  },
  heroStatValue: { fontSize: type.h1, fontWeight: "800" },
  heroStatLabel: { fontSize: type.caption, marginTop: 3, fontWeight: "500" },

  goalCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
    gap: 10,
  },
  goalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: { fontSize: type.caption, fontWeight: "500" },
  goalPct: { fontSize: type.h2, fontWeight: "800" },
  progressBar: { height: 7, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  goalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalSub: { fontSize: type.caption },
  goalDoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  goalDoneText: { fontSize: 9.5, fontWeight: "700" },

  weeklyCard: { borderRadius: radius.lg, borderWidth: 1, padding: space.md },
  sectionTitle: { fontSize: type.caption, fontWeight: "600", marginBottom: 10 },
  weekBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 78,
  },
  weekDay: { flex: 1, alignItems: "center", gap: 6 },
  barContainer: { height: 55, justifyContent: "flex-end" },
  bar: { width: 14, borderRadius: 7 },
  dayLabel: { fontSize: 10, fontWeight: "500" },

  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 11,
  },
  courseIconDot: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  lessonInfo: { flex: 1, gap: 5 },
  lessonTitle: { fontSize: type.body, fontWeight: "700" },
  lessonTag: { fontSize: type.caption },
  miniProgressRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  miniBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  miniFill: { height: "100%", borderRadius: 2 },
  miniPct: { fontSize: 10, fontWeight: "500" },
});
