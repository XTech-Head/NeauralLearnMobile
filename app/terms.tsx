/* eslint-disable react/no-unescaped-entities -- long-form prose content */
// app/terms.tsx — terms of service (template — see disclaimer at top)
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

export default function TermsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <ScreenBackground>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>Terms of Service</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.noticeCard, { backgroundColor: theme.warning + "16", borderColor: theme.warning + "35" }]}>
          <Ionicons name="alert-circle" size={16} color={theme.warning} />
          <Text style={[s.noticeText, { color: theme.text }]}>
            This is a template, not legal advice. Have a lawyer review and adapt it — especially
            the liability and dispute sections — before shipping to real users.
          </Text>
        </View>

        <Text style={[s.updated, { color: theme.textTertiary }]}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Acceptance of terms">
          By creating an account or using NeuralLearn, you agree to these terms. If you don't
          agree, please don't use the app.
        </Section>

        <Section title="2. What NeuralLearn is">
          NeuralLearn is an educational app offering courses, quizzes, hands-on projects, and an
          AI tutor to help you learn AI/ML concepts. It's provided as-is, for learning purposes.
        </Section>

        <Section title="3. Your account">
          You're responsible for keeping your login credentials secure and for all activity under
          your account. You must provide accurate information when signing up.
        </Section>

        <Section title="4. The AI tutor isn't a professional">
          Responses from the AI tutor (powered by Google's Gemini) are generated automatically and
          may be incorrect, incomplete, or outdated. Don't treat them as professional, academic,
          legal, medical, or financial advice. Verify anything important independently.
        </Section>

        <Section title="5. Acceptable use">
          Don't use NeuralLearn to upload illegal content, harass others, attempt to breach
          security, or misuse the AI tutor to generate harmful content. We may suspend accounts
          that violate this.
        </Section>

        <Section title="6. Your content">
          You keep ownership of the notes, project submissions, and messages you create. By
          submitting them, you allow us to store and display them back to you within the app, and
          to send AI tutor messages to Google's Gemini API to generate responses (see Privacy
          Policy).
        </Section>

        <Section title="7. Achievements, XP, and streaks">
          XP, streaks, achievements, and leaderboard rankings are for motivation within the app
          and have no monetary value. We may reset or adjust them if we find bugs or abuse.
        </Section>

        <Section title="8. Termination">
          You can stop using the app anytime. We may suspend or terminate accounts that violate
          these terms.
        </Section>

        <Section title="9. Disclaimer & limitation of liability">
          NeuralLearn is provided "as is" without warranties of any kind. To the fullest extent
          permitted by law, we aren't liable for damages arising from your use of the app,
          including reliance on AI tutor responses.
        </Section>

        <Section title="10. Changes to these terms">
          We may update these terms as the app evolves. Continued use after changes means you
          accept the updated terms.
        </Section>

        <Section title="11. Contact">
          Questions about these terms can be sent to the app's support contact (configure this
          before launch).
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