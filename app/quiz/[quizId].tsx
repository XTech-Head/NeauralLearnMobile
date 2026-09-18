// app/quiz/[quizId].tsx — course quiz: step through questions, then results
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ErrorState } from "../../src/components/ErrorState";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { askAI } from "../../src/lib/ai";
import {
  getBestQuizAttempt,
  getQuizWithQuestions,
  submitQuizAttempt,
} from "../../src/lib/db";
import { notifyNewAchievements } from "../../src/lib/notify";
import { radius, space, type } from "../../src/themes";

type QuizData = Awaited<ReturnType<typeof getQuizWithQuestions>>;
type SubmitResult = Awaited<ReturnType<typeof submitQuizAttempt>>;

export default function QuizScreen() {
  const { quizId, courseId } = useLocalSearchParams<{
    quizId: string;
    courseId: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user: authUser } = useAuth();

  const [data, setData] = useState<QuizData | null>(null);
  const [bestAttempt, setBestAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [questionHint, setQuestionHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);

  const load = useCallback(async () => {
    if (!quizId || !authUser) return;
    setError(null);
    try {
      const [d, best] = await Promise.all([
        getQuizWithQuestions(quizId),
        getBestQuizAttempt(authUser.uid, quizId),
      ]);
      setData(d);
      setBestAttempt(best);
    } catch (e) {
      console.error("Quiz load error:", e);
      setError("Couldn't load this quiz. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [quizId, authUser]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ScreenBackground style={s.center}>
        <ActivityIndicator color={theme.primary} />
      </ScreenBackground>
    );
  }

  if (error || !data) {
    return (
      <ScreenBackground>
        <ErrorState
          message={error ?? "This quiz couldn't be found."}
          onRetry={load}
        />
      </ScreenBackground>
    );
  }

  const { quiz, questions } = data;
  const question = questions[step];
  const isLast = step === questions.length - 1;
  const canAdvance = !!answers[question?.id];

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    setOpenAnswer((prev) => prev || "");
  };

  const handleHint = async () => {
    if (!question) return;
    setHintLoading(true);
    try {
      const hint = await askAI(
        [],
        `Give a short, helpful hint for this learning question without directly giving the answer: ${question.question}. Keep it concise and educational.`,
      );
      setQuestionHint(hint.trim());
    } catch (e) {
      console.error("Quiz hint error:", e);
      setQuestionHint(
        "Try reading the question again and focus on the core concept from this lesson.",
      );
    } finally {
      setHintLoading(false);
    }
  };

  const handleNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    if (!authUser || !quizId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await submitQuizAttempt(authUser.uid, quizId, answers);
      setResult(r);
      notifyNewAchievements(r.newAchievements);
    } catch (e) {
      console.error("Quiz submit error:", e);
      setSubmitError(
        "Couldn't submit your quiz. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setStep(0);
  };

  if (result) {
    return (
      <ScreenBackground>
        <View style={s.resultRoot}>
          <View
            style={[
              s.resultIcon,
              {
                backgroundColor: result.passed
                  ? theme.success + "20"
                  : theme.danger + "20",
              },
            ]}
          >
            <Ionicons
              name={result.passed ? "trophy" : "refresh-circle"}
              size={36}
              color={result.passed ? theme.success : theme.danger}
            />
          </View>
          <Text style={[s.resultScore, { color: theme.text }]}>
            {result.scorePercent}%
          </Text>
          <Text style={[s.resultLabel, { color: theme.textTertiary }]}>
            {result.correctCount} of {result.totalQuestions} correct
          </Text>
          <Text
            style={[
              s.resultStatus,
              { color: result.passed ? theme.success : theme.danger },
            ]}
          >
            {result.passed ? "Passed!" : `Needs ${quiz.passing_score}% to pass`}
          </Text>
          {result.xpAwarded > 0 && (
            <View
              style={[
                s.xpBadge,
                { backgroundColor: theme.primaryLight + "22" },
              ]}
            >
              <Ionicons name="flash" size={13} color={theme.primary} />
              <Text style={[s.xpBadgeText, { color: theme.primary }]}>
                +{result.xpAwarded} XP
              </Text>
            </View>
          )}

          <View style={s.resultActions}>
            {!result.passed && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: theme.primary }]}
                onPress={handleRetry}
              >
                <Text style={[s.actionBtnText, { color: theme.bg }]}>
                  Try again
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                s.actionBtn,
                result.passed
                  ? { backgroundColor: theme.primary }
                  : {
                      backgroundColor: theme.surfaceStrong,
                      borderWidth: 1,
                      borderColor: theme.border,
                    },
              ]}
              onPress={() =>
                router.replace({
                  pathname: "/course/[courseId]",
                  params: { courseId },
                })
              }
            >
              <Text
                style={[
                  s.actionBtnText,
                  { color: result.passed ? theme.bg : theme.text },
                ]}
              >
                Back to course
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <Text style={[s.kicker, { color: theme.textTertiary }]}>
          Question {step + 1} of {questions.length}
        </Text>
        <Text style={[s.title, { color: theme.text }]}>{quiz.title}</Text>
        {bestAttempt && (
          <Text style={[s.bestScore, { color: theme.textTertiary }]}>
            Best score so far: {bestAttempt.score_percent}%
          </Text>
        )}

        <View style={[s.progressBar, { backgroundColor: theme.bgTertiary }]}>
          <View
            style={[
              s.progressFill,
              {
                width: `${((step + 1) / questions.length) * 100}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>

        <View
          style={[
            s.questionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[s.questionText, { color: theme.text }]}>
            {question?.question}
          </Text>
        </View>

        <View
          style={[
            s.answerCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[s.answerLabel, { color: theme.textTertiary }]}>
            Your answer
          </Text>
          <TextInput
            style={[
              s.answerInput,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Write your answer here..."
            placeholderTextColor={theme.textTertiary}
            value={openAnswer}
            onChangeText={setOpenAnswer}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              s.hintButton,
              {
                backgroundColor: theme.primaryLight + "18",
                borderColor: theme.border,
              },
            ]}
            onPress={handleHint}
            disabled={hintLoading}
          >
            <Text style={[s.hintButtonText, { color: theme.primary }]}>
              {hintLoading ? "Thinking..." : "Ask AI for a hint"}
            </Text>
          </TouchableOpacity>
          {questionHint ? (
            <View
              style={[
                s.hintBox,
                { backgroundColor: theme.bg, borderColor: theme.border },
              ]}
            >
              <Text style={[s.hintText, { color: theme.textSecondary }]}>
                {questionHint}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={s.optionsList}>
          {question?.options
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((opt) => {
              const selected = answers[question.id] === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    s.optionRow,
                    {
                      backgroundColor: theme.surface,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                    selected && { backgroundColor: theme.primaryLight + "18" },
                  ]}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.radio,
                      {
                        borderColor: selected
                          ? theme.primary
                          : theme.textTertiary,
                      },
                      selected && { backgroundColor: theme.primary },
                    ]}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={12} color={theme.bg} />
                    )}
                  </View>
                  <Text style={[s.optionText, { color: theme.text }]}>
                    {opt.option_text}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {submitError && (
          <ErrorState
            message={submitError}
            onRetry={handleNext}
            retrying={submitting}
            compact
          />
        )}

        <TouchableOpacity
          style={[
            s.nextBtn,
            {
              backgroundColor: canAdvance ? theme.primary : theme.surfaceStrong,
              opacity: canAdvance ? 1 : 0.6,
            },
          ]}
          onPress={handleNext}
          disabled={!canAdvance || submitting}
        >
          <Text
            style={[
              s.nextBtnText,
              { color: canAdvance ? theme.bg : theme.textTertiary },
            ]}
          >
            {submitting ? "Submitting..." : isLast ? "Submit quiz" : "Next"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: space.md, paddingBottom: 50, gap: 12 },
  backBtn: { width: 32, height: 32, justifyContent: "center", marginBottom: 2 },
  kicker: { fontSize: type.bodySmall, fontWeight: "600" },
  title: { fontSize: type.h1 + 2, fontWeight: "800", letterSpacing: -0.4 },
  bestScore: { fontSize: type.caption, marginTop: -4 },
  progressBar: {
    height: 5,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: { height: "100%", borderRadius: 999 },
  questionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  questionText: { fontSize: type.h1, fontWeight: "700", lineHeight: 24 },
  answerCard: { borderRadius: radius.lg, borderWidth: 1, padding: 12, gap: 8 },
  answerLabel: { fontSize: type.caption, fontWeight: "600" },
  answerInput: {
    minHeight: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    fontSize: type.bodySmall,
  },
  hintButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 9,
    alignItems: "center",
  },
  hintButtonText: { fontSize: type.bodySmall, fontWeight: "700" },
  hintBox: { borderRadius: radius.md, borderWidth: 1, padding: 10 },
  hintText: { fontSize: type.bodySmall, lineHeight: 18 },
  optionsList: { gap: 9 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: 13,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    fontSize: type.bodySmall,
    fontWeight: "500",
    lineHeight: 19,
  },
  nextBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 4,
  },
  nextBtnText: { fontSize: type.body, fontWeight: "700" },

  resultRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
    gap: 4,
  },
  resultIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  resultScore: { fontSize: 44, fontWeight: "800", letterSpacing: -1 },
  resultLabel: { fontSize: type.body },
  resultStatus: { fontSize: type.h1, fontWeight: "700", marginTop: 6 },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 14,
  },
  xpBadgeText: { fontSize: type.bodySmall, fontWeight: "700" },
  resultActions: { width: "100%", gap: 10, marginTop: 28 },
  actionBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 15,
  },
  actionBtnText: { fontSize: type.body, fontWeight: "700" },
});
