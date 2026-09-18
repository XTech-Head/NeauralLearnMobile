// app/certificate/[courseId].tsx — certificate of completion
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { ErrorState } from "../../src/components/ErrorState";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { getCourseWithContent, getUserStats } from "../../src/lib/db";
import { radius, space, type } from "../../src/themes";

export default function CertificateScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: authUser } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId || !authUser) return;
    setError(null);
    try {
      const [{ course: c }, stats] = await Promise.all([
        getCourseWithContent(courseId),
        getUserStats(authUser.uid),
      ]);
      setCourse(c);
      setUsername(stats?.username ?? authUser.displayName ?? "Learner");
    } catch (e) {
      console.error("Certificate load error:", e);
      setError("Couldn't load your certificate. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [courseId, authUser]);

  useEffect(() => {
    load();
  }, [load]);

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleShare = () => {
    Share.share({
      message: `I just completed "${course?.title}" on NeuralLearn! 🎓`,
    });
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
        <ErrorState message={error ?? "This certificate couldn't be found."} onRetry={load} />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={s.root}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={s.certificateWrap}>
          <View
            style={[
              s.certificate,
              { backgroundColor: theme.surfaceStrong, borderColor: theme.primaryLight + "50" },
            ]}
          >
            <View style={[s.ribbon, { backgroundColor: theme.primaryLight + "20" }]}>
              <Ionicons name="ribbon" size={34} color={theme.primary} />
            </View>
            <Text style={[s.kicker, { color: theme.textTertiary }]}>CERTIFICATE OF COMPLETION</Text>
            <Text style={[s.presentedTo, { color: theme.textTertiary }]}>This certifies that</Text>
            <Text style={[s.name, { color: theme.text }]}>{username}</Text>
            <Text style={[s.presentedTo, { color: theme.textTertiary }]}>has successfully completed</Text>
            <Text style={[s.courseTitle, { color: theme.primary }]}>{course.title}</Text>
            <View style={[s.divider, { backgroundColor: theme.border }]} />
            <Text style={[s.date, { color: theme.textTertiary }]}>{dateStr}</Text>
            <View style={s.brandRow}>
              <View style={[s.brandDot, { backgroundColor: theme.primary }]} />
              <Text style={[s.brand, { color: theme.textSecondary }]}>NeuralLearn</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={[s.shareBtn, { backgroundColor: theme.primary }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={17} color={theme.bg} />
          <Text style={[s.shareBtnText, { color: theme.bg }]}>Share achievement</Text>
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  root: { flex: 1, paddingHorizontal: space.md, justifyContent: "center", gap: space.lg },
  backBtn: { position: "absolute", top: 0, left: space.md, width: 32, height: 32, justifyContent: "center" },
  certificateWrap: { alignItems: "center" },
  certificate: {
    width: "100%",
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: space.xl,
    alignItems: "center",
    gap: 6,
  },
  ribbon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  kicker: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1.5 },
  presentedTo: { fontSize: type.bodySmall, marginTop: 6 },
  name: { fontSize: type.display, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  courseTitle: { fontSize: type.h1, fontWeight: "800", textAlign: "center", marginTop: 2, paddingHorizontal: space.sm },
  divider: { width: "60%", height: 1, marginVertical: 14 },
  date: { fontSize: type.caption },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
  brandDot: { width: 6, height: 6, borderRadius: 3 },
  brand: { fontSize: type.caption, fontWeight: "700" },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.md, paddingVertical: 15 },
  shareBtnText: { fontSize: type.body, fontWeight: "700" },
});