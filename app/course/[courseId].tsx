// app/course/[courseId].tsx — course detail: description, lesson list, enroll
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { generateLearningToolsForSubject } from "../../src/lib/ai";
import {
    enrollInCourse,
    getBestQuizAttempt,
    getCompletedCourseIds,
    getCompletedLessonIds,
    getCourseRatingSummary,
    getCourseWithContent,
    getProjectForCourse,
    getProjectSubmission,
    getQuizForCourse,
    getUserCourseRating,
    isBookmarked,
    submitCourseRating,
    toggleBookmark,
} from "../../src/lib/db";
import { radius, space, type } from "../../src/themes";

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user: authUser } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [quiz, setQuiz] = useState<any>(null);
  const [bestAttempt, setBestAttempt] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<{
    average: number | null;
    count: number;
  }>({ average: null, count: 0 });
  const [myRating, setMyRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [videoSearch, setVideoSearch] = useState("");
  const [aiTools, setAiTools] = useState<Array<{ label: string; url: string }>>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!courseId || !authUser) return;
    setError(null);
    try {
      const { course: c, lessons: l } = await getCourseWithContent(courseId);
      if (!c) {
        setCourse(null);
        setLessons([]);
        setError("This course couldn't be found or no longer exists.");
        return;
      }

      const completed = await getCompletedLessonIds(authUser.uid, courseId);
      const completedCourses = await getCompletedCourseIds(authUser.uid);
      setCourse(c);
      setLessons(l);
      setCompletedIds(completed);
      setCompletedCourseIds(completedCourses);

      const [q, p, bm, summary, mine] = await Promise.all([
        getQuizForCourse(courseId),
        getProjectForCourse(courseId),
        isBookmarked(authUser.uid, courseId),
        getCourseRatingSummary(courseId),
        getUserCourseRating(authUser.uid, courseId),
      ]);
      setQuiz(q);
      setProject(p);
      setBookmarked(bm);
      setRatingSummary(summary);
      setMyRating(mine?.rating ?? 0);
      const generatedTools = await generateLearningToolsForSubject(c.title);
      setAiTools(generatedTools);
      if (q) setBestAttempt(await getBestQuizAttempt(authUser.uid, q.id));
      if (p)
        setProjectSubmitted(!!(await getProjectSubmission(authUser.uid, p.id)));
    } catch (e) {
      console.error("Course detail error:", e);
      setError(
        "Couldn't load this course. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId, authUser]);

  const isLocked =
    !!course?.prerequisite_course_id &&
    !completedCourseIds.has(course.prerequisite_course_id);

  const handleEnroll = async () => {
    if (!authUser || !courseId || isLocked) return;
    setEnrolling(true);
    try {
      await enrollInCourse(authUser.uid, courseId);
      if (lessons[0]) {
        router.push({
          pathname: "/lesson/[lessonId]",
          params: { lessonId: lessons[0].id, courseId },
        });
      }
    } catch (e) {
      console.error("Enroll error:", e);
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!authUser || !courseId) return;
    setBookmarked((prev) => !prev); // optimistic
    try {
      await toggleBookmark(authUser.uid, courseId);
    } catch (e) {
      console.error("Bookmark error:", e);
      setBookmarked((prev) => !prev); // revert on failure
    }
  };

  const handleRate = async (rating: number) => {
    if (!authUser || !courseId) return;
    setMyRating(rating);
    setSubmittingRating(true);
    try {
      await submitCourseRating(authUser.uid, courseId, rating);
      const summary = await getCourseRatingSummary(courseId);
      setRatingSummary(summary);
    } catch (e) {
      console.error("Rating error:", e);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground style={s.center}>
        <ActivityIndicator color={theme.primary} />
      </ScreenBackground>
    );
  }

  if (error || !course) {
    return (
      <ScreenBackground>
        <ErrorState
          message={error ?? "This course couldn't be found."}
          onRetry={load}
        />
      </ScreenBackground>
    );
  }

  const allLessonsDone =
    lessons.length > 0 && completedIds.size === lessons.length;
  const isCourseComplete = allLessonsDone && (!quiz || !!bestAttempt?.passed);

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.topRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={handleToggleBookmark}>
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={19}
              color={bookmarked ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            s.heroIcon,
            {
              backgroundColor: `${course.category?.color ?? theme.primary}15`,
              borderColor: `${course.category?.color ?? theme.primary}30`,
            },
          ]}
        >
          <Ionicons
            name={(course.category?.icon ?? "book") as any}
            size={22}
            color={course.category?.color ?? theme.primary}
          />
        </View>

        <Text style={[s.title, { color: theme.text }]}>{course.title}</Text>
        <Text style={[s.instructor, { color: theme.textTertiary }]}>
          {course.instructor?.name} · {course.duration_minutes} min ·{" "}
          {course.difficulty}
        </Text>
        <Text style={[s.description, { color: theme.textSecondary }]}>
          {course.description}
        </Text>

        <View style={s.toolsBox}>
          <Text
            style={[
              s.sectionTitle,
              { color: theme.textTertiary, marginTop: 0 },
            ]}
          >
            AI study tools
          </Text>
          <View style={s.toolRow}>
            {aiTools.map((tool) => (
              <TouchableOpacity
                key={tool.label}
                onPress={() =>
                  router.push({
                    pathname: "/video-search",
                    params: { query: tool.label },
                  })
                }
                style={[
                  s.toolChip,
                  {
                    backgroundColor: isDark ? "rgba(10, 8, 15, 0.9)" : theme.bg,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[s.toolChipText, { color: theme.textSecondary }]}>
                  {tool.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[
            s.videoCard,
            {
              backgroundColor: isDark
                ? "rgba(22, 17, 29, 0.92)"
                : theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              s.sectionTitle,
              { color: theme.textTertiary, marginTop: 0 },
            ]}
          >
            Search video tutorials
          </Text>
          <TextInput
            style={[
              s.videoInput,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Search YouTube videos for this topic"
            placeholderTextColor={theme.textTertiary}
            value={videoSearch}
            onChangeText={setVideoSearch}
          />
          <TouchableOpacity
            style={[s.videoButton, { backgroundColor: theme.primary }]}
            onPress={() =>
              router.push({
                pathname: "/video-search",
                params: { query: videoSearch || course.title },
              })
            }
          >
            <Text style={[s.videoButtonText, { color: theme.bg }]}>
              Open tutorials
            </Text>
          </TouchableOpacity>
        </View>

        {isLocked ? (
          <View
            style={[
              s.lockedBanner,
              {
                backgroundColor: theme.warning + "18",
                borderColor: theme.warning + "35",
              },
            ]}
          >
            <Ionicons name="lock-closed" size={16} color={theme.warning} />
            <Text style={[s.lockedText, { color: theme.text }]}>
              Complete{" "}
              <Text
                style={{ fontWeight: "700", color: theme.primary }}
                onPress={() =>
                  router.push({
                    pathname: "/course/[courseId]",
                    params: { courseId: course.prerequisite.id },
                  })
                }
              >
                {course.prerequisite?.title}
              </Text>{" "}
              first to unlock this course.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.enrollBtn, { backgroundColor: theme.primary }]}
            onPress={handleEnroll}
            disabled={enrolling}
          >
            <Text style={[s.enrollBtnText, { color: theme.bg }]}>
              {enrolling ? "Starting..." : "Start course"}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>
          {lessons.length} lessons
        </Text>
        <View style={s.lessonList}>
          {lessons.map((lesson, i) => {
            const done = completedIds.has(lesson.id);
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  s.lessonRow,
                  {
                    backgroundColor: isDark
                      ? "rgba(22, 17, 29, 0.92)"
                      : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/lesson/[lessonId]",
                    params: { lessonId: lesson.id, courseId },
                  })
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.lessonIndex,
                    done
                      ? { backgroundColor: theme.success + "20" }
                      : { backgroundColor: theme.bgTertiary },
                  ]}
                >
                  {done ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={theme.success}
                    />
                  ) : (
                    <Text
                      style={[
                        s.lessonIndexText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.lessonTitle, { color: theme.text }]}>
                    {lesson.title}
                  </Text>
                  <Text style={[s.lessonMeta, { color: theme.textTertiary }]}>
                    {lesson.duration_minutes} min · {lesson.xp_reward} XP
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {quiz && (
          <>
            <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>
              Quiz
            </Text>
            <TouchableOpacity
              style={[
                s.extraCard,
                {
                  backgroundColor: isDark
                    ? "rgba(22, 17, 29, 0.92)"
                    : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/quiz/[quizId]",
                  params: { quizId: quiz.id, courseId },
                })
              }
              activeOpacity={0.7}
            >
              <View
                style={[s.extraIcon, { backgroundColor: theme.info + "18" }]}
              >
                <Ionicons name="help-circle" size={19} color={theme.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.lessonTitle, { color: theme.text }]}>
                  {quiz.title}
                </Text>
                <Text style={[s.lessonMeta, { color: theme.textTertiary }]}>
                  {bestAttempt
                    ? `Best: ${bestAttempt.score_percent}%`
                    : `${quiz.xp_reward} XP · Passing: ${quiz.passing_score}%`}
                </Text>
              </View>
              {bestAttempt?.passed ? (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.success}
                />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textTertiary}
                />
              )}
            </TouchableOpacity>
          </>
        )}

        {project && (
          <>
            <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>
              Project
            </Text>
            <TouchableOpacity
              style={[
                s.extraCard,
                {
                  backgroundColor: isDark
                    ? "rgba(22, 17, 29, 0.92)"
                    : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/project/[projectId]",
                  params: { projectId: project.id },
                })
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.extraIcon,
                  { backgroundColor: theme.primaryLight + "18" },
                ]}
              >
                <Ionicons name="construct" size={19} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.lessonTitle, { color: theme.text }]}>
                  {project.title}
                </Text>
                <Text style={[s.lessonMeta, { color: theme.textTertiary }]}>
                  {projectSubmitted ? "Submitted" : `${project.xp_reward} XP`}
                </Text>
              </View>
              {projectSubmitted ? (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.success}
                />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.textTertiary}
                />
              )}
            </TouchableOpacity>
          </>
        )}

        {isCourseComplete && (
          <TouchableOpacity
            style={[
              s.certificateBtn,
              {
                backgroundColor: theme.primaryLight + "18",
                borderColor: theme.primaryLight + "40",
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/certificate/[courseId]",
                params: { courseId },
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="ribbon" size={19} color={theme.primary} />
            <Text style={[s.certificateBtnText, { color: theme.primary }]}>
              View your certificate
            </Text>
            <Ionicons name="chevron-forward" size={15} color={theme.primary} />
          </TouchableOpacity>
        )}

        {isCourseComplete && (
          <View
            style={[
              s.ratingCard,
              {
                backgroundColor: isDark
                  ? "rgba(22, 17, 29, 0.92)"
                  : theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                s.sectionTitle,
                { color: theme.textTertiary, marginTop: 0 },
              ]}
            >
              {myRating ? "Your rating" : "Rate this course"}
            </Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => handleRate(n)}
                  disabled={submittingRating}
                >
                  <Ionicons
                    name={n <= myRating ? "star" : "star-outline"}
                    size={26}
                    color={n <= myRating ? theme.warning : theme.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {ratingSummary.average !== null && (
              <Text
                style={[s.ratingSummaryText, { color: theme.textTertiary }]}
              >
                {ratingSummary.average} average · {ratingSummary.count} rating
                {ratingSummary.count === 1 ? "" : "s"}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: space.md, paddingBottom: 50, gap: 10 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: -8,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 2,
  },
  title: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.4 },
  instructor: { fontSize: type.bodySmall, textTransform: "capitalize" },
  description: { fontSize: type.body, lineHeight: 21, marginTop: 2 },
  toolsBox: { marginTop: 6, gap: 8 },
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toolChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  toolChipText: { fontSize: 10.5, fontWeight: "700" },
  videoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 13,
    marginTop: 6,
    gap: 8,
  },
  videoInput: {
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  videoButton: {
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  videoButtonText: { fontSize: type.body, fontWeight: "700" },
  enrollBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 6,
  },
  enrollBtnText: { fontSize: type.body, fontWeight: "700" },
  lockedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 13,
    marginTop: 6,
  },
  lockedText: { flex: 1, fontSize: type.bodySmall, lineHeight: 19 },
  sectionTitle: { fontSize: type.caption, fontWeight: "600", marginTop: 10 },
  lessonList: { gap: 9 },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 13,
  },
  extraCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 13,
  },
  extraIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonIndex: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonIndexText: { fontSize: type.bodySmall, fontWeight: "700" },
  lessonTitle: { fontSize: type.bodySmall, fontWeight: "600" },
  lessonMeta: { fontSize: 10.5, marginTop: 2 },
  certificateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  certificateBtnText: { flex: 1, fontSize: type.body, fontWeight: "700" },
  ratingCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
    alignItems: "center",
    gap: 8,
  },
  starsRow: { flexDirection: "row", gap: 6 },
  ratingSummaryText: { fontSize: type.caption },
});
