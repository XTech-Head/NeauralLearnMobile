// app/(tabs)/learn.tsx — your enrolled courses & continue-learning list
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import {
    getBookmarkedCourses,
    getHomeData,
    getUserProjectSubmissions,
} from "../../src/lib/db";
import { radius, space, type } from "../../src/themes";

export default function LearnScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user: authUser } = useAuth();
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authUser) return;
    setError(null);
    try {
      const [data, subs, bookmarks] = await Promise.all([
        getHomeData(authUser.uid),
        getUserProjectSubmissions(authUser.uid),
        getBookmarkedCourses(authUser.uid),
      ]);
      setEnrolled(data?.enrolledCourses ?? []);
      setProjects(subs);
      setSaved(bookmarks);
    } catch (e) {
      console.error("Learn load error:", e);
      setError(
        "Couldn't load your courses. Check your connection and try again.",
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

  return (
    <ScreenBackground>
      <ScrollView
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
        <Text style={[s.title, { color: theme.text }]}>My Learning</Text>

        {enrolled.length === 0 ? (
          <View style={s.emptyState}>
            <View
              style={[
                s.emptyIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(150, 122, 255, 0.18)"
                    : theme.primaryLight + "22",
                },
              ]}
            >
              <Ionicons name="book-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>
              No courses yet
            </Text>
            <Text style={[s.emptySubtitle, { color: theme.textTertiary }]}>
              Head to Explore to find something to learn.
            </Text>
            <TouchableOpacity
              style={[s.exploreBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/explore")}
            >
              <Text style={[s.exploreBtnText, { color: theme.bg }]}>
                Explore courses
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.list}>
            {enrolled.map(({ enrollment, course, category, instructor }) => (
              <TouchableOpacity
                key={course.id}
                style={[
                  s.card,
                  {
                    backgroundColor: isDark
                      ? "rgba(22, 17, 29, 0.92)"
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
                <View style={s.cardTop}>
                  <View
                    style={[
                      s.cardIcon,
                      {
                        backgroundColor: `${category?.color ?? theme.primary}15`,
                        borderColor: `${category?.color ?? theme.primary}30`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={(category?.icon ?? "book") as any}
                      size={18}
                      color={category?.color ?? theme.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: theme.text }]}>
                      {course.title}
                    </Text>
                    <Text style={[s.cardSub, { color: theme.textTertiary }]}>
                      {instructor?.name} · {course.duration_minutes} min
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    s.progressBar,
                    {
                      backgroundColor: isDark
                        ? "rgba(10, 8, 15, 0.9)"
                        : theme.bgTertiary,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${enrollment.progress_percent}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[s.progressLabel, { color: theme.textTertiary }]}>
                  {enrollment.progress_percent}% complete
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {saved.length > 0 && (
          <>
            <Text style={[s.subTitle, { color: theme.textTertiary }]}>
              Saved for later
            </Text>
            <View style={s.list}>
              {saved.map((bm) => (
                <TouchableOpacity
                  key={bm.id}
                  style={[
                    s.card,
                    {
                      backgroundColor: isDark
                        ? "rgba(22, 17, 29, 0.92)"
                        : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/course/[courseId]",
                      params: { courseId: bm.course.id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={s.cardTop}>
                    <View
                      style={[
                        s.cardIcon,
                        {
                          backgroundColor: `${bm.course.category?.color ?? theme.primary}15`,
                          borderColor: `${bm.course.category?.color ?? theme.primary}30`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={(bm.course.category?.icon ?? "book") as any}
                        size={18}
                        color={bm.course.category?.color ?? theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cardTitle, { color: theme.text }]}>
                        {bm.course.title}
                      </Text>
                      <Text style={[s.cardSub, { color: theme.textTertiary }]}>
                        {bm.course.instructor?.name} ·{" "}
                        {bm.course.duration_minutes} min
                      </Text>
                    </View>
                    <Ionicons name="bookmark" size={16} color={theme.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {projects.length > 0 && (
          <>
            <Text style={[s.subTitle, { color: theme.textTertiary }]}>
              My Projects
            </Text>
            <View style={s.list}>
              {projects.map((sub) => (
                <View
                  key={sub.id}
                  style={[
                    s.projectCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(22, 17, 29, 0.92)"
                        : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.projectIcon,
                      { backgroundColor: theme.success + "18" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={theme.success}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: theme.text }]}>
                      {sub.project?.title}
                    </Text>
                    <Text style={[s.cardSub, { color: theme.textTertiary }]}>
                      {sub.project?.course?.title}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: 110,
    gap: space.lg,
  },
  title: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.5 },
  subTitle: { fontSize: type.caption, fontWeight: "600", marginTop: 2 },
  emptyState: { alignItems: "center", paddingTop: 50, gap: 5 },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: { fontSize: type.h1, fontWeight: "700" },
  emptySubtitle: { fontSize: type.bodySmall, textAlign: "center" },
  exploreBtn: {
    marginTop: 14,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  exploreBtnText: { fontSize: type.body, fontWeight: "700" },
  list: { gap: 11 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 13, gap: 9 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardTitle: { fontSize: type.h2, fontWeight: "700" },
  cardSub: { fontSize: type.caption, marginTop: 2 },
  progressBar: { height: 5, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  progressLabel: { fontSize: 10.5, fontWeight: "500" },
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 13,
  },
  projectIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
