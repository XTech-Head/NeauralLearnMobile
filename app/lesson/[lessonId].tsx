// app/lesson/[lessonId].tsx — lesson content + mark-complete flow
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
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
    completeLesson,
    getCompletedLessonIds,
    getCourseWithContent,
    getLessonNote,
    saveLessonNote,
} from "../../src/lib/db";
import { notifyNewAchievements } from "../../src/lib/notify";
import { radius, space, type } from "../../src/themes";

export default function LessonScreen() {
  const { lessonId, courseId } = useLocalSearchParams<{
    lessonId: string;
    courseId: string;
  }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user: authUser } = useAuth();

  const [lesson, setLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [videoSearch, setVideoSearch] = useState("");
  const [aiTools, setAiTools] = useState<Array<{ label: string; url: string }>>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId || !authUser || !lessonId) return;
    setError(null);
    try {
      const { lessons } = await getCourseWithContent(courseId);
      const completed = await getCompletedLessonIds(authUser.uid, courseId);
      const note = await getLessonNote(authUser.uid, lessonId);
      const selected = lessons.find((l) => l.id === lessonId);
      setAllLessons(lessons);
      setLesson(selected);
      setCompletedIds(completed);
      setNotes(note?.content ?? "");
      setSavedNotes(note?.content ?? "");
      if (selected?.title)
        setAiTools(await generateLearningToolsForSubject(selected.title));
    } catch (e) {
      console.error("Lesson load error:", e);
      setError(
        "Couldn't load this lesson. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [lessonId, courseId, authUser]);

  useEffect(() => {
    load();
  }, [load]);

  const isDone = completedIds.has(lessonId ?? "");
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = allLessons[currentIndex + 1];
  const notesChanged = notes !== savedNotes;

  const handleSaveNotes = async () => {
    if (!authUser || !lessonId || !notesChanged) return;
    setSavingNotes(true);
    try {
      await saveLessonNote(authUser.uid, lessonId, notes);
      setSavedNotes(notes);
    } catch (e) {
      console.error("Save note error:", e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleComplete = async () => {
    if (!authUser || !lessonId || isDone) return;
    setCompleting(true);
    try {
      if (notesChanged) await saveLessonNote(authUser.uid, lessonId, notes);
      const { newAchievements } = await completeLesson(authUser.uid, lessonId);
      notifyNewAchievements(newAchievements);
      if (nextLesson) {
        router.replace({
          pathname: "/lesson/[lessonId]",
          params: { lessonId: nextLesson.id, courseId },
        });
      } else {
        router.replace({
          pathname: "/course/[courseId]",
          params: { courseId },
        });
      }
    } catch (e) {
      console.error("Complete lesson error:", e);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground style={s.center}>
        <ActivityIndicator color={theme.primary} />
      </ScreenBackground>
    );
  }

  if (error || !lesson) {
    return (
      <ScreenBackground>
        <ErrorState
          message={error ?? "This lesson couldn't be found."}
          onRetry={load}
        />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <Text style={[s.kicker, { color: theme.textTertiary }]}>
            Lesson {currentIndex + 1} of {allLessons.length}
          </Text>
          <Text style={[s.title, { color: theme.text }]}>{lesson.title}</Text>

          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Ionicons
                name="time-outline"
                size={13}
                color={theme.textTertiary}
              />
              <Text style={[s.metaText, { color: theme.textTertiary }]}>
                {lesson.duration_minutes} min
              </Text>
            </View>
            <View style={s.metaItem}>
              <Ionicons
                name="flash-outline"
                size={13}
                color={theme.textTertiary}
              />
              <Text style={[s.metaText, { color: theme.textTertiary }]}>
                {lesson.xp_reward} XP
              </Text>
            </View>
          </View>

          <View
            style={[
              s.contentCard,
              {
                backgroundColor: isDark
                  ? "rgba(22, 17, 29, 0.92)"
                  : theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[s.bodyText, { color: theme.textSecondary }]}>
              {lesson.content}
            </Text>
          </View>

          <View style={s.toolsBox}>
            <Text style={[s.notesLabel, { color: theme.textSecondary }]}>
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
                      backgroundColor: isDark
                        ? "rgba(10, 8, 15, 0.9)"
                        : theme.bg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[s.toolChipText, { color: theme.textSecondary }]}
                  >
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
            <Text style={[s.notesLabel, { color: theme.textSecondary }]}>
              Search video tutorials
            </Text>
            <TextInput
              style={[
                s.notesInput,
                {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Search YouTube for this chapter"
              placeholderTextColor={theme.textTertiary}
              value={videoSearch}
              onChangeText={setVideoSearch}
            />
            <TouchableOpacity
              style={[s.completeBtn, { backgroundColor: theme.primary }]}
              onPress={() =>
                router.push({
                  pathname: "/video-search",
                  params: { query: videoSearch || lesson.title },
                })
              }
            >
              <Text style={[s.completeBtnText, { color: theme.bg }]}>
                Open tutorials
              </Text>
            </TouchableOpacity>
          </View>

          <View style={s.notesHeader}>
            <Text style={[s.notesLabel, { color: theme.textSecondary }]}>
              My notes
            </Text>
            {notesChanged && (
              <TouchableOpacity
                onPress={handleSaveNotes}
                disabled={savingNotes}
              >
                <Text style={[s.saveNotesText, { color: theme.primary }]}>
                  {savingNotes ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[
              s.notesInput,
              {
                backgroundColor: isDark
                  ? "rgba(10, 8, 15, 0.9)"
                  : theme.bgTertiary,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Jot down anything worth remembering..."
            placeholderTextColor={theme.textTertiary}
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              s.completeBtn,
              {
                backgroundColor: isDone ? theme.surfaceStrong : theme.primary,
                borderWidth: isDone ? 1 : 0,
                borderColor: theme.border,
              },
            ]}
            onPress={handleComplete}
            disabled={completing || isDone}
          >
            {isDone ? (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color={theme.success}
                />
                <Text style={[s.completeBtnText, { color: theme.success }]}>
                  Completed
                </Text>
              </>
            ) : (
              <Text style={[s.completeBtnText, { color: theme.bg }]}>
                {completing
                  ? "Saving..."
                  : nextLesson
                    ? "Complete & continue"
                    : "Complete course"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: space.md, paddingBottom: 50, gap: 10 },
  backBtn: { width: 32, height: 32, justifyContent: "center", marginBottom: 2 },
  kicker: { fontSize: type.bodySmall, fontWeight: "600" },
  title: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.4 },
  metaRow: { flexDirection: "row", gap: 14, marginTop: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: type.caption, fontWeight: "500" },
  contentCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
  },
  bodyText: { fontSize: type.body, lineHeight: 22 },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  notesLabel: { fontSize: type.bodySmall, fontWeight: "600" },
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
  saveNotesText: { fontSize: type.caption, fontWeight: "700" },
  notesInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 13,
    fontSize: type.bodySmall,
    minHeight: 80,
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: radius.md,
    paddingVertical: 15,
    marginTop: 6,
  },
  completeBtnText: { fontSize: type.body, fontWeight: "700" },
});
