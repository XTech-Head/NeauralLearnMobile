// app/account-settings.tsx — edit profile, change email/password, delete account
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ErrorState } from "../src/components/ErrorState";
import { ScreenBackground } from "../src/components/ScreenBackground";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/hooks/useTheme";
import {
  deleteUserData,
  getUserStats,
  updateUserEmail,
  updateUserProfile,
} from "../src/lib/db";
import { radius, space, type } from "../src/themes";

function authErrorMessage(code: string, fallback: string) {
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "That password is incorrect.";
  }
  if (code === "auth/email-already-in-use") {
    return "That email is already in use by another account.";
  }
  if (code === "auth/invalid-email") {
    return "That doesn't look like a valid email address.";
  }
  if (code === "auth/weak-password") {
    return "Password should be at least 6 characters.";
  }
  return fallback;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    user: authUser,
    updateDisplayName,
    changeEmail,
    changePassword,
    deleteAccount,
    refreshUser,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [dailyGoal, setDailyGoal] = useState("20");
  const [saving, setSaving] = useState(false);

  // Change email
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [changingEmail, setChangingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!authUser) return;
    setLoadError(null);
    try {
      const stats = await getUserStats(authUser.uid);
      setUsername(stats?.username ?? authUser.displayName ?? "");
      setDailyGoal(String(stats?.daily_goal_minutes ?? 20));
    } catch (e) {
      console.error("Account settings load error:", e);
      setLoadError(
        "Couldn't load your account. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  // While an email change is pending, poll for it completing (the user has
  // to click a link in their new inbox — there's no other way to know).
  useEffect(() => {
    if (!pendingEmail) return;
    pollRef.current = setInterval(async () => {
      await refreshUser();
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pendingEmail, refreshUser]);

  useEffect(() => {
    if (pendingEmail && authUser?.email === pendingEmail && authUser) {
      if (pollRef.current) clearInterval(pollRef.current);
      updateUserEmail(authUser.uid, pendingEmail).catch((e) =>
        console.error("Email sync error:", e),
      );
      setPendingEmail(null);
      Alert.alert("Email updated", "Your email address has been changed.");
    }
  }, [authUser, authUser?.email, pendingEmail]);

  const handleSave = async () => {
    if (!authUser || !username.trim()) return;
    const goalNum = parseInt(dailyGoal, 10);
    if (!goalNum || goalNum < 5 || goalNum > 240) {
      Alert.alert(
        "Invalid goal",
        "Daily goal should be between 5 and 240 minutes.",
      );
      return;
    }
    setSaving(true);
    try {
      await updateDisplayName(username.trim());
      await updateUserProfile(authUser.uid, {
        username: username.trim(),
        dailyGoalMinutes: goalNum,
      });
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e) {
      console.error("Save profile error:", e);
      Alert.alert("Couldn't save", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !emailPassword) return;
    setEmailError(null);
    setChangingEmail(true);
    try {
      await changeEmail(newEmail.trim(), emailPassword);
      setPendingEmail(newEmail.trim());
      setShowEmailForm(false);
      setEmailPassword("");
      Alert.alert(
        "Check your new inbox",
        `We sent a confirmation link to ${newEmail.trim()}. Your email updates here automatically once you click it.`,
      );
    } catch (e: any) {
      setEmailError(
        authErrorMessage(
          e?.code ?? "",
          "Couldn't start the email change. Please try again.",
        ),
      );
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      setPasswordError("New password should be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your password has been changed.");
    } catch (e: any) {
      setPasswordError(
        authErrorMessage(
          e?.code ?? "",
          "Couldn't change your password. Please try again.",
        ),
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!authUser || !deletePassword) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      // Delete the Supabase data first (while still fully authenticated),
      // then the Firebase account itself — if this order were reversed and
      // the Supabase call failed, we'd have a deleted login with orphaned
      // data and no way back in to clean it up.
      await deleteUserData(authUser.uid);
      await deleteAccount(deletePassword);
      // No explicit navigation needed — deleting the Firebase user fires
      // onAuthStateChanged(null), and the root layout's AuthGate redirects
      // to sign-in on its own.
    } catch (e: any) {
      setDeleteError(
        authErrorMessage(
          e?.code ?? "",
          "Couldn't delete your account. Please try again.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground style={s.center}>
        <ActivityIndicator color={theme.primary} />
      </ScreenBackground>
    );
  }

  if (loadError) {
    return (
      <ScreenBackground>
        <ErrorState message={loadError} onRetry={load} />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: theme.text }]}>Account</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[s.sectionLabel, { color: theme.textTertiary }]}>
            Profile
          </Text>
          <View
            style={[
              s.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>
              Username
            </Text>
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: theme.bgTertiary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="your_name"
              placeholderTextColor={theme.textTertiary}
            />

            <Text
              style={[
                s.fieldLabel,
                { color: theme.textSecondary, marginTop: 14 },
              ]}
            >
              Daily goal (minutes)
            </Text>
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: theme.bgTertiary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={dailyGoal}
              onChangeText={setDailyGoal}
              keyboardType="number-pad"
              placeholder="20"
              placeholderTextColor={theme.textTertiary}
            />

            <TouchableOpacity
              style={[
                s.saveBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: username.trim() ? 1 : 0.5,
                },
              ]}
              onPress={handleSave}
              disabled={!username.trim() || saving}
            >
              <Text style={[s.saveBtnText, { color: theme.bg }]}>
                {saving ? "Saving..." : "Save changes"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <Text
            style={[
              s.sectionLabel,
              { color: theme.textTertiary, marginTop: 6 },
            ]}
          >
            Email
          </Text>
          <View
            style={[
              s.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[s.emailText, { color: theme.text }]}>
              {authUser?.email}
            </Text>
            {pendingEmail && (
              <View
                style={[
                  s.pendingBadge,
                  {
                    backgroundColor: theme.warning + "18",
                    borderColor: theme.warning + "35",
                  },
                ]}
              >
                <Ionicons name="time-outline" size={13} color={theme.warning} />
                <Text style={[s.pendingText, { color: theme.text }]}>
                  Confirmation pending for {pendingEmail} — check that inbox.
                </Text>
              </View>
            )}

            {!showEmailForm ? (
              <TouchableOpacity
                onPress={() => setShowEmailForm(true)}
                style={{ marginTop: 10 }}
              >
                <Text style={[s.linkText, { color: theme.primary }]}>
                  Change email
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10, marginTop: 12 }}>
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: theme.bgTertiary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="New email address"
                  placeholderTextColor={theme.textTertiary}
                  value={newEmail}
                  onChangeText={(t) => {
                    setNewEmail(t);
                    setEmailError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: theme.bgTertiary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Current password"
                  placeholderTextColor={theme.textTertiary}
                  value={emailPassword}
                  onChangeText={(t) => {
                    setEmailPassword(t);
                    setEmailError(null);
                  }}
                  secureTextEntry
                />
                {emailError && (
                  <Text style={[s.errorText, { color: theme.danger }]}>
                    {emailError}
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={[
                      s.cancelBtn,
                      { backgroundColor: theme.bgTertiary, flex: 1 },
                    ]}
                    onPress={() => {
                      setShowEmailForm(false);
                      setNewEmail("");
                      setEmailPassword("");
                      setEmailError(null);
                    }}
                  >
                    <Text style={[s.cancelBtnText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.saveBtn,
                      {
                        backgroundColor: theme.primary,
                        flex: 1,
                        marginTop: 0,
                        opacity: newEmail.trim() && emailPassword ? 1 : 0.5,
                      },
                    ]}
                    onPress={handleChangeEmail}
                    disabled={
                      !newEmail.trim() || !emailPassword || changingEmail
                    }
                  >
                    <Text style={[s.saveBtnText, { color: theme.bg }]}>
                      {changingEmail ? "Sending..." : "Send confirmation"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Password */}
          <Text
            style={[
              s.sectionLabel,
              { color: theme.textTertiary, marginTop: 6 },
            ]}
          >
            Password
          </Text>
          <View
            style={[
              s.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {!showPasswordForm ? (
              <TouchableOpacity onPress={() => setShowPasswordForm(true)}>
                <Text style={[s.linkText, { color: theme.primary }]}>
                  Change password
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10 }}>
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: theme.bgTertiary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Current password"
                  placeholderTextColor={theme.textTertiary}
                  value={currentPassword}
                  onChangeText={(t) => {
                    setCurrentPassword(t);
                    setPasswordError(null);
                  }}
                  secureTextEntry
                />
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: theme.bgTertiary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="New password"
                  placeholderTextColor={theme.textTertiary}
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    setPasswordError(null);
                  }}
                  secureTextEntry
                />
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: theme.bgTertiary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textTertiary}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setPasswordError(null);
                  }}
                  secureTextEntry
                />
                {passwordError && (
                  <Text style={[s.errorText, { color: theme.danger }]}>
                    {passwordError}
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={[
                      s.cancelBtn,
                      { backgroundColor: theme.bgTertiary, flex: 1 },
                    ]}
                    onPress={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(null);
                    }}
                  >
                    <Text style={[s.cancelBtnText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.saveBtn,
                      {
                        backgroundColor: theme.primary,
                        flex: 1,
                        marginTop: 0,
                        opacity:
                          currentPassword && newPassword && confirmPassword
                            ? 1
                            : 0.5,
                      },
                    ]}
                    onPress={handleChangePassword}
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      changingPassword
                    }
                  >
                    <Text style={[s.saveBtnText, { color: theme.bg }]}>
                      {changingPassword ? "Updating..." : "Update password"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Danger zone */}
          <Text style={[s.sectionLabel, { color: theme.danger, marginTop: 6 }]}>
            Danger zone
          </Text>
          <View
            style={[
              s.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.danger + "35",
              },
            ]}
          >
            {!showDeleteConfirm ? (
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                style={s.deleteRow}
              >
                <Ionicons name="trash-outline" size={17} color={theme.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.deleteTitle, { color: theme.danger }]}>
                    Delete account
                  </Text>
                  <Text style={[s.deleteSub, { color: theme.textTertiary }]}>
                    Permanently removes your account and all learning data.
                    Can&apos;t be undone.
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={[s.deleteTitle, { color: theme.danger }]}>
                  Confirm deletion
                </Text>
                <Text style={[s.deleteSub, { color: theme.textSecondary }]}>
                  Enter your password to permanently delete your account,
                  progress, notes, achievements, and AI conversation history.
                </Text>
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: theme.bgTertiary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Password"
                  placeholderTextColor={theme.textTertiary}
                  value={deletePassword}
                  onChangeText={(t) => {
                    setDeletePassword(t);
                    setDeleteError(null);
                  }}
                  secureTextEntry
                />
                {deleteError && (
                  <Text style={[s.errorText, { color: theme.danger }]}>
                    {deleteError}
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={[
                      s.cancelBtn,
                      { backgroundColor: theme.bgTertiary, flex: 1 },
                    ]}
                    onPress={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                      setDeleteError(null);
                    }}
                  >
                    <Text style={[s.cancelBtnText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.confirmDeleteBtn,
                      {
                        backgroundColor: theme.danger,
                        flex: 1,
                        opacity: deletePassword ? 1 : 0.5,
                      },
                    ]}
                    onPress={handleConfirmDelete}
                    disabled={!deletePassword || deleting}
                  >
                    <Text style={[s.confirmDeleteText, { color: "#FFFFFF" }]}>
                      {deleting ? "Deleting..." : "Delete forever"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  title: { fontSize: type.h1 + 2, fontWeight: "800" },
  content: { paddingHorizontal: space.md, paddingBottom: 60, gap: space.md },
  sectionLabel: {
    fontSize: type.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.md, gap: 4 },
  fieldLabel: { fontSize: type.bodySmall, fontWeight: "600", marginBottom: 7 },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 46,
    fontSize: type.body,
  },
  saveBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 16,
  },
  saveBtnText: { fontSize: type.body, fontWeight: "700" },
  emailText: { fontSize: type.body, fontWeight: "600" },
  linkText: { fontSize: type.bodySmall, fontWeight: "700" },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  pendingText: { flex: 1, fontSize: type.caption, lineHeight: 16 },
  deleteRow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  deleteTitle: { fontSize: type.body, fontWeight: "700" },
  deleteSub: { fontSize: type.caption, lineHeight: 17, marginTop: 3 },
  errorText: { fontSize: type.caption, fontWeight: "600" },
  cancelBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelBtnText: { fontSize: type.bodySmall, fontWeight: "700" },
  confirmDeleteBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 12,
  },
  confirmDeleteText: { fontSize: type.bodySmall, fontWeight: "700" },
});
