// src/lib/notifications.ts — local daily streak reminder (no backend needed)
//
// expo-notifications runs a push-token auto-registration side effect the
// moment it's imported, and that side effect throws in Expo Go on Android
// (remote push was removed from Expo Go in SDK 53). We only ever use LOCAL
// scheduled notifications here, but the crash happens at module-evaluation
// time regardless of what we call — so the fix isn't "don't call push
// APIs", it's "never let the module be require()'d at all in Expo Go".
// Every export below lazy-requires it and no-ops when unsupported.
import Constants from "expo-constants";
import { Platform } from "react-native";

const REMINDER_ID = "daily-streak-reminder";
const DEFAULT_HOUR = 19; // 7pm local time
const DEFAULT_MINUTE = 0;

function isExpoGo() {
  // appOwnership is deprecated in favor of executionEnvironment, but
  // executionEnvironment reports Expo Go and a real dev-client build under
  // the same "storeClient" value — and dev-client builds DO support
  // notifications fully. appOwnership is the only signal that actually
  // distinguishes the two, so we keep using it here on purpose.
  return Constants.appOwnership === "expo";
}

/** True when this build can actually schedule/receive local notifications. */
export function isReminderSupportedHere() {
  return !isExpoGo();
}

let handlerConfigured = false;

function loadNotifications(): typeof import("expo-notifications") | null {
  if (isExpoGo()) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require("expo-notifications") as typeof import("expo-notifications");
  if (!handlerConfigured) {
    handlerConfigured = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return Notifications;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Schedules (or replaces) a daily reminder at a fixed local time. No-ops in Expo Go. */
export async function scheduleDailyReminder(hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE) {
  const Notifications = loadNotifications();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Daily reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Keep your streak alive 🔥",
      body: "You haven't studied today yet — even one lesson keeps it going.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder() {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}