// src/lib/notify.ts — tiny shared helper for surfacing achievement unlocks
import { Alert } from "react-native";
import type { AchievementRow } from "../types/database";

export function notifyNewAchievements(achievements: AchievementRow[]) {
  if (achievements.length === 0) return;
  if (achievements.length === 1) {
    const a = achievements[0];
    Alert.alert(`🏆 Achievement unlocked!`, `${a.name} — ${a.description}${a.xp_reward ? ` (+${a.xp_reward} XP)` : ""}`);
    return;
  }
  Alert.alert(
    "🏆 Achievements unlocked!",
    achievements.map((a) => `${a.name} (+${a.xp_reward} XP)`).join("\n"),
  );
}
