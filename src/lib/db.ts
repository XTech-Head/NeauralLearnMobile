// src/lib/db.ts — Supabase query helpers (replaces the old Drizzle layer)
import type {
  AchievementRow,
  CategoryRow,
  CourseRatingRow,
  LessonNoteRow,
  LessonRow,
  ProjectRow,
  ProjectSubmissionRow,
  QuizAttemptRow,
  QuizOptionRow,
  QuizQuestionRow,
  QuizRow,
  UserRow,
} from "../types/database";
import {
  generateCoursePlanFromPrompt,
  type CourseGenerationOptions,
} from "./ai";
import { auth } from "./firebase";
import { supabase } from "./supabase";

function makeUuid(seed: string) {
  const clean = (seed || "seed").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = clean || "seed";
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }

  const bytes = Array.from({ length: 16 }, (_, index) => {
    const value = (hash + index * 17 + 0x9e37) >>> 0;
    return value % 256;
  });

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const DEMO_CATEGORIES: Pick<CategoryRow, "id" | "name" | "icon" | "color">[] = [
  {
    id: makeUuid("Machine Learning"),
    name: "Machine Learning",
    icon: "analytics",
    color: "#A78BFA",
  },
  {
    id: makeUuid("Prompt Engineering"),
    name: "Prompt Engineering",
    icon: "chatbubbles",
    color: "#6EE7B7",
  },
  {
    id: makeUuid("Data Science"),
    name: "Data Science",
    icon: "stats-chart",
    color: "#FCD34D",
  },
  {
    id: makeUuid("AI Ethics"),
    name: "AI Ethics",
    icon: "shield-checkmark",
    color: "#F87171",
  },
];

const DEMO_COURSES = [
  {
    id: makeUuid("Neural Networks 101"),
    title: "Neural Networks 101",
    description:
      "A gentle, visual introduction to how neural networks actually learn.",
    category_id: DEMO_CATEGORIES[0].id,
    instructor_id: makeUuid("Maya Chen"),
    duration_minutes: 120,
    difficulty: "beginner",
    is_free: true,
    rating: 4.8,
    thumbnail_url: null,
    prerequisite_course_id: null,
    created_at: new Date().toISOString(),
    category: DEMO_CATEGORIES[0],
    instructor: { id: makeUuid("Maya Chen"), name: "Maya Chen" },
    prerequisite: null,
  },
  {
    id: makeUuid("Mastering Prompt Design"),
    title: "Mastering Prompt Design",
    description:
      "Write prompts that get consistently better output from any LLM.",
    category_id: DEMO_CATEGORIES[1].id,
    instructor_id: makeUuid("Josh Rivera"),
    duration_minutes: 90,
    difficulty: "beginner",
    is_free: true,
    rating: 4.9,
    thumbnail_url: null,
    prerequisite_course_id: null,
    created_at: new Date().toISOString(),
    category: DEMO_CATEGORIES[1],
    instructor: { id: makeUuid("Josh Rivera"), name: "Josh Rivera" },
    prerequisite: null,
  },
  {
    id: makeUuid("Data Analysis with Python"),
    title: "Data Analysis with Python",
    description:
      "Pandas, NumPy, and real datasets — from zero to your first analysis.",
    category_id: DEMO_CATEGORIES[2].id,
    instructor_id: makeUuid("Dr. Amara Okafor"),
    duration_minutes: 180,
    difficulty: "intermediate",
    is_free: true,
    rating: 4.6,
    thumbnail_url: null,
    prerequisite_course_id: makeUuid("Neural Networks 101"),
    created_at: new Date().toISOString(),
    category: DEMO_CATEGORIES[2],
    instructor: { id: makeUuid("Dr. Amara Okafor"), name: "Dr. Amara Okafor" },
    prerequisite: {
      id: makeUuid("Neural Networks 101"),
      title: "Neural Networks 101",
    },
  },
];

async function ensureInstructor(name: string) {
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as { id: string; name: string };

  const newInstructor = {
    id: makeUuid(name),
    name,
    avatar_url: null,
    bio: `${name} is a mentor for this generated learning path.`,
  };

  const { data: created, error: insertError } = await supabase
    .from("instructors")
    .upsert(newInstructor, { onConflict: "id" })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created as { id: string; name: string };
}

function generateCourseThumbnail(title: string, categoryName: string) {
  const colorA = ["#8B5CF6", "#06B6D4", "#F59E0B", "#10B981", "#FB7185"][
    Math.abs(title.length + categoryName.length) % 5
  ];
  const colorB = ["#A78BFA", "#67E8F9", "#FCD34D", "#6EE7B7", "#FDA4AF"][
    Math.abs(title.length) % 5
  ];
  const emojiMap: Record<string, string> = {
    ai: "🤖",
    python: "🐍",
    design: "🎨",
    business: "💼",
    marketing: "📈",
    data: "📊",
    language: "🗣️",
    music: "🎵",
    wellness: "🌿",
    default: "✨",
  };
  const normalized = (categoryName || title || "learning").toLowerCase();
  const emoji =
    Object.keys(emojiMap).find((key) => normalized.includes(key)) ??
    emojiMap.default;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colorA}"/>
          <stop offset="100%" stop-color="${colorB}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="420" rx="36" fill="url(#g)"/>
      <circle cx="695" cy="90" r="88" fill="rgba(255,255,255,0.12)"/>
      <circle cx="120" cy="340" r="120" fill="rgba(255,255,255,0.08)"/>
      <text x="60" y="210" font-size="120" font-family="Arial, sans-serif">${emoji}</text>
      <text x="60" y="310" font-size="30" font-weight="700" font-family="Arial, sans-serif" fill="white" opacity="0.9">${(categoryName || "Custom").slice(0, 20)}</text>
      <text x="60" y="355" font-size="42" font-weight="700" font-family="Arial, sans-serif" fill="white">${(title || "New Course").slice(0, 28)}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function generateCoursesFromInterests(interestCategoryIds: string[]) {
  const categories = await getAllCategories();
  const selected =
    interestCategoryIds.length > 0
      ? interestCategoryIds
          .map((id) => categories.find((category) => category.id === id))
          .filter((category): category is CategoryRow => !!category)
      : categories.slice(0, 3);

  if (!selected.length) return [];

  const instructor = await ensureInstructor("NeuralLearn Mentor");
  const generated: any[] = [];

  for (const [index, category] of selected.entries()) {
    const title = `${category.name} Foundations`;
    const courseId = makeUuid(`${category.name}-${index}`);
    const lessonIds = [
      makeUuid(`${courseId}-lesson-1`),
      makeUuid(`${courseId}-lesson-2`),
      makeUuid(`${courseId}-lesson-3`),
    ];

    const course = {
      id: courseId,
      title,
      description: `A guided ${category.name.toLowerCase()} path designed to help you learn practical skills quickly and build confidence.`,
      category_id: category.id,
      instructor_id: instructor.id,
      duration_minutes: 75 + index * 30,
      difficulty: index === 0 ? "beginner" : "intermediate",
      is_free: true,
      rating: 4.7 + index * 0.1,
      thumbnail_url: null,
      prerequisite_course_id: null,
      created_at: new Date().toISOString(),
    };

    const lessons = [
      {
        id: lessonIds[0],
        course_id: courseId,
        title: "What this topic is and why it matters",
        content: `In this lesson, you will get a clear overview of ${category.name.toLowerCase()} and how it is used in real projects.`,
        order_index: 0,
        duration_minutes: 15,
        xp_reward: 25,
      },
      {
        id: lessonIds[1],
        course_id: courseId,
        title: "Core concepts you should practice",
        content: `This lesson walks through the most important ideas behind ${category.name.toLowerCase()}, including the key vocabulary and the first practical exercises.`,
        order_index: 1,
        duration_minutes: 20,
        xp_reward: 30,
      },
      {
        id: lessonIds[2],
        course_id: courseId,
        title: "Build a small project with confidence",
        content: `Complete a quick mini-project so you can apply ${category.name.toLowerCase()} in a realistic workflow and track your progress.`,
        order_index: 2,
        duration_minutes: 30,
        xp_reward: 40,
      },
    ];

    const quizId = makeUuid(`${courseId}-quiz`);
    const quizQuestionIds = [
      makeUuid(`${courseId}-question-1`),
      makeUuid(`${courseId}-question-2`),
    ];

    const quiz = {
      id: quizId,
      course_id: courseId,
      title: `${title} Quick Quiz`,
      passing_score: 70,
      xp_reward: 60,
    };

    const questions = [
      {
        id: quizQuestionIds[0],
        quiz_id: quizId,
        question: `Which concept is most important when learning ${category.name}?`,
        order_index: 0,
        options: [
          {
            id: makeUuid(`${quizQuestionIds[0]}-a`),
            option_text: "The core idea behind the topic",
            is_correct: true,
            order_index: 0,
          },
          {
            id: makeUuid(`${quizQuestionIds[0]}-b`),
            option_text: "Skipping practice for a week",
            is_correct: false,
            order_index: 1,
          },
          {
            id: makeUuid(`${quizQuestionIds[0]}-c`),
            option_text: "Only reading the title",
            is_correct: false,
            order_index: 2,
          },
        ],
      },
      {
        id: quizQuestionIds[1],
        quiz_id: quizId,
        question: `What should you do after learning the basics of ${category.name}?`,
        order_index: 1,
        options: [
          {
            id: makeUuid(`${quizQuestionIds[1]}-a`),
            option_text: "Apply the idea in a small project",
            is_correct: true,
            order_index: 0,
          },
          {
            id: makeUuid(`${quizQuestionIds[1]}-b`),
            option_text: "Forget the topic immediately",
            is_correct: false,
            order_index: 1,
          },
          {
            id: makeUuid(`${quizQuestionIds[1]}-c`),
            option_text: "Only watch it once and stop",
            is_correct: false,
            order_index: 2,
          },
        ],
      },
    ];

    const projectId = makeUuid(`${courseId}-project`);
    const project = {
      id: projectId,
      course_id: courseId,
      title: `${title} Mini Project`,
      description: `Apply what you've learned in a small, realistic task for ${category.name}.`,
      instructions: `Create a short artifact or written reflection showing what you learned in ${category.name}. Explain your thinking, show your result, and keep it practical.`,
      xp_reward: 80,
    };

    await supabase.from("courses").upsert(course, { onConflict: "id" });
    await supabase.from("lessons").upsert(lessons, { onConflict: "id" });
    await supabase.from("quizzes").upsert(quiz, { onConflict: "id" });
    await supabase.from("quiz_questions").upsert(
      questions.map(({ options, ...q }) => q),
      { onConflict: "id" },
    );
    await supabase.from("quiz_options").upsert(
      questions.flatMap((question) => question.options),
      { onConflict: "id" },
    );
    await supabase.from("projects").upsert(project, { onConflict: "id" });

    generated.push(course);
  }

  return generated;
}

// ── Users ──────────────────────────────────────────────────────
export async function upsertUserProfile(params: {
  firebaseUid: string;
  email: string;
  username: string;
}) {
  const { error } = await supabase.from("users").upsert(
    {
      firebase_uid: params.firebaseUid,
      email: params.email,
      username: params.username,
    },
    { onConflict: "firebase_uid" },
  );
  if (error) throw error;
}

export async function ensureUserProfile(
  firebaseUid: string,
  fallback?: { email?: string; username?: string },
) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as UserRow;

  const currentUser = auth.currentUser;
  const email = fallback?.email ?? currentUser?.email ?? null;
  const username =
    fallback?.username ??
    currentUser?.displayName ??
    email?.split("@")[0] ??
    "Learner";

  if (!email) return null;

  const { data: created, error: createError } = await supabase
    .from("users")
    .upsert(
      {
        firebase_uid: firebaseUid,
        email,
        username,
      },
      { onConflict: "firebase_uid" },
    )
    .select("*")
    .maybeSingle();

  if (createError) throw createError;
  return (created ?? null) as UserRow | null;
}

export async function getUserByFirebaseUid(firebaseUid: string) {
  return ensureUserProfile(firebaseUid, {
    email: auth.currentUser?.email ?? undefined,
    username: auth.currentUser?.displayName ?? undefined,
  });
}

export async function updateUserProfile(
  firebaseUid: string,
  updates: { username?: string; dailyGoalMinutes?: number },
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");

  const patch: Record<string, string | number> = {};
  if (updates.username !== undefined) patch.username = updates.username;
  if (updates.dailyGoalMinutes !== undefined)
    patch.daily_goal_minutes = updates.dailyGoalMinutes;

  const { error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", user.id);
  if (error) throw error;
}

/** Called once we detect (via polling auth.currentUser.email) that a
 *  pending email change actually completed, to keep Supabase in sync. */
export async function updateUserEmail(firebaseUid: string, email: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");
  const { error } = await supabase
    .from("users")
    .update({ email })
    .eq("id", user.id);
  if (error) throw error;
}

export async function completeOnboarding(
  firebaseUid: string,
  data: { dailyGoalMinutes: number; interestCategoryIds: string[] },
) {
  const user = await ensureUserProfile(firebaseUid, {
    email: auth.currentUser?.email ?? undefined,
    username: auth.currentUser?.displayName ?? undefined,
  });
  if (!user) throw new Error("User not found");

  const { error } = await supabase
    .from("users")
    .update({
      daily_goal_minutes: data.dailyGoalMinutes,
      interest_category_ids: data.interestCategoryIds,
      onboarding_completed: true,
    })
    .eq("id", user.id);
  if (error) throw error;

  try {
    await generateCoursesFromInterests(data.interestCategoryIds);
  } catch (generationError) {
    console.warn("AI course generation fallback failed:", generationError);
  }
}

/**
 * Deletes the user's row in Supabase. Every other table (enrollments,
 * progress, notes, bookmarks, ratings, AI history, quiz/project history)
 * references users.id with `on delete cascade`, so this one delete cleans
 * up everything — nothing orphaned to worry about.
 */
export async function deleteUserData(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return;
  const { error } = await supabase.from("users").delete().eq("id", user.id);
  if (error) throw error;
}

function getLocalDateKey(date: Date) {
  const localIso = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  ).toISOString();
  return localIso.slice(0, 10);
}

// ── Home dashboard ────────────────────────────────────────────
export async function getHomeData(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return null;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "*, course:courses(*, category:categories(*), instructor:instructors(*))",
    )
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false });

  const today = getLocalDateKey(new Date());
  const { data: todayActivity } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_date", today)
    .maybeSingle();

  const { data: featuredCourses } = await supabase
    .from("courses")
    .select("*, category:categories(*), instructor:instructors(*)")
    .order("rating", { ascending: false })
    .limit(6);

  return {
    user,
    enrolledCourses: (enrollments ?? []).map((e: any) => ({
      enrollment: e,
      course: e.course,
      category: e.course.category,
      instructor: e.course.instructor,
    })),
    todayActivity,
    featuredCourses,
  };
}

export async function getWeeklyActivity(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", user.id)
    .gte("activity_date", getLocalDateKey(sevenDaysAgo))
    .order("activity_date", { ascending: true });

  // Fill in missing days with zeros so the chart always has 7 bars.
  const days: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateKey(d);
    const found = data?.find((r) => r.activity_date === dateStr);
    days.push(
      found ?? { activity_date: dateStr, minutes_learned: 0, goal_met: false },
    );
  }
  return days.map((d) => ({
    minutesLearned: d.minutes_learned,
    goalMet: d.goal_met,
  }));
}

// ── Explore / courses ─────────────────────────────────────────
export async function getAllCategories() {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  if ((data ?? []).length > 0) return data as CategoryRow[];
  return DEMO_CATEGORIES as CategoryRow[];
}

export async function generateCourseFromUserPrompt(
  firebaseUid: string,
  prompt: string,
  options?: CourseGenerationOptions,
) {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) throw new Error("Please enter a course idea first.");

  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");

  const plan = await generateCoursePlanFromPrompt(trimmedPrompt, options);

  const categoryName = plan.category_name?.trim() || "Custom Learning";
  const categoryKey = categoryName.toLowerCase();
  const { data: existingCategory } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", categoryName)
    .maybeSingle();

  const categoryId =
    existingCategory?.id ?? makeUuid(`category-${categoryKey}`);
  const categoryPayload = {
    id: categoryId,
    name: categoryName,
    icon: "sparkles",
    color: ["#8B5CF6", "#06B6D4", "#F59E0B", "#10B981", "#FB7185"][
      Math.abs(categoryKey.length) % 5
    ],
  };

  if (!existingCategory) {
    await supabase
      .from("categories")
      .upsert(categoryPayload, { onConflict: "id" });
  }

  const instructorName = `${user.username}'s Mentor`;
  const instructor = await ensureInstructor(instructorName);

  const courseId = makeUuid(`course-${trimmedPrompt}-${Date.now()}`);
  const lessonIds = plan.lessons.map((_, index) =>
    makeUuid(`${courseId}-lesson-${index + 1}`),
  );
  const quizId = makeUuid(`${courseId}-quiz`);
  const projectId = makeUuid(`${courseId}-project`);

  const resolvedDuration = Math.max(
    20,
    options?.durationMinutes ??
      plan.lessons.reduce(
        (sum, lesson) => sum + (lesson.duration_minutes || 20),
        0,
      ),
  );

  const courseRecord = {
    id: courseId,
    title: plan.title.trim(),
    description: plan.description.trim(),
    category_id: categoryId,
    instructor_id: instructor.id,
    duration_minutes: resolvedDuration,
    difficulty: options?.level ?? plan.difficulty,
    is_free: true,
    rating: 4.8,
    thumbnail_url: generateCourseThumbnail(plan.title.trim(), categoryName),
    prerequisite_course_id: null,
    created_at: new Date().toISOString(),
  };

  const lessonRecords = plan.lessons.map((lesson, index) => ({
    id: lessonIds[index],
    course_id: courseId,
    title: lesson.title.trim(),
    content: lesson.content.trim(),
    order_index: index,
    duration_minutes: lesson.duration_minutes || 20,
    xp_reward: lesson.xp_reward || 25,
  }));

  const quizRecord = {
    id: quizId,
    course_id: courseId,
    title: plan.quiz_title?.trim() || `${plan.title.trim()} Quiz`,
    passing_score: 70,
    xp_reward: 60,
  };

  const quizQuestionIds = plan.quiz_questions.map((_, index) =>
    makeUuid(`${quizId}-question-${index + 1}`),
  );
  const questionRecords = plan.quiz_questions.map((question, index) => ({
    id: quizQuestionIds[index],
    quiz_id: quizId,
    question: question.question.trim(),
    order_index: index,
  }));

  const questionOptionRecords = plan.quiz_questions.flatMap(
    (question, qIndex) =>
      question.options.map((option, optionIndex) => ({
        id: makeUuid(`${quizQuestionIds[qIndex]}-option-${optionIndex + 1}`),
        question_id: quizQuestionIds[qIndex],
        option_text: option.trim(),
        is_correct: optionIndex === question.correct_index,
        order_index: optionIndex,
      })),
  );

  const projectRecord = {
    id: projectId,
    course_id: courseId,
    title: plan.project_title?.trim() || `${plan.title.trim()} Project`,
    description:
      plan.project_description?.trim() ||
      "Apply what you learned in a practical exercise.",
    instructions:
      plan.project_instructions?.trim() ||
      "Create a short output or reflection showing what you learned.",
    xp_reward: 80,
  };

  await supabase.from("courses").upsert(courseRecord, { onConflict: "id" });
  await supabase.from("lessons").upsert(lessonRecords, { onConflict: "id" });
  await supabase.from("quizzes").upsert(quizRecord, { onConflict: "id" });
  await supabase
    .from("quiz_questions")
    .upsert(questionRecords, { onConflict: "id" });
  await supabase
    .from("quiz_options")
    .upsert(questionOptionRecords, { onConflict: "id" });
  await supabase.from("projects").upsert(projectRecord, { onConflict: "id" });

  await enrollInCourse(firebaseUid, courseId);

  return {
    course: courseRecord,
    lessons: lessonRecords,
    quiz: quizRecord,
    project: projectRecord,
  };
}

export async function getMyGeneratedCourses(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return [];

  const { data, error } = await supabase
    .from("instructors")
    .select("id, name")
    .ilike("name", `${user.username}%`);

  if (error) throw error;

  const instructorIds = (data ?? []).map((i) => i.id);
  if (instructorIds.length === 0) return [];

  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select(
      "*, category:categories(*), instructor:instructors(*), prerequisite:prerequisite_course_id(id, title)",
    )
    .in("instructor_id", instructorIds)
    .order("created_at", { ascending: false });

  if (coursesError) throw coursesError;
  return courses ?? [];
}

export async function getCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select(
      "*, category:categories(*), instructor:instructors(*), prerequisite:prerequisite_course_id(id, title)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  if ((data ?? []).length > 0) return data ?? [];
  return DEMO_COURSES as any[];
}

export async function getCourseWithContent(courseId: string) {
  const { data: course, error } = await supabase
    .from("courses")
    .select(
      "*, category:categories(*), instructor:instructors(*), prerequisite:prerequisite_course_id(id, title)",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  return { course: course ?? null, lessons: (lessons ?? []) as LessonRow[] };
}

export async function enrollInCourse(firebaseUid: string, courseId: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");
  const { error } = await supabase
    .from("enrollments")
    .upsert(
      { user_id: user.id, course_id: courseId, progress_percent: 0 },
      { onConflict: "user_id,course_id" },
    );
  if (error) throw error;
}

// ── Lesson progress + XP ──────────────────────────────────────

/**
 * Adds today's minutes/lessons/xp to daily_activity, bumps total_xp, and —
 * only the first time *today* gets any activity — recomputes the user's
 * streak (continues it if yesterday had activity too, otherwise resets to
 * 1). Shared by lesson completion, quiz passes, and project submissions so
 * streaks/XP behave the same no matter which one the user did today.
 */
async function bumpDailyActivityAndStreak(
  user: UserRow,
  delta: { minutes?: number; lessons?: number; xp: number },
) {
  const today = getLocalDateKey(new Date());
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_date", today)
    .maybeSingle();

  const newMinutes = (existing?.minutes_learned ?? 0) + (delta.minutes ?? 0);
  const newLessons = (existing?.lessons_completed ?? 0) + (delta.lessons ?? 0);
  const newXp = (existing?.xp_earned ?? 0) + delta.xp;

  await supabase.from("daily_activity").upsert(
    {
      user_id: user.id,
      activity_date: today,
      minutes_learned: newMinutes,
      lessons_completed: newLessons,
      xp_earned: newXp,
      goal_met: newMinutes >= user.daily_goal_minutes,
    },
    { onConflict: "user_id,activity_date" },
  );

  await supabase
    .from("users")
    .update({ total_xp: user.total_xp + delta.xp })
    .eq("id", user.id);

  // Only recompute the streak the first time today has any activity —
  // otherwise a second lesson today would double-count the day.
  if (!existing) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterday);

    const { data: yesterdayRow } = await supabase
      .from("daily_activity")
      .select("id")
      .eq("user_id", user.id)
      .eq("activity_date", yesterdayStr)
      .maybeSingle();

    const newStreak = yesterdayRow ? user.current_streak_days + 1 : 1;
    const newLongest = Math.max(user.longest_streak_days, newStreak);

    await supabase
      .from("users")
      .update({
        current_streak_days: newStreak,
        longest_streak_days: newLongest,
      })
      .eq("id", user.id);
  }
}

/**
 * Checks every achievement the user hasn't earned yet against a simple,
 * name-keyed rule, and awards (+ XP for) any that now qualify. Returns the
 * newly earned ones so the calling screen can show a "you earned X" moment.
 */
async function checkAndAwardAchievements(
  user: UserRow,
): Promise<AchievementRow[]> {
  const { data: freshUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!freshUser) return [];

  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*");
  const { data: earned } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);
  const earnedIds = new Set((earned ?? []).map((e) => e.achievement_id));

  const newlyEarned: AchievementRow[] = [];

  for (const a of (allAchievements ?? []) as AchievementRow[]) {
    if (earnedIds.has(a.id)) continue;

    let qualifies = false;
    if (a.name === "First Steps") {
      const { count } = await supabase
        .from("lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      qualifies = (count ?? 0) >= 1;
    } else if (a.name === "On a Roll") {
      qualifies = freshUser.current_streak_days >= 3;
    } else if (a.name === "Course Finisher") {
      const { count } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("progress_percent", 100);
      qualifies = (count ?? 0) >= 1;
    } else if (a.name === "Curious Mind") {
      const { count } = await supabase
        .from("ai_conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user");
      qualifies = (count ?? 0) >= 5;
    } else if (a.name === "Quiz Whiz") {
      const { count } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("passed", true);
      qualifies = (count ?? 0) >= 1;
    } else if (a.name === "Builder") {
      const { count } = await supabase
        .from("project_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      qualifies = (count ?? 0) >= 1;
    }

    if (qualifies) {
      await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_id: a.id });
      if (a.xp_reward > 0) {
        const { data: latest } = await supabase
          .from("users")
          .select("total_xp")
          .eq("id", user.id)
          .single();
        await supabase
          .from("users")
          .update({
            total_xp: (latest?.total_xp ?? freshUser.total_xp) + a.xp_reward,
          })
          .eq("id", user.id);
      }
      newlyEarned.push(a);
    }
  }

  return newlyEarned;
}

export async function completeLesson(firebaseUid: string, lessonId: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();
  if (!lesson) throw new Error("Lesson not found");

  await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  await bumpDailyActivityAndStreak(user, {
    minutes: lesson.duration_minutes,
    lessons: 1,
    xp: lesson.xp_reward,
  });

  // Recompute course progress %
  const { data: courseLessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", lesson.course_id);
  const { data: completed } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("completed", true)
    .in(
      "lesson_id",
      (courseLessons ?? []).map((l) => l.id),
    );

  const pct = courseLessons?.length
    ? Math.round(((completed?.length ?? 0) / courseLessons.length) * 100)
    : 0;

  await supabase
    .from("enrollments")
    .update({ progress_percent: pct })
    .eq("user_id", user.id)
    .eq("course_id", lesson.course_id);

  const newAchievements = await checkAndAwardAchievements(user);
  return { newAchievements };
}

// ── Quizzes ────────────────────────────────────────────────────
export async function getQuizForCourse(courseId: string) {
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();
  return data as QuizRow | null;
}

export async function getQuizWithQuestions(quizId: string) {
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();
  if (error) throw error;

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*, options:quiz_options(*)")
    .eq("quiz_id", quizId)
    .order("order_index", { ascending: true });

  return {
    quiz: quiz as QuizRow,
    questions: (questions ?? []) as (QuizQuestionRow & {
      options: QuizOptionRow[];
    })[],
  };
}

export async function getBestQuizAttempt(firebaseUid: string, quizId: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return null;
  const { data } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .order("score_percent", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as QuizAttemptRow | null;
}

/** answers maps questionId -> the selected option's id. */
export async function submitQuizAttempt(
  firebaseUid: string,
  quizId: string,
  answers: Record<string, string>,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");

  const { quiz, questions } = await getQuizWithQuestions(quizId);
  let correctCount = 0;
  for (const q of questions) {
    const correctOption = q.options.find((o) => o.is_correct);
    if (correctOption && answers[q.id] === correctOption.id) correctCount++;
  }
  const scorePercent = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;
  const passed = scorePercent >= quiz.passing_score;

  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    quiz_id: quizId,
    score_percent: scorePercent,
    passed,
  });

  // Only award XP the first time this quiz is passed, so retries don't farm XP.
  let xpAwarded = 0;
  if (passed) {
    const { count } = await supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("quiz_id", quizId)
      .eq("passed", true);
    if ((count ?? 0) === 1) {
      xpAwarded = quiz.xp_reward;
      await bumpDailyActivityAndStreak(user, { xp: xpAwarded });
    }
  }

  const newAchievements = await checkAndAwardAchievements(user);
  return {
    scorePercent,
    passed,
    correctCount,
    totalQuestions: questions.length,
    xpAwarded,
    newAchievements,
  };
}

// ── Projects ───────────────────────────────────────────────────
export async function getProjectForCourse(courseId: string) {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();
  return data as ProjectRow | null;
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function getProjectSubmission(
  firebaseUid: string,
  projectId: string,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return null;
  const { data } = await supabase
    .from("project_submissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .maybeSingle();
  return data as ProjectSubmissionRow | null;
}

export async function submitProject(
  firebaseUid: string,
  projectId: string,
  submissionText: string,
  submissionUrl?: string,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error || !project) throw new Error("Project not found");

  const alreadySubmitted = await getProjectSubmission(firebaseUid, projectId);

  await supabase.from("project_submissions").upsert(
    {
      user_id: user.id,
      project_id: projectId,
      submission_text: submissionText,
      submission_url: submissionUrl ?? null,
    },
    { onConflict: "user_id,project_id" },
  );

  // Only award XP on the first submission — resubmitting/editing doesn't re-earn it.
  let xpAwarded = 0;
  if (!alreadySubmitted) {
    xpAwarded = project.xp_reward;
    await bumpDailyActivityAndStreak(user, { xp: xpAwarded });
  }

  const newAchievements = await checkAndAwardAchievements(user);
  return { xpAwarded, newAchievements };
}

export async function getUserProjectSubmissions(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return [];
  const { data } = await supabase
    .from("project_submissions")
    .select("*, project:projects(*, course:courses(title))")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });
  return data ?? [];
}

export async function getCompletedLessonIds(
  firebaseUid: string,
  courseId: string,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return new Set<string>();
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id, lessons!inner(course_id)")
    .eq("user_id", user.id)
    .eq("completed", true)
    .eq("lessons.course_id", courseId);
  return new Set((data ?? []).map((r: any) => r.lesson_id));
}

// ── Progress tab ──────────────────────────────────────────────
export async function getUserStats(firebaseUid: string) {
  return getUserByFirebaseUid(firebaseUid);
}

export async function getUserAchievements(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return [];
  const { data } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", user.id);
  return data ?? [];
}

export async function getAllAchievements() {
  const { data, error } = await supabase.from("achievements").select("*");
  if (error) throw error;
  return (data ?? []) as AchievementRow[];
}

export async function getCompletedCourses(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return [];
  const { data } = await supabase
    .from("enrollments")
    .select("*, course:courses(*)")
    .eq("user_id", user.id)
    .eq("progress_percent", 100);
  return data ?? [];
}

/** Course IDs where the user has finished all lessons — used to gate prerequisites. */
export async function getCompletedCourseIds(firebaseUid: string) {
  const completed = await getCompletedCourses(firebaseUid);
  return new Set(completed.map((c: any) => c.course_id));
}

export async function updateReminderPreference(
  firebaseUid: string,
  enabled: boolean,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");
  const { error } = await supabase
    .from("users")
    .update({ reminders_enabled: enabled })
    .eq("id", user.id);
  if (error) throw error;
}

export async function getLearningStats(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user)
    return { quizzesPassed: 0, projectsSubmitted: 0, coursesCompleted: 0 };

  const [
    { count: quizzesPassed },
    { count: projectsSubmitted },
    { count: coursesCompleted },
  ] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("passed", true),
    supabase
      .from("project_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("progress_percent", 100),
  ]);

  return {
    quizzesPassed: quizzesPassed ?? 0,
    projectsSubmitted: projectsSubmitted ?? 0,
    coursesCompleted: coursesCompleted ?? 0,
  };
}

// ── AI chat history ───────────────────────────────────────────
export async function getAiHistory(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return [];
  const { data } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);
  return data ?? [];
}

export async function saveAiMessage(
  firebaseUid: string,
  role: "user" | "model",
  content: string,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return;
  await supabase
    .from("ai_conversations")
    .insert({ user_id: user.id, role, content });
}

// ── Lesson notes ───────────────────────────────────────────────
export async function getLessonNote(firebaseUid: string, lessonId: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return null;
  const { data } = await supabase
    .from("lesson_notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  return data as LessonNoteRow | null;
}

export async function saveLessonNote(
  firebaseUid: string,
  lessonId: string,
  content: string,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");
  const { error } = await supabase.from("lesson_notes").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw error;
}

// ── Bookmarks ──────────────────────────────────────────────────
export async function isBookmarked(firebaseUid: string, courseId: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return false;
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  return !!data;
}

export async function toggleBookmark(firebaseUid: string, courseId: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");
  const existing = await isBookmarked(firebaseUid, courseId);
  if (existing) {
    await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("course_id", courseId);
    return false;
  }
  await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, course_id: courseId });
  return true;
}

export async function getBookmarkedCourses(firebaseUid: string) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return [];
  const { data } = await supabase
    .from("bookmarks")
    .select(
      "*, course:courses(*, category:categories(*), instructor:instructors(*))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ── Course ratings ─────────────────────────────────────────────
export async function getUserCourseRating(
  firebaseUid: string,
  courseId: string,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) return null;
  const { data } = await supabase
    .from("course_ratings")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  return data as CourseRatingRow | null;
}

export async function getCourseRatingSummary(courseId: string) {
  const { data } = await supabase
    .from("course_ratings")
    .select("rating")
    .eq("course_id", courseId);
  if (!data || data.length === 0)
    return { average: null as number | null, count: 0 };
  const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return { average: Math.round(average * 10) / 10, count: data.length };
}

export async function submitCourseRating(
  firebaseUid: string,
  courseId: string,
  rating: number,
  review?: string,
) {
  const user = await getUserByFirebaseUid(firebaseUid);
  if (!user) throw new Error("User not found");
  const { error } = await supabase
    .from("course_ratings")
    .upsert(
      { user_id: user.id, course_id: courseId, rating, review: review ?? null },
      { onConflict: "user_id,course_id" },
    );
  if (error) throw error;
}

// ── Leaderboard ────────────────────────────────────────────────
export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, total_xp, current_streak_days")
    .order("total_xp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
