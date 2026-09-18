// app/project/[projectId].tsx — project instructions + submission form
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
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { ErrorState } from "../../src/components/ErrorState";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { getProjectById, getProjectSubmission, submitProject } from "../../src/lib/db";
import { notifyNewAchievements } from "../../src/lib/notify";
import { radius, space, type } from "../../src/themes";

export default function ProjectScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: authUser } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId || !authUser) return;
    setError(null);
    try {
      const [p, sub] = await Promise.all([
        getProjectById(projectId),
        getProjectSubmission(authUser.uid, projectId),
      ]);
      setProject(p);
      setSubmission(sub);
      if (sub) {
        setText(sub.submission_text);
        setUrl(sub.submission_url ?? "");
      }
    } catch (e) {
      console.error("Project load error:", e);
      setError("Couldn't load this project. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId, authUser]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!authUser || !projectId || !text.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitProject(authUser.uid, projectId, text.trim(), url.trim() || undefined);
      setJustSubmitted(true);
      setSubmission({ submission_text: text.trim(), submission_url: url.trim() || null });
      notifyNewAchievements(result.newAchievements);
    } catch (e) {
      console.error("Project submit error:", e);
      setSubmitError("Couldn't submit your project. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground style={s.center}>
        <ActivityIndicator color={theme.primary} />
      </ScreenBackground>
    );
  }

  if (error || !project) {
    return (
      <ScreenBackground>
        <ErrorState message={error ?? "This project couldn't be found."} onRetry={load} />
      </ScreenBackground>
    );
  }

  const isFirstSubmission = !submission && !justSubmitted;

  return (
    <ScreenBackground>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <View style={[s.heroIcon, { backgroundColor: theme.primaryLight + "18", borderColor: theme.primaryLight + "30" }]}>
            <Ionicons name="construct" size={22} color={theme.primary} />
          </View>

          <Text style={[s.title, { color: theme.text }]}>{project.title}</Text>
          <Text style={[s.description, { color: theme.textSecondary }]}>{project.description}</Text>

          <View style={[s.instructionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.instructionsLabel, { color: theme.textTertiary }]}>Instructions</Text>
            <Text style={[s.instructionsText, { color: theme.text }]}>{project.instructions}</Text>
          </View>

          {submission && !isFirstSubmission ? (
            <View style={[s.submittedBadge, { backgroundColor: theme.success + "18", borderColor: theme.success + "30" }]}>
              <Ionicons name="checkmark-circle" size={15} color={theme.success} />
              <Text style={[s.submittedText, { color: theme.success }]}>Submitted — you can edit and resubmit below</Text>
            </View>
          ) : null}

          <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Your work</Text>
          <TextInput
            style={[s.textArea, { backgroundColor: theme.bgTertiary, borderColor: theme.border, color: theme.text }]}
            placeholder="Describe what you built, or paste your walkthrough..."
            placeholderTextColor={theme.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />

          <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Link (optional)</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.bgTertiary, borderColor: theme.border, color: theme.text }]}
            placeholder="Notebook, repo, or photo link"
            placeholderTextColor={theme.textTertiary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {submitError && (
            <ErrorState message={submitError} onRetry={handleSubmit} retrying={submitting} compact />
          )}

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: theme.primary, opacity: text.trim() ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!text.trim() || submitting}
          >
            <Text style={[s.submitBtnText, { color: theme.bg }]}>
              {submitting ? "Submitting..." : submission ? "Update submission" : `Submit (+${project.xp_reward} XP)`}
            </Text>
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
  heroIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 2 },
  title: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.4 },
  description: { fontSize: type.body, lineHeight: 21 },
  instructionsCard: { borderRadius: radius.lg, borderWidth: 1, padding: 15, gap: 6, marginTop: 4 },
  instructionsLabel: { fontSize: type.caption, fontWeight: "600" },
  instructionsText: { fontSize: type.bodySmall, lineHeight: 20 },
  submittedBadge: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: radius.md, borderWidth: 1, padding: 11 },
  submittedText: { fontSize: type.caption, fontWeight: "600", flex: 1 },
  fieldLabel: { fontSize: type.bodySmall, fontWeight: "600", marginTop: 6 },
  textArea: { borderRadius: radius.md, borderWidth: 1, padding: 13, fontSize: type.body, minHeight: 110 },
  input: { borderRadius: radius.md, borderWidth: 1, padding: 13, fontSize: type.body, height: 46 },
  submitBtn: { borderRadius: radius.md, alignItems: "center", paddingVertical: 15, marginTop: 6 },
  submitBtnText: { fontSize: type.body, fontWeight: "700" },
});