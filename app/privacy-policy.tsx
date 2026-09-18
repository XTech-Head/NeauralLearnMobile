/* eslint-disable react/no-unescaped-entities -- long-form prose content */
// app/privacy-policy.tsx — privacy policy (template — see disclaimer at top)
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenBackground } from "../src/components/ScreenBackground";
import { useTheme } from "../src/hooks/useTheme";
import { radius, space, type } from "../src/themes";

const LAST_UPDATED = "September 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[s.body, { color: theme.textSecondary }]}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <ScreenBackground>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.noticeCard, { backgroundColor: theme.warning + "16", borderColor: theme.warning + "35" }]}>
          <Ionicons name="alert-circle" size={16} color={theme.warning} />
          <Text style={[s.noticeText, { color: theme.text }]}>
            This is a template written to match what NeuralLearn actually does technically. It is
            not legal advice — have a lawyer review and adapt it before shipping to real users,
            especially if minors may use the app.
          </Text>
        </View>

        <Text style={[s.updated, { color: theme.textTertiary }]}>Last updated: {LAST_UPDATED}</Text>

        <Section title="What we collect">
          When you create an account, we collect your email address and a username via Firebase
          Authentication. As you use the app, we store your course progress, quiz results, project
          submissions, notes, streaks, and achievements in our database (Supabase). If you use the
          AI tutor, your messages — including any text, images, voice recordings, or documents you
          send — are stored so your conversation history persists between sessions.
        </Section>

        <Section title="How your AI tutor messages are used">
          Messages you send to the AI tutor, including any attached images, voice recordings, or
          documents, are sent to Google's Gemini API to generate a response. Google processes this
          content under its own API terms and privacy policy. We don't control how Google's models
          are trained or whether your content is retained on their end — check Google's current
          Gemini API terms for specifics.
        </Section>

        <Section title="What we don't do">
          We don't sell your personal data. We don't share your learning data, notes, or AI
          conversations with third parties except the service providers listed below, who process
          it on our behalf to make the app work.
        </Section>

        <Section title="Third-party services we use">
          {"\u2022"} Firebase Authentication (Google) — account creation and sign-in{"\n"}
          {"\u2022"} Supabase — stores your profile, progress, and content data{"\n"}
          {"\u2022"} Google Gemini API — powers the AI tutor's responses
        </Section>

        <Section title="Your choices">
          You can edit or delete your notes, project submissions, and bookmarks from within the
          app at any time. To delete your account and associated data entirely, contact us using
          the details below — we don't currently expose in-app self-service account deletion.
        </Section>

        <Section title="Data security">
          We use standard provider-level security (Firebase Auth, Supabase's infrastructure) but
          no system is completely secure. Avoid sharing sensitive personal information in lesson
          notes or AI tutor conversations beyond what's needed to learn.
        </Section>

        <Section title="Children's privacy">
          NeuralLearn is not directed at children under 13 (or the relevant minimum age in your
          region), and we don't knowingly collect data from them. If you believe a child has
          created an account, contact us and we'll remove it.
        </Section>

        <Section title="Changes to this policy">
          We may update this policy as the app changes. Material changes will be reflected here
          with an updated date.
        </Section>

        <Section title="Contact">
          Questions about this policy or your data can be sent to the app's support contact
          (configure this before launch).
        </Section>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingBottom: space.sm },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  title: { fontSize: type.h1 + 2, fontWeight: "800" },
  content: { paddingHorizontal: space.md, paddingBottom: 50, gap: space.md },
  noticeCard: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: radius.md, borderWidth: 1, padding: 12 },
  noticeText: { flex: 1, fontSize: type.caption, lineHeight: 17 },
  updated: { fontSize: type.caption, fontWeight: "600" },
  section: { gap: 6 },
  sectionTitle: { fontSize: type.h2, fontWeight: "700" },
  body: { fontSize: type.bodySmall, lineHeight: 20 },
});