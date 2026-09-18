/* eslint-disable react/no-unescaped-entities */
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

export default function TermsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <ScreenBackground>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={theme.text}
          />
        </TouchableOpacity>

        <Text style={[s.title, { color: theme.text }]}>
          Terms of Service
        </Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.intro, { color: theme.textSecondary }]}>
          These Terms of Service govern your use of NeuralLearn Mobile.
          By creating an account or using the application, you agree to
          these Terms. If you do not agree with them, please do not use
          NeuralLearn Mobile.
        </Text>

        <Text style={[s.updated, { color: theme.textTertiary }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Section title="1. Acceptance of these terms">
          By accessing or using NeuralLearn Mobile, you confirm that you
          have read, understood, and agree to these Terms of Service and
          our Privacy Policy.

          {"\n\n"}

          If you are using NeuralLearn Mobile on behalf of an organization
          or another person, you confirm that you have the authority to
          accept these Terms on their behalf.
        </Section>

        <Section title="2. About NeuralLearn Mobile">
          NeuralLearn Mobile is an educational application designed to
          support learning through educational content, quizzes,
          activities, projects, progress tracking, achievements, and an
          AI-powered tutor.

          {"\n\n"}

          NeuralLearn Mobile is intended as a learning and educational
          tool. It does not replace qualified teachers, educational
          institutions, or professional advice.
        </Section>

        <Section title="3. Accounts and registration">
          Some features of NeuralLearn Mobile require an account.

          {"\n\n"}

          You are responsible for providing accurate information when
          creating your account and for keeping your account credentials
          secure. You are also responsible for activity carried out
          through your account.

          {"\n\n"}

          You should notify us if you believe that your account has been
          accessed or used without your permission.
        </Section>

        <Section title="4. Educational content">
          NeuralLearn Mobile provides educational materials for learning
          purposes. While reasonable efforts may be made to keep content
          useful and accurate, we do not guarantee that every lesson,
          explanation, quiz, example, or other educational material is
          complete, error-free, or suitable for every learner.

          {"\n\n"}

          You are responsible for evaluating information provided through
          the application and using appropriate independent sources when
          necessary.
        </Section>

        <Section title="5. AI tutor">
          NeuralLearn Mobile may provide an AI-powered tutor that generates
          responses based on your questions and the information provided
          to it.

          {"\n\n"}

          AI-generated responses may contain mistakes, omissions,
          outdated information, or inappropriate conclusions. The AI
          tutor should not be treated as a human teacher or as a
          substitute for professional advice.

          {"\n\n"}

          Do not rely on NeuralLearn's AI tutor for legal, medical,
          financial, emergency, or other professional advice. Verify
          important information independently.

          {"\n\n"}

          AI responses are generated automatically and may vary between
          requests. We do not guarantee that the AI tutor will always be
          available or provide a particular response.
        </Section>

        <Section title="6. Your content">
          You retain ownership of content that you create and submit
          through NeuralLearn Mobile, including notes, project work,
          messages, and other personal content, subject to any rights
          belonging to third parties.

          {"\n\n"}

          By submitting content to NeuralLearn Mobile, you grant us the
          permissions necessary to store, process, display, and provide
          that content back to you as part of the application's features.

          {"\n\n"}

          Where an AI feature requires your content to generate a
          response, that content may be processed by the third-party AI
          service used to provide that feature, as described in our
          Privacy Policy.

          {"\n\n"}

          You are responsible for ensuring that content you submit does
          not violate applicable laws or the rights of other people.
        </Section>

        <Section title="7. Prohibited use">
          You agree not to use NeuralLearn Mobile to:

          {"\n\n"}

          • Upload or distribute unlawful, abusive, threatening,
          fraudulent, or harmful content.

          {"\n"}

          • Harass, impersonate, or intentionally harm other users.

          {"\n"}

          • Attempt to gain unauthorized access to accounts, systems,
          databases, or services.

          {"\n"}

          • Reverse engineer, exploit, disrupt, or interfere with the
          application's security or operation.

          {"\n"}

          • Use the application to distribute malware or other malicious
          software.

          {"\n"}

          • Abuse automated systems, APIs, or AI features.

          {"\n"}

          • Use the application for purposes that violate applicable
          laws or regulations.
        </Section>

        <Section title="8. XP, streaks, achievements, and progress">
          XP, streaks, achievements, progress indicators, leaderboards,
          and similar features are provided for educational motivation
          and engagement.

          {"\n\n"}

          They have no monetary value and do not represent guaranteed
          academic qualifications, certifications, employment
          opportunities, or other financial benefits.

          {"\n\n"}

          We may correct, reset, modify, or remove progress or
          achievement data when reasonably necessary, including in cases
          involving technical errors, abuse, or changes to the
          application.
        </Section>

        <Section title="9. Third-party services">
          NeuralLearn Mobile may rely on third-party services to provide
          certain functionality, including authentication, databases,
          hosting, analytics where applicable, and AI services.

          {"\n\n"}

          Your use of features that depend on third-party services may
          therefore also be subject to the terms and policies of those
          providers.

          {"\n\n"}

          We are not responsible for failures, interruptions, or changes
          to third-party services that are outside our reasonable
          control.
        </Section>

        <Section title="10. Availability and changes">
          We may modify, update, suspend, or discontinue parts of
          NeuralLearn Mobile as the application develops.

          {"\n\n"}

          We do not guarantee that the application or any particular
          feature will always be available, uninterrupted, secure, or
          error-free.

          {"\n\n"}

          We may perform maintenance, updates, or other changes that
          temporarily affect availability.
        </Section>

        <Section title="11. Intellectual property">
          NeuralLearn Mobile, including its software, interface,
          branding, logos, original educational materials, designs, and
          other original content, is protected by applicable intellectual
          property laws.

          {"\n\n"}

          Except where expressly permitted, you may not copy, modify,
          distribute, sell, sublicense, reverse engineer, or create
          derivative works from the application or its protected
          materials.
        </Section>

        <Section title="12. Privacy">
          Your use of NeuralLearn Mobile is also governed by our Privacy
          Policy, which explains what information may be collected, how
          it is used, and how it may be shared with service providers.

          {"\n\n"}

          Please review the Privacy Policy before using the application.
        </Section>

        <Section title="13. Account suspension or termination">
          You may stop using NeuralLearn Mobile at any time.

          {"\n\n"}

          We may restrict, suspend, or terminate access to an account
          where reasonably necessary, including when these Terms are
          violated, the application is abused, or continued access
          creates a security or legal risk.

          {"\n\n"}

          Where appropriate, we may take reasonable steps to notify you
          of a suspension or termination.
        </Section>

        <Section title="14. Disclaimer">
          NeuralLearn Mobile is provided on an "as is" and "as available"
          basis to the extent permitted by applicable law.

          {"\n\n"}

          We do not guarantee that the application will be uninterrupted,
          completely secure, error-free, or that its educational or
          AI-generated content will always be accurate or current.

          {"\n\n"}

          Nothing in these Terms excludes or limits any rights or
          protections that cannot legally be excluded or limited under
          applicable law.
        </Section>

        <Section title="15. Limitation of liability">
          To the fullest extent permitted by applicable law, we will not
          be responsible for indirect, incidental, special,
          consequential, or similar losses arising from your use of, or
          inability to use, NeuralLearn Mobile.

          {"\n\n"}

          This includes losses arising from reliance on AI-generated
          responses or educational information, except where liability
          cannot legally be excluded or limited.
        </Section>

        <Section title="16. Changes to these terms">
          We may update these Terms of Service from time to time to
          reflect changes to NeuralLearn Mobile, its features, applicable
          requirements, or our practices.

          {"\n\n"}

          When material changes are made, we may provide reasonable
          notice through the application or another appropriate method.

          {"\n\n"}

          The updated Terms will become effective on the date stated in
          the updated version.
        </Section>

        <Section title="17. Contact">
  If you have questions, concerns, or requests regarding these Terms of
  Service, you can contact NeuralLearn Mobile through the following
  official channels.

  {"\n\n"}

  Email: xam77950@gmail.com

  {"\n"}

  Phone: +254 708 201 715

  {"\n"}

  Website: https://xtech-devs-portfolio-head.vercel.app
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
            name="document-text-outline"
            size={18}
            color={theme.primary}
          />

          <Text style={[s.footerText, { color: theme.textSecondary }]}>
            By using NeuralLearn Mobile, you acknowledge that you have
            read and agreed to these Terms of Service.
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
  },

  title: {
    fontSize: type.h1 + 2,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: space.md,
    paddingBottom: 50,
    gap: space.md,
  },

  intro: {
    fontSize: type.bodySmall,
    lineHeight: 21,
  },

  updated: {
    fontSize: type.caption,
    fontWeight: "600",
  },

  section: {
    gap: 6,
  },

  sectionTitle: {
    fontSize: type.h2,
    fontWeight: "700",
  },

  body: {
    fontSize: type.bodySmall,
    lineHeight: 20,
  },

  footerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
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