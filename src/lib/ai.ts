// src/lib/ai.ts — AI tutor, on OpenRouter (was src/lib/gemini.ts / Gemini).
//
// Model: google/gemma-4-26b-a4b-it:free — currently the best free, no-card
// multimodal model on OpenRouter (text + image input, 262K context). OpenRouter's
// free tier needs no credit card at all: 50 requests/day forever, or 1,000/day
// once you've ever added credit (which does need a card — so if you're avoiding
// a card entirely, budget for the 50/day tier).
//
// Two things this deliberately does NOT do, both intentional:
//  - No audio input. No free OpenRouter model accepts raw audio, unlike
//    Gemini. Voice messages are transcribed on-device instead (see
//    src/hooks/useVoiceRecorder.ts) and arrive here as plain text, identical
//    to something the user typed — this file never sees a recording.
//  - No document/PDF input. Free-tier vision models reliably accept images;
//    PDF-as-a-file support varies by provider and isn't confirmed for this
//    model, so it's out of scope here rather than shipped unverified.
//
// OpenRouter speaks the OpenAI-compatible /chat/completions format, so this
// is a plain fetch() — no SDK needed at all (one less dependency than Gemini
// required).

const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY!;
const MODEL = "google/gemma-4-26b-a4b-it:free";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
// Fallback chain for when the primary model's shared free pool gets
// upstream-rate-limited (a routine 429 on always-free models — see the
// header note above, and not a bug in this file). OpenRouter tries these
// in order within a single request if an earlier one is unavailable.
// Capped at 3 entries — that's an OpenRouter API limit, not a choice.
// Both fallbacks are free, multimodal (text + image) models, so a request
// with an image attachment still works if it falls through.
// `openrouter/free` is kept last as a catch-all: it's OpenRouter's own
// auto-router, which filters for whatever capabilities the request needs
// (here, image understanding) and picks whichever free model is actually
// up right now, so it isn't tied to any single provider's capacity — this
// alone covers most of what a longer chain would have bought us.
const FALLBACK_MODELS = [
  MODEL,
  "inclusionai/ling-3.0-flash-vl:free",
  "openrouter/free",
];
const SYSTEM_INSTRUCTION =
  "You are NeuralTutor, a friendly, encouraging AI tutor inside NeuralLearn, " +
  "an app that teaches AI/ML concepts. Keep answers concise, use simple " +
  "analogies, and adapt to the learner's level. If they share an image, " +
  "ground your answer in what's actually in it. If asked something " +
  "unrelated to learning, gently redirect back to the topic.";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export type AttachmentKind = "image";

export interface Attachment {
  kind: AttachmentKind;
  /** base64-encoded file data, no data: URL prefix */
  base64: string;
  mimeType: string;
}

export interface GeneratedLessonPlan {
  title: string;
  content: string;
  duration_minutes: number;
  xp_reward: number;
}

export interface GeneratedQuizQuestionPlan {
  question: string;
  options: string[];
  correct_index: number;
}

export interface CourseGenerationOptions {
  level?: "beginner" | "intermediate" | "advanced";
  durationMinutes?: number;
  learningGoals?: string[];
}

export interface GeneratedCoursePlan {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category_name: string;
  lessons: GeneratedLessonPlan[];
  quiz_title: string;
  quiz_questions: GeneratedQuizQuestionPlan[];
  project_title: string;
  project_description: string;
  project_instructions: string;
}

export interface CourseToolRecommendation {
  label: string;
  url: string;
}

export function getCourseToolRecommendations(
  title: string,
): CourseToolRecommendation[] {
  const value = (title ?? "").toLowerCase();

  if (value.includes("python")) {
    return [
      {
        label: "Python Playground",
        url: "https://www.programiz.com/python-programming/online-compiler",
      },
      { label: "Google Colab", url: "https://colab.research.google.com/" },
    ];
  }

  if (
    value.includes("javascript") ||
    value.includes("web") ||
    value.includes("ui") ||
    value.includes("frontend") ||
    value.includes("design")
  ) {
    return [
      { label: "Code Playground", url: "https://playcode.io/" },
      { label: "Figma", url: "https://www.figma.com/" },
    ];
  }

  if (
    value.includes("ai") ||
    value.includes("machine learning") ||
    value.includes("prompt") ||
    value.includes("llm")
  ) {
    return [
      {
        label: "OpenAI Playground",
        url: "https://platform.openai.com/playground",
      },
      { label: "Google Colab", url: "https://colab.research.google.com/" },
    ];
  }

  if (
    value.includes("data") ||
    value.includes("analytics") ||
    value.includes("sql") ||
    value.includes("excel")
  ) {
    return [
      { label: "Google Colab", url: "https://colab.research.google.com/" },
      { label: "Kaggle", url: "https://www.kaggle.com/" },
    ];
  }

  if (
    value.includes("business") ||
    value.includes("marketing") ||
    value.includes("strategy")
  ) {
    return [
      { label: "Canva", url: "https://www.canva.com/" },
      { label: "Notion", url: "https://www.notion.so/" },
    ];
  }

  return [
    { label: "Code Playground", url: "https://playcode.io/" },
    { label: "Google Colab", url: "https://colab.research.google.com/" },
  ];
}

export async function generateLearningToolsForSubject(
  subject: string,
): Promise<CourseToolRecommendation[]> {
  const topic = (subject || "learning").trim();
  if (!topic) return getCourseToolRecommendations("learning");

  try {
    const response = await askAI(
      [],
      `Suggest 3 highly relevant, practical learning tools, coding sandboxes, docs, or websites for someone learning about ${topic}. Return valid JSON: {"tools":[{"label":"...","url":"https://..."}]}. Only include safe, real URLs.`,
    );

    const cleaned = response
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const tools = Array.isArray(parsed?.tools) ? parsed.tools : [];
    if (tools.length > 0) {
      return tools.filter((tool: any) => tool?.label && tool?.url).slice(0, 3);
    }
  } catch (e) {
    console.warn("AI tool generation failed, using fallback:", e);
  }

  return getCourseToolRecommendations(topic);
}

// OpenRouter/OpenAI message content parts.
type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

/**
 * Sends a message (optionally with one image attachment) to the model,
 * given the prior turn history, and returns the reply text.
 */
export async function generateCoursePlanFromPrompt(
  prompt: string,
  options?: CourseGenerationOptions,
): Promise<GeneratedCoursePlan> {
  const normalizedGoals = (options?.learningGoals ?? [])
    .map((goal) => goal.trim())
    .filter(Boolean);

  const systemPrompt =
    'You are NeuralLearn\'s course designer. Create a complete learning course from the user\'s prompt. Return ONLY valid JSON with this exact shape: {\n  "title": string,\n  "description": string,\n  "difficulty": "beginner" | "intermediate" | "advanced",\n  "category_name": string,\n  "lessons": [{"title": string, "content": string, "duration_minutes": number, "xp_reward": number}],\n  "quiz_title": string,\n  "quiz_questions": [{"question": string, "options": [string, string, string, string], "correct_index": number}],\n  "project_title": string,"project_description": string,"project_instructions": string\n}. The course must be built only from the user\'s idea; do not pull from the internet or mention external sources. Create 4 to 6 lessons, each with richer, chapter-like educational content (2-4 paragraphs with clear explanations, examples, and takeaway notes), 2 to 4 quiz questions, and a practical mini-project. Keep output concise but substantially useful for real learning.';

  const contextParts = [
    `User request: ${prompt}`,
    `Target level: ${options?.level ?? "beginner"}`,
    `Target duration: ${options?.durationMinutes ?? 45} minutes`,
    normalizedGoals.length > 0
      ? `Learning goals: ${normalizedGoals.join(", ")}`
      : "Learning goals: general mastery",
  ];

  const response = await askAI(
    [],
    `${systemPrompt}\n\n${contextParts.join("\n")}`,
  );
  const cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!parsed?.title || !Array.isArray(parsed.lessons)) {
    throw new Error("The AI response was not a valid course plan.");
  }

  return parsed as GeneratedCoursePlan;
}

export async function askAI(
  history: ChatMessage[],
  text: string,
  attachment?: Attachment,
): Promise<string> {
  const messages: OpenRouterMessage[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    })),
  ];

  if (attachment) {
    const parts: ContentPart[] = [];
    if (text.trim()) parts.push({ type: "text", text: text.trim() });
    else
      parts.push({
        type: "text",
        text: "(The learner shared an image — describe or explain what's relevant in it.)",
      });
    parts.push({
      type: "image_url",
      image_url: {
        url: `data:${attachment.mimeType};base64,${attachment.base64}`,
      },
    });
    messages.push({ role: "user", content: parts });
  } else {
    messages.push({ role: "user", content: text.trim() });
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Optional, but lets this app show up correctly on OpenRouter's own
      // dashboards/leaderboards rather than as an anonymous caller.
      "HTTP-Referer": "https://neurallearn.app",
      "X-Title": "NeuralLearn",
    },
    body: JSON.stringify({
      // `models` (plural) instead of `model`: OpenRouter tries each entry
      // in order within this one request if an earlier one 429s or is
      // otherwise unavailable, so a shared-pool rate limit on the primary
      // model no longer surfaces as a user-facing error. See FALLBACK_MODELS.
      models: FALLBACK_MODELS,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter request failed (${response.status}): ${errText}`,
    );
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
