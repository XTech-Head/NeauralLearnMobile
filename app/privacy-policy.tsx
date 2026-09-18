// app/privacy-policy.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ScreenBackground } from "../src/components/ScreenBackground";
import { useTheme } from "../src/hooks/useTheme";
import { radius, space, type } from "../src/themes";

const LAST_UPDATED = "September 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: theme.text }]}>
        {title}
      </Text>

      <Text style={[s.body, { color: theme.textSecondary }]}>
        {children}
      </Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <ScreenBackground>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={theme.text}
          />
        </TouchableOpacity>

        <Text style={[s.title, { color: theme.text }]}>
          Privacy Policy
        </Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.updated, { color: theme.textTertiary }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Section title="1. About NeuralLearn">
          NeuralLearn is an AI-powered educational application developed by
          XTech Devs. The app is designed to help users create and study
          educational courses using artificial intelligence.

          {"\n\n"}

          NeuralLearn can generate learning material based on topics,
          instructions, and other information provided by the user. It may
          also provide AI-assisted explanations, questions, quizzes,
          summaries, and other educational content depending on the features
          available in the app.
        </Section>

        <Section title="2. Information we collect">
          NeuralLearn collects only information reasonably necessary to
          provide its account, course-generation, and learning features.

          {"\n\n"}

          When you create or use an account, this may include your email
          address, username, authentication information, and information
          associated with your account.

          {"\n\n"}

          When you use NeuralLearn&apos;s educational features, we may store
          information such as generated courses, course progress, quiz
          results, learning activity, notes, saved content, achievements,
          streaks, and other educational data that you choose to create or
          save.
        </Section>

        <Section title="3. Information you provide to the AI">
          When you request an AI-generated course or use an AI learning
          feature, you may provide information such as a subject, topic,
          learning goal, difficulty level, questions, instructions, or other
          educational prompts.

          {"\n\n"}

          If a feature allows you to submit additional content, such as
          images, documents, or other files, that content may be processed as
          part of your request.

          {"\n\n"}

          You are responsible for the information you choose to submit.
          Please do not provide passwords, payment-card information, government
          identification numbers, or other highly sensitive personal
          information unless a feature specifically requires it.
        </Section>

        <Section title="4. How AI processing works">
          NeuralLearn uses third-party artificial intelligence services to
          generate educational content and responses.

          {"\n\n"}

          Information required to fulfill an AI request may be transmitted to
          the applicable AI service provider. For NeuralLearn&apos;s current AI
          functionality, this includes Google&apos;s Gemini API.

          {"\n\n"}

          The AI provider may process the submitted information according to
          its own terms, privacy policies, and applicable data-processing
          practices. NeuralLearn does not control the internal systems,
          security practices, or retention policies of third-party providers.
        </Section>

        <Section title="5. How we use your information">
          We use collected information to:

          {"\n\n"}

          {"• "}create and manage your NeuralLearn account
          {"\n\n"}
          {"• "}generate AI-powered courses and learning material
          {"\n\n"}
          {"• "}provide AI-assisted educational responses
          {"\n\n"}
          {"• "}save your courses and learning progress
          {"\n\n"}
          {"• "}maintain quiz, achievement, streak, and learning data
          {"\n\n"}
          {"• "}provide requested app functionality
          {"\n\n"}
          {"• "}respond to support and account-related requests
          {"\n\n"}
          {"• "}protect the security and integrity of the application
          {"\n\n"}
          {"• "}maintain and operate NeuralLearn
        </Section>

        <Section title="6. Your AI-generated content">
          NeuralLearn may store courses, explanations, quizzes, questions,
          answers, notes, and other educational material generated through
          the application so that you can access and continue using your
          learning content.

          {"\n\n"}

          AI-generated content may contain errors, omissions, outdated
          information, or inaccurate statements. NeuralLearn is an educational
          tool and does not guarantee that AI-generated material is accurate,
          complete, current, or suitable for a particular purpose.

          {"\n\n"}

          You should independently verify important information, especially
          information involving health, law, finance, safety, academic
          requirements, or other situations where incorrect information could
          cause harm.
        </Section>

        <Section title="7. Third-party services">
          NeuralLearn relies on third-party infrastructure to provide its
          functionality. These services may process information on behalf of
          or in connection with the application.

          {"\n\n"}

          {"• "}Firebase Authentication (Google) — account authentication and
          sign-in.
          {"\n\n"}

          {"• "}Supabase — storage and management of application data,
          including account-associated learning data.
          {"\n\n"}

          {"• "}Google Gemini API — AI-powered course generation and AI
          learning responses.
        </Section>

        <Section title="8. Data sharing and sale">
          NeuralLearn does not sell your personal information.

          {"\n\n"}

          We do not intentionally make your private account information,
          learning progress, courses, notes, or AI interactions publicly
          available.

          {"\n\n"}

          Information may be transmitted to or processed by third-party
          service providers when necessary to authenticate your account,
          store your information, generate AI content, provide requested
          functionality, maintain security, or operate NeuralLearn.

          {"\n\n"}

          We may also disclose information where required by applicable law,
          legal process, or a valid governmental request, or where reasonably
          necessary to protect the rights, security, and integrity of
          NeuralLearn, its users, or others.
        </Section>

        <Section title="9. Data security">
          We use security mechanisms provided by the infrastructure and
          services used to operate NeuralLearn.

          {"\n\n"}

          However, no application, database, network, or internet transmission
          can be guaranteed to be completely secure. We therefore cannot
          guarantee absolute security of information transmitted to or stored
          by NeuralLearn.

          {"\n\n"}

          You are responsible for maintaining the security of your account
          credentials and should not share your authentication information
          with other people.
        </Section>

        <Section title="10. Data retention">
          We retain account and learning information for as long as reasonably
          necessary to provide NeuralLearn&lsquo;s services, maintain your account,
          preserve requested learning functionality, address security or
          technical issues, comply with applicable legal obligations, and
          resolve disputes.

          {"\n\n"}

          Different third-party service providers may retain information for
          different periods according to their own policies and technical
          requirements.
        </Section>

        <Section title="11. Account and data deletion">
          You may request deletion of your NeuralLearn account and associated
          personal information by contacting NeuralLearn support.

          {"\n\n"}

          Account deletion requests should be sent to:

          {"\n\n"}

          xam77950@gmail.com

          {"\n\n"}

          When a deletion request is processed, we will take reasonable steps
          to delete or anonymize information associated with the account,
          subject to information that must be retained for legitimate legal,
          security, fraud-prevention, dispute-resolution, or operational
          purposes.

          {"\n\n"}

          Data held by third-party providers may also be subject to their own
          retention and deletion procedures.
        </Section>

        <Section title="12. Children's privacy">
          NeuralLearn is not directed toward children under 13 years of age,
          or the applicable minimum age for processing personal information
          without parental consent in the user&apos;s jurisdiction.

          {"\n\n"}

          We do not knowingly request or intentionally collect personal
          information from children below the applicable minimum age.

          {"\n\n"}

          If you believe that a child has provided personal information to
          NeuralLearn without appropriate authorization, contact us at
          xam77950@gmail.com so that the situation can be reviewed and
          appropriate action can be taken.
        </Section>

        <Section title="13. International processing">
          NeuralLearn and the third-party services it uses may process or
          store information on servers located in countries other than the
          country where you live.

          {"\n\n"}

          By using NeuralLearn, information necessary to provide the service
          may therefore be transferred to and processed in other
          jurisdictions, subject to applicable laws and the policies of the
          service providers we use.
        </Section>

        <Section title="14. Your responsibilities when using NeuralLearn">
          You should use reasonable care when deciding what information to
          submit to NeuralLearn or its AI features.

          {"\n\n"}

          Do not use NeuralLearn to submit unlawful content, another person&lsquo;s
          private information without authorization, malicious content, or
          information that you do not have the right to provide to an AI
          service.

          {"\n\n"}

          AI-generated educational content should be treated as assistance and
          not as a guaranteed source of truth.
        </Section>

        <Section title="15. Changes to this Privacy Policy">
          We may update this Privacy Policy when NeuralLearn&apos;s features,
          infrastructure, data practices, or legal requirements change.

          {"\n\n"}

          When we make changes, the “Last updated” date shown at the beginning
          of this policy will be updated.

          {"\n\n"}

          The version published within NeuralLearn will represent the policy
          applicable to the application at that time.
        </Section>

        <Section title="16. Contact us">
          If you have questions about this Privacy Policy, your personal
          information, AI processing, or an account deletion request, contact
          NeuralLearn support.

          {"\n\n"}

          Email: xam77950@gmail.com
          {"\n"}
          Phone: +254 708 201 715
          {"\n"}
          Developer: XTech Devs
        </Section>

        <View
          style={[
            s.footerCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={theme.primary}
          />

          <Text style={[s.footerText, { color: theme.textSecondary }]}>
            NeuralLearn is developed and maintained by XTech Devs.
          </Text>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },

  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  title: {
    fontSize: type.h1 + 2,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: space.md,
    paddingBottom: 50,
    gap: space.lg,
  },

  updated: {
    fontSize: type.caption,
    fontWeight: "600",
  },

  section: {
    gap: 7,
  },

  sectionTitle: {
    fontSize: type.h2,
    fontWeight: "700",
  },

  body: {
    fontSize: type.bodySmall,
    lineHeight: 21,
  },

  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    marginTop: space.sm,
  },

  footerText: {
    flex: 1,
    fontSize: type.caption,
    lineHeight: 18,
  },
});