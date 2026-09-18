// app/(tabs)/profile.tsx — user profile + sign out
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ErrorState } from "../../src/components/ErrorState";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { getUserStats, updateReminderPreference } from "../../src/lib/db";
import {
  cancelDailyReminder,
  isReminderSupportedHere,
  requestNotificationPermission,
  scheduleDailyReminder,
} from "../../src/lib/notifications";
import { radius, space, type } from "../../src/themes";

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user: authUser, signOut } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [togglingReminders, setTogglingReminders] = useState(false);

  const load = useCallback(async () => {
    if (!authUser) return;
    setError(null);
    try {
      const data = await getUserStats(authUser.uid);
      setStats(data);
      setRemindersEnabled(data?.reminders_enabled ?? false);
    } catch (e) {
      console.error("Profile load error:", e);
      setError(
        "Couldn't load your profile. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleReminders = async (next: boolean) => {
    if (!authUser) return;
    if (next && !isReminderSupportedHere()) {
      Alert.alert(
        "Needs a development build",
        "Daily reminders don't work in Expo Go — this is an Expo Go limitation, not a bug. Run this app as a development build (npx expo run:android / run:ios, or an EAS dev build) to use them.",
      );
      return;
    }
    setTogglingReminders(true);
    try {
      if (next) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            "Notifications disabled",
            "Enable notifications for NeuralLearn in your device Settings to get daily reminders.",
          );
          setTogglingReminders(false);
          return;
        }
        await scheduleDailyReminder();
      } else {
        await cancelDailyReminder();
      }
      await updateReminderPreference(authUser.uid, next);
      setRemindersEnabled(next);
    } catch (e) {
      console.error("Reminder toggle error:", e);
    } finally {
      setTogglingReminders(false);
    }
  };

  const initial = (stats?.username ?? authUser?.displayName ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View
            style={[
              s.avatar,
              {
                backgroundColor: isDark
                  ? "rgba(148, 117, 255, 0.25)"
                  : theme.primaryLight,
              },
            ]}
          >
            <Text style={[s.avatarText, { color: theme.bg }]}>{initial}</Text>
          </View>
          <Text style={[s.username, { color: theme.text }]}>
            {stats?.username ?? authUser?.displayName ?? "Learner"}
          </Text>
          <Text style={[s.email, { color: theme.textTertiary }]}>
            {authUser?.email}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 16 }} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} compact />
        ) : (
          <View style={s.statsRow}>
            <View
              style={[
                s.statBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[s.statValue, { color: theme.text }]}>
                {stats?.total_xp ?? 0}
              </Text>
              <Text style={[s.statLabel, { color: theme.textTertiary }]}>
                Total XP
              </Text>
            </View>
            <View
              style={[
                s.statBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[s.statValue, { color: theme.text }]}>
                {stats?.current_streak_days ?? 0}
              </Text>
              <Text style={[s.statLabel, { color: theme.textTertiary }]}>
                Day streak
              </Text>
            </View>
          </View>
        )}

        <View
          style={[
            s.section,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <MenuRow
            icon="person-circle-outline"
            label="Account settings"
            theme={theme}
            last
            onPress={() => router.push("/account-settings")}
          />
        </View>

        <View
          style={[
            s.section,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              s.menuRow,
              { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={17}
              color={theme.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.menuLabel, { color: theme.text }]}>
                Daily reminder
              </Text>
              <Text style={[s.menuSubLabel, { color: theme.textTertiary }]}>
                Nudge me at 7pm if I haven&apos;t studied
              </Text>
            </View>
            {togglingReminders ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Switch
                value={remindersEnabled}
                onValueChange={handleToggleReminders}
                trackColor={{ false: theme.bgTertiary, true: theme.primary }}
                thumbColor={theme.bg}
              />
            )}
          </View>
          <MenuRow
            icon="moon-outline"
            label="Appearance"
            theme={theme}
            onPress={() => router.push("/appearance")}
          />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            theme={theme}
            onPress={() => router.push("/privacy-policy")}
          />
          <MenuRow
            icon="document-text-outline"
            label="Terms of Service"
            theme={theme}
            onPress={() => router.push("/terms")}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Help & support"
            theme={theme}
            last
            onPress={() =>
              Alert.alert(
                "Help & support",
                "Open the main portfolio and contact page for support.",
                [
                  {
                    text: "Open portfolio",
                    onPress: () =>
                      Linking.openURL(
                        "https://xtech-devs-portfolio-head.vercel.app/",
                      ),
                  },
                  { text: "Cancel", style: "cancel" },
                ],
              )
            }
          />
        </View>

        <TouchableOpacity
          style={[
            s.signOutBtn,
            {
              backgroundColor: isDark
                ? "rgba(22, 17, 29, 0.92)"
                : theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={17} color={theme.danger} />
          <Text style={[s.signOutText, { color: theme.danger }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackground>
  );
}

function MenuRow({
  icon,
  label,
  theme,
  last,
  onPress,
}: {
  icon: any;
  label: string;
  theme: any;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        s.menuRow,
        !last && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
      ]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Ionicons name={icon} size={17} color={theme.textSecondary} />
      <Text style={[s.menuLabel, { color: theme.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={theme.textTertiary} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.lg,
    paddingBottom: 110,
    gap: space.lg,
  },
  header: { alignItems: "center", gap: 3 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarText: { fontSize: type.display, fontWeight: "800" },
  username: { fontSize: type.h1 + 2, fontWeight: "800", letterSpacing: -0.3 },
  email: { fontSize: type.bodySmall },
  statsRow: { flexDirection: "row", gap: 9 },
  statBox: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: type.h1, fontWeight: "800" },
  statLabel: { fontSize: 10.5, fontWeight: "500" },
  section: { borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14 },
  menuLabel: { flex: 1, fontSize: type.body, fontWeight: "500" },
  menuSubLabel: { fontSize: 11, marginTop: 2 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 13,
  },
  signOutText: { fontSize: type.body, fontWeight: "700" },
});
