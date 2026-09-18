// app/onboarding.tsx — first-run flow: daily goal, then interests
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ErrorState } from "../src/components/ErrorState";
import { ScreenBackground } from "../src/components/ScreenBackground";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/hooks/useTheme";
import { completeOnboarding, getAllCategories } from "../src/lib/db";
import {
    isReminderSupportedHere,
    requestNotificationPermission,
} from "../src/lib/notifications";
import { radius, space, type } from "../src/themes";

const GOAL_OPTIONS = [10, 20, 30, 60];

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user: authUser, markOnboardingComplete } = useAuth();

  const [step, setStep] = useState<0 | 1>(0);
  const [goal, setGoal] = useState(20);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoadError(null);
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (e) {
      console.error("Onboarding categories error:", e);
      setLoadError(
        "Couldn't load topics. Check your connection and try again.",
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ensureAppPermissions = async () => {
    if (isReminderSupportedHere()) {
      await requestNotificationPermission();
    }

    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      Alert.alert(
        "Media access optional",
        "You can still use NeuralLearn without photos/media access, but it may limit image attachments and uploads.",
      );
    }
  };

  const handleFinish = async () => {
    if (!authUser) return;
    setFinishing(true);
    setFinishError(null);
    try {
      await ensureAppPermissions();
      await completeOnboarding(authUser.uid, {
        dailyGoalMinutes: goal,
        interestCategoryIds: Array.from(selectedIds),
      });
      markOnboardingComplete();
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Complete onboarding error:", e);
      setFinishError(
        "Couldn't save your preferences. Check your connection and try again.",
      );
    } finally {
      setFinishing(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={s.root}>
        <View style={s.progressRow}>
          <View style={[s.progressDot, { backgroundColor: theme.primary }]} />
          <View
            style={[
              s.progressDot,
              {
                backgroundColor: step === 1 ? theme.primary : theme.bgTertiary,
              },
            ]}
          />
        </View>

        <View
          style={[
            s.card,
            { backgroundColor: theme.surfaceStrong, borderColor: theme.border },
          ]}
        >
          {step === 0 ? (
            <View style={s.stepContent}>
              <Text style={[s.title, { color: theme.text }]}>
                How much time can you give each day?
              </Text>
              <Text style={[s.subtitle, { color: theme.textTertiary }]}>
                You can always change this later in Account settings.
              </Text>

              <View style={s.goalGrid}>
                {GOAL_OPTIONS.map((g) => {
                  const selected = goal === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        s.goalCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: selected ? theme.primary : theme.border,
                        },
                        selected && {
                          backgroundColor: theme.primaryLight + "18",
                        },
                      ]}
                      onPress={() => setGoal(g)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          s.goalValue,
                          { color: selected ? theme.primary : theme.text },
                        ]}
                      >
                        {g}
                      </Text>
                      <Text style={[s.goalUnit, { color: theme.textTertiary }]}>
                        minutes / day
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={() => setStep(1)}
              >
                <Text style={[s.primaryBtnText, { color: theme.bg }]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.stepContent}>
              <Text style={[s.title, { color: theme.text }]}>
                What are you into?
              </Text>
              <Text style={[s.subtitle, { color: theme.textTertiary }]}>
                Pick a few — we&apos;ll use these to recommend courses.
                Optional.
              </Text>

              {loadingCategories ? (
                <ActivityIndicator
                  color={theme.primary}
                  style={{ marginTop: 30 }}
                />
              ) : loadError ? (
                <ErrorState
                  message={loadError}
                  onRetry={loadCategories}
                  compact
                />
              ) : (
                <View style={s.categoryGrid}>
                  {categories.map((cat) => {
                    const selected = selectedIds.has(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          s.categoryChip,
                          {
                            borderColor: selected
                              ? theme.primary
                              : theme.border,
                          },
                          selected && {
                            backgroundColor: theme.primaryLight + "18",
                          },
                        ]}
                        onPress={() => toggleCategory(cat.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={14}
                          color={selected ? theme.primary : cat.color}
                        />
                        <Text
                          style={[
                            s.categoryText,
                            {
                              color: selected
                                ? theme.primary
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {cat.name}
                        </Text>
                        {selected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={theme.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={s.permissionBox}>
                <Text style={[s.permissionTitle, { color: theme.text }]}>
                  App access
                </Text>
                <Text style={[s.permissionText, { color: theme.textTertiary }]}>
                  We&apos;ll ask for notifications and photo/media access so
                  your reminders and image uploads work properly.
                </Text>
              </View>

              {finishError && (
                <ErrorState
                  message={finishError}
                  onRetry={handleFinish}
                  retrying={finishing}
                  compact
                />
              )}

              <TouchableOpacity
                style={[
                  s.primaryBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: finishing ? 0.7 : 1,
                  },
                ]}
                onPress={handleFinish}
                disabled={finishing}
              >
                <Text style={[s.primaryBtnText, { color: theme.bg }]}>
                  {finishing ? "Setting up..." : "Start learning"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.backLink} onPress={() => setStep(0)}>
                <Text style={[s.backLinkText, { color: theme.textTertiary }]}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    justifyContent: "space-between",
  },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: space.xl },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: space.lg,
    flex: 1,
    justifyContent: "center",
  },
  stepContent: { flex: 1, gap: space.md },
  title: {
    fontSize: type.display,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: type.display + 6,
  },
  subtitle: { fontSize: type.bodySmall, lineHeight: 19 },
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  goalCard: {
    width: "47%",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  goalValue: { fontSize: 28, fontWeight: "800" },
  goalUnit: { fontSize: type.caption, fontWeight: "500" },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryText: { fontSize: type.bodySmall, fontWeight: "600" },
  permissionBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: type.body,
    fontWeight: "700",
    marginBottom: 4,
  },
  permissionText: {
    fontSize: type.bodySmall,
    lineHeight: 18,
  },
  primaryBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: "auto",
  },
  primaryBtnText: { fontSize: type.body, fontWeight: "700" },
  backLink: { alignItems: "center", paddingVertical: 12 },
  backLinkText: { fontSize: type.bodySmall, fontWeight: "600" },
});
