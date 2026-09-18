// app/(tabs)/explore.tsx — browse courses by category
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ErrorState } from "../../src/components/ErrorState";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { getCourseToolRecommendations } from "../../src/lib/ai";
import {
    generateCourseFromUserPrompt,
    getAllCategories,
    getCompletedCourseIds,
    getCourses,
    getMyGeneratedCourses,
    getUserStats,
} from "../../src/lib/db";
import { radius, space, type } from "../../src/themes";

export default function ExploreScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user: authUser } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [duration, setDuration] = useState("45");
  const [generatedCourses, setGeneratedCourses] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authUser) return;
    setError(null);
    try {
      const [c, cat, completed, stats, myCourses] = await Promise.all([
        getCourses(),
        getAllCategories(),
        getCompletedCourseIds(authUser.uid),
        getUserStats(authUser.uid),
        getMyGeneratedCourses(authUser.uid),
      ]);
      setCourses(c);
      setCategories(cat);
      setCompletedCourseIds(completed);
      setInterestIds(stats?.interest_category_ids ?? []);
      setGeneratedCourses(myCourses);
    } catch (e) {
      console.error("Explore load error:", e);
      setError("Couldn't load courses. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  const recommended = courses.filter((c) =>
    interestIds.includes(c.category_id),
  );
  const showRecommended = recommended.length > 0 && !search && !activeCategory;

  const filtered = courses.filter((c) => {
    const matchesCategory = !activeCategory || c.category_id === activeCategory;
    const matchesSearch =
      !search || c.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGenerateCourse = async () => {
    if (!authUser || !prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const generated = await generateCourseFromUserPrompt(
        authUser.uid,
        prompt,
        {
          level: difficulty,
          durationMinutes: Number(duration) || 45,
          learningGoals: learningGoals
            .split(",")
            .map((goal) => goal.trim())
            .filter(Boolean),
        },
      );
      setPrompt("");
      setLearningGoals("");
      setDifficulty("beginner");
      setDuration("45");
      await load();
      if (generated?.course?.id) {
        router.push({
          pathname: "/course/[courseId]",
          params: { courseId: generated.course.id },
        });
      }
    } catch (e) {
      console.error("Generate course error:", e);
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't generate your course. Try a different prompt.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.title, { color: theme.text }]}>Explore</Text>

        <View
          style={[
            s.generatorCard,
            {
              backgroundColor: isDark
                ? "rgba(25, 19, 32, 0.92)"
                : theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[s.generatorLabel, { color: theme.textTertiary }]}>
            Generate a course from your idea
          </Text>
          <TextInput
            style={[
              s.generatorInput,
              {
                color: theme.text,
                backgroundColor: theme.bg,
                borderColor: theme.border,
              },
            ]}
            placeholder="e.g. AI for small business owners, Python for beginners, UI design for startups"
            placeholderTextColor={theme.textTertiary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />

          <Text style={[s.fieldLabel, { color: theme.textTertiary }]}>
            Level
          </Text>
          <View style={s.levelRow}>
            {(["beginner", "intermediate", "advanced"] as const).map(
              (level) => {
                const active = difficulty === level;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setDifficulty(level)}
                    style={[
                      s.levelChip,
                      {
                        backgroundColor: active
                          ? theme.primary
                          : isDark
                            ? "rgba(10, 8, 15, 0.9)"
                            : theme.bg,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.levelChipText,
                        { color: active ? theme.bg : theme.textSecondary },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>

          <View style={s.metaRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.fieldLabel, { color: theme.textTertiary }]}>
                Duration (mins)
              </Text>
              <TextInput
                style={[
                  s.metaInput,
                  {
                    color: theme.text,
                    backgroundColor: isDark ? "rgba(10, 8, 15, 0.9)" : theme.bg,
                    borderColor: theme.border,
                  },
                ]}
                keyboardType="number-pad"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>

          <Text style={[s.fieldLabel, { color: theme.textTertiary }]}>
            Learning goals
          </Text>
          <TextInput
            style={[
              s.generatorInput,
              {
                color: theme.text,
                backgroundColor: theme.bg,
                borderColor: theme.border,
              },
            ]}
            placeholder="Build a dashboard, master prompt design, ship a mini project"
            placeholderTextColor={theme.textTertiary}
            value={learningGoals}
            onChangeText={setLearningGoals}
            multiline
          />

          <TouchableOpacity
            style={[
              s.generateBtn,
              { backgroundColor: theme.primary },
              (!prompt.trim() || generating) && { opacity: 0.6 },
            ]}
            onPress={handleGenerateCourse}
            disabled={!prompt.trim() || generating}
          >
            <Text style={[s.generateBtnText, { color: theme.bg }]}>
              {generating ? "Generating..." : "Generate course"}
            </Text>
          </TouchableOpacity>
        </View>

        {generatedCourses.length > 0 && (
          <View style={{ gap: 9 }}>
            <Text style={[s.recommendedLabel, { color: theme.textTertiary }]}>
              My generated courses
            </Text>
            <View style={{ gap: 9 }}>
              {generatedCourses.map((course) => {
                const tools = getCourseToolRecommendations(course.title || "");
                return (
                  <View
                    key={course.id}
                    style={[
                      s.generatedCourseCard,
                      {
                        backgroundColor: isDark
                          ? "rgba(24, 18, 32, 0.9)"
                          : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/course/[courseId]",
                          params: { courseId: course.id },
                        })
                      }
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      {course.thumbnail_url ? (
                        <Image
                          source={{ uri: course.thumbnail_url }}
                          style={s.generatedThumb}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[s.cardTitle, { color: theme.text }]}>
                          {course.title}
                        </Text>
                        <Text
                          style={[
                            s.cardInstructor,
                            { color: theme.textTertiary },
                          ]}
                        >
                          {course.category?.name ?? "Custom"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={s.toolRow}>
                      {tools.slice(0, 2).map((tool) => (
                        <TouchableOpacity
                          key={tool.label}
                          onPress={() => Linking.openURL(tool.url)}
                          style={[
                            s.toolChip,
                            {
                              backgroundColor: isDark
                                ? "rgba(10, 8, 15, 0.9)"
                                : theme.bg,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.toolChipText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {tool.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View
          style={[
            s.searchBar,
            {
              backgroundColor: isDark
                ? "rgba(22, 18, 30, 0.9)"
                : theme.surfaceStrong,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search" size={15} color={theme.textTertiary} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search courses..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {showRecommended && (
          <View style={{ gap: 9 }}>
            <Text style={[s.recommendedLabel, { color: theme.textTertiary }]}>
              Recommended for you
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommended.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    s.recCard,
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
                  <Ionicons
                    name={(course.category?.icon ?? "book") as any}
                    size={16}
                    color={course.category?.color ?? theme.primary}
                  />
                  <Text
                    style={[s.recTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {course.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.catScroll}
        >
          <TouchableOpacity
            style={[
              s.catChip,
              {
                borderColor: theme.border,
                backgroundColor: !activeCategory
                  ? theme.primary
                  : isDark
                    ? "rgba(12, 10, 18, 0.9)"
                    : theme.bg,
              },
            ]}
            onPress={() => setActiveCategory(null)}
          >
            <Text
              style={[
                s.catChipText,
                { color: !activeCategory ? theme.bg : theme.textSecondary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  s.catChip,
                  {
                    borderColor: theme.border,
                    backgroundColor: active
                      ? theme.primary
                      : isDark
                        ? "rgba(12, 10, 18, 0.9)"
                        : theme.bg,
                  },
                ]}
                onPress={() => setActiveCategory(active ? null : cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={12}
                  color={active ? theme.bg : cat.color}
                />
                <Text
                  style={[
                    s.catChipText,
                    { color: active ? theme.bg : theme.textSecondary },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={load} compact />
        ) : filtered.length === 0 ? (
          <Text style={[s.emptyText, { color: theme.textTertiary }]}>
            No courses match yet.
          </Text>
        ) : (
          <View style={s.grid}>
            {filtered.map((course) => {
              const locked =
                !!course.prerequisite_course_id &&
                !completedCourseIds.has(course.prerequisite_course_id);
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    s.card,
                    {
                      backgroundColor: isDark
                        ? "rgba(24, 18, 32, 0.9)"
                        : theme.surface,
                      borderColor: theme.border,
                    },
                    locked && { opacity: 0.55 },
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
                      s.cardIcon,
                      {
                        backgroundColor: `${course.category?.color ?? theme.primary}15`,
                        borderColor: `${course.category?.color ?? theme.primary}30`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        locked
                          ? "lock-closed"
                          : ((course.category?.icon ?? "book") as any)
                      }
                      size={18}
                      color={course.category?.color ?? theme.primary}
                    />
                  </View>
                  <Text
                    style={[s.cardTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {course.title}
                  </Text>
                  {locked ? (
                    <Text
                      style={[s.cardInstructor, { color: theme.textTertiary }]}
                      numberOfLines={1}
                    >
                      Requires: {course.prerequisite?.title}
                    </Text>
                  ) : (
                    <Text
                      style={[s.cardInstructor, { color: theme.textTertiary }]}
                    >
                      {course.instructor?.name}
                    </Text>
                  )}
                  <View style={s.cardFooter}>
                    <View style={s.cardStat}>
                      <Ionicons name="star" size={10} color={theme.warning} />
                      <Text
                        style={[s.cardStatText, { color: theme.textSecondary }]}
                      >
                        {course.rating}
                      </Text>
                    </View>
                    <Text
                      style={[s.cardStatText, { color: theme.textTertiary }]}
                    >
                      {course.duration_minutes} min
                    </Text>
                    {course.is_free && (
                      <View
                        style={[
                          s.freeBadge,
                          { backgroundColor: theme.success + "20" },
                        ]}
                      >
                        <Text
                          style={[s.freeBadgeText, { color: theme.success }]}
                        >
                          Free
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: 110,
    gap: space.md,
  },
  title: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.5 },
  generatorCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  generatorLabel: {
    fontSize: type.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  fieldLabel: { fontSize: type.caption, fontWeight: "700", marginBottom: 4 },
  generatorInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontSize: type.body,
  },
  levelRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  levelChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  levelChipText: { fontSize: type.bodySmall, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 10 },
  metaInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: type.body,
  },
  generateBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  generateBtnText: { fontSize: type.body, fontWeight: "700" },
  generatedCourseCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 8,
    gap: 8,
  },
  generatedThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  toolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  toolChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  toolChipText: { fontSize: 10, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: type.body },
  recommendedLabel: {
    fontSize: type.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  recCard: {
    width: 130,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    marginRight: 9,
    gap: 8,
  },
  recTitle: { fontSize: type.caption, fontWeight: "700", lineHeight: 15 },
  catScroll: { flexGrow: 0 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 7,
  },
  catChipText: { fontSize: type.bodySmall, fontWeight: "600" },
  center: { paddingVertical: 36, alignItems: "center" },
  emptyText: { textAlign: "center", paddingVertical: 36, fontSize: type.body },
  grid: { gap: 11 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 13, gap: 5 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 3,
  },
  cardTitle: { fontSize: type.h2, fontWeight: "700", lineHeight: 19 },
  cardInstructor: { fontSize: type.caption },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 3,
  },
  cardStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardStatText: { fontSize: type.caption, fontWeight: "500" },
  freeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: "auto",
  },
  freeBadgeText: { fontSize: 9.5, fontWeight: "700" },
});
