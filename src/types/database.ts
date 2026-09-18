// src/types/database.ts — hand-written types mirroring supabase/schema.sql
// (Swap for `supabase gen types typescript` output once the project is linked.)

export interface UserRow {
  id: string;
  firebase_uid: string;
  email: string;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  current_streak_days: number;
  longest_streak_days: number;
  daily_goal_minutes: number;
  reminders_enabled: boolean;
  onboarding_completed: boolean;
  interest_category_ids: string[];
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface InstructorRow {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface CourseRow {
  id: string;
  title: string;
  description: string;
  category_id: string;
  instructor_id: string;
  duration_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  is_free: boolean;
  rating: number;
  thumbnail_url: string | null;
  prerequisite_course_id: string | null;
  created_at: string;
}

export interface LessonRow {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  xp_reward: number;
}

export interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  enrolled_at: string;
}

export interface LessonProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface DailyActivityRow {
  id: string;
  user_id: string;
  activity_date: string;
  minutes_learned: number;
  lessons_completed: number;
  xp_earned: number;
  goal_met: boolean;
}

export interface AchievementRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface AiConversationRow {
  id: string;
  user_id: string;
  role: "user" | "model";
  content: string;
  created_at: string;
}

export interface QuizRow {
  id: string;
  course_id: string;
  title: string;
  passing_score: number;
  xp_reward: number;
}

export interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
}

export interface QuizOptionRow {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizAttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  score_percent: number;
  passed: boolean;
  completed_at: string;
}

export interface ProjectRow {
  id: string;
  course_id: string;
  title: string;
  description: string;
  instructions: string;
  xp_reward: number;
}

export interface ProjectSubmissionRow {
  id: string;
  user_id: string;
  project_id: string;
  submission_text: string;
  submission_url: string | null;
  submitted_at: string;
}

export interface LessonNoteRow {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  updated_at: string;
}

export interface BookmarkRow {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
}

export interface CourseRatingRow {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  review: string | null;
  created_at: string;
}

// Minimal Database shape for the supabase-js generic — extend as needed.
export interface Database {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: Partial<UserRow>; Update: Partial<UserRow> };
      categories: { Row: CategoryRow; Insert: Partial<CategoryRow>; Update: Partial<CategoryRow> };
      instructors: { Row: InstructorRow; Insert: Partial<InstructorRow>; Update: Partial<InstructorRow> };
      courses: { Row: CourseRow; Insert: Partial<CourseRow>; Update: Partial<CourseRow> };
      lessons: { Row: LessonRow; Insert: Partial<LessonRow>; Update: Partial<LessonRow> };
      enrollments: { Row: EnrollmentRow; Insert: Partial<EnrollmentRow>; Update: Partial<EnrollmentRow> };
      lesson_progress: { Row: LessonProgressRow; Insert: Partial<LessonProgressRow>; Update: Partial<LessonProgressRow> };
      daily_activity: { Row: DailyActivityRow; Insert: Partial<DailyActivityRow>; Update: Partial<DailyActivityRow> };
      achievements: { Row: AchievementRow; Insert: Partial<AchievementRow>; Update: Partial<AchievementRow> };
      user_achievements: { Row: UserAchievementRow; Insert: Partial<UserAchievementRow>; Update: Partial<UserAchievementRow> };
      ai_conversations: { Row: AiConversationRow; Insert: Partial<AiConversationRow>; Update: Partial<AiConversationRow> };
      quizzes: { Row: QuizRow; Insert: Partial<QuizRow>; Update: Partial<QuizRow> };
      quiz_questions: { Row: QuizQuestionRow; Insert: Partial<QuizQuestionRow>; Update: Partial<QuizQuestionRow> };
      quiz_options: { Row: QuizOptionRow; Insert: Partial<QuizOptionRow>; Update: Partial<QuizOptionRow> };
      quiz_attempts: { Row: QuizAttemptRow; Insert: Partial<QuizAttemptRow>; Update: Partial<QuizAttemptRow> };
      projects: { Row: ProjectRow; Insert: Partial<ProjectRow>; Update: Partial<ProjectRow> };
      project_submissions: { Row: ProjectSubmissionRow; Insert: Partial<ProjectSubmissionRow>; Update: Partial<ProjectSubmissionRow> };
      lesson_notes: { Row: LessonNoteRow; Insert: Partial<LessonNoteRow>; Update: Partial<LessonNoteRow> };
      bookmarks: { Row: BookmarkRow; Insert: Partial<BookmarkRow>; Update: Partial<BookmarkRow> };
      course_ratings: { Row: CourseRatingRow; Insert: Partial<CourseRatingRow>; Update: Partial<CourseRatingRow> };
    };
  };
}