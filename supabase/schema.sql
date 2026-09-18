-- supabase/schema.sql
-- Run this in Supabase → SQL Editor (free tier, one project, 500MB).
-- Everything is keyed off firebase_uid text, since auth lives in Firebase,
-- not Supabase Auth. See note on RLS at the bottom.

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- Users (mirrors Firebase Auth users; created on sign-up)
-- ─────────────────────────────────────────────────────────────
create table users (
  id uuid primary key default uuid_generate_v4(),
  firebase_uid text unique not null,
  email text unique not null,
  username text not null,
  avatar_url text,
  total_xp integer not null default 0,
  current_streak_days integer not null default 0,
  longest_streak_days integer not null default 0,
  daily_goal_minutes integer not null default 20,
  reminders_enabled boolean not null default false,
  onboarding_completed boolean not null default false,
  interest_category_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Content: categories, instructors, courses, lessons
-- ─────────────────────────────────────────────────────────────
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text not null,        -- Ionicons name
  color text not null        -- hex accent color
);

create table instructors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  avatar_url text,
  bio text
);

create table courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category_id uuid references categories(id) on delete set null,
  instructor_id uuid references instructors(id) on delete set null,
  duration_minutes integer not null default 0,
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  is_free boolean not null default true,
  rating numeric(2,1) not null default 4.5,
  thumbnail_url text,
  -- Optional: another course that must be completed (100% lessons + quiz
  -- passed, if it has one) before this one can be started. Null = no gate.
  prerequisite_course_id uuid references courses(id) on delete set null,
  created_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  content text not null,
  order_index integer not null default 0,
  duration_minutes integer not null default 5,
  xp_reward integer not null default 10
);

-- ─────────────────────────────────────────────────────────────
-- Progress tracking
-- ─────────────────────────────────────────────────────────────
create table enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  progress_percent integer not null default 0,
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

create table daily_activity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  activity_date date not null default current_date,
  minutes_learned integer not null default 0,
  lessons_completed integer not null default 0,
  xp_earned integer not null default 0,
  goal_met boolean not null default false,
  unique (user_id, activity_date)
);

-- ─────────────────────────────────────────────────────────────
-- Achievements
-- ─────────────────────────────────────────────────────────────
create table achievements (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  icon text not null,
  xp_reward integer not null default 0
);

create table user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  achievement_id uuid references achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- ─────────────────────────────────────────────────────────────
-- AI chat history (Gemini conversations, per user)
-- ─────────────────────────────────────────────────────────────
create table ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Quizzes (one per course, taken after finishing the lessons)
-- ─────────────────────────────────────────────────────────────
create table quizzes (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  passing_score integer not null default 70, -- percent
  xp_reward integer not null default 30
);

create table quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question text not null,
  order_index integer not null default 0
);

create table quiz_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0
);

create table quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  score_percent integer not null,
  passed boolean not null,
  completed_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Projects (hands-on, self-submitted — no grading pipeline, so
-- submitting marks it complete; this is a portfolio/practice feature)
-- ─────────────────────────────────────────────────────────────
create table projects (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  description text not null,
  instructions text not null,
  xp_reward integer not null default 50
);

create table project_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  submission_text text not null,
  submission_url text,
  submitted_at timestamptz not null default now(),
  unique (user_id, project_id)
);

-- ─────────────────────────────────────────────────────────────
-- Notes, bookmarks, ratings
-- ─────────────────────────────────────────────────────────────
create table lesson_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table course_ratings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
-- IMPORTANT: because auth is Firebase (not Supabase Auth), there's no
-- auth.uid() to key policies off natively. Two honest options:
--   1. (What's below, for getting started free & fast) Keep RLS permissive
--      on the anon key and enforce "which user" filtering in app code only.
--      This is NOT secure against a malicious client — fine for a personal
--      project / prototype, not for storing real user data at scale.
--   2. (Do this before shipping to real users) Configure Supabase's
--      "Third-Party Auth" integration for Firebase so Supabase can verify
--      Firebase ID tokens and populate auth.jwt() for real RLS policies.
--      Docs: supabase.com/docs/guides/auth/third-party/firebase-auth
alter table users enable row level security;
alter table categories enable row level security;
alter table instructors enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table daily_activity enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table ai_conversations enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_attempts enable row level security;
alter table projects enable row level security;
alter table project_submissions enable row level security;
alter table lesson_notes enable row level security;
alter table bookmarks enable row level security;
alter table course_ratings enable row level security;

create policy "anon full access (prototype only)" on users for all using (true) with check (true);
create policy "anon full access (prototype only)" on categories for all using (true) with check (true);
create policy "anon full access (prototype only)" on instructors for all using (true) with check (true);
create policy "anon full access (prototype only)" on courses for all using (true) with check (true);
create policy "anon full access (prototype only)" on lessons for all using (true) with check (true);
create policy "anon full access (prototype only)" on enrollments for all using (true) with check (true);
create policy "anon full access (prototype only)" on lesson_progress for all using (true) with check (true);
create policy "anon full access (prototype only)" on daily_activity for all using (true) with check (true);
create policy "anon full access (prototype only)" on achievements for all using (true) with check (true);
create policy "anon full access (prototype only)" on user_achievements for all using (true) with check (true);
create policy "anon full access (prototype only)" on ai_conversations for all using (true) with check (true);
create policy "anon full access (prototype only)" on quizzes for all using (true) with check (true);
create policy "anon full access (prototype only)" on quiz_questions for all using (true) with check (true);
create policy "anon full access (prototype only)" on quiz_options for all using (true) with check (true);
create policy "anon full access (prototype only)" on quiz_attempts for all using (true) with check (true);
create policy "anon full access (prototype only)" on projects for all using (true) with check (true);
create policy "anon full access (prototype only)" on project_submissions for all using (true) with check (true);
create policy "anon full access (prototype only)" on lesson_notes for all using (true) with check (true);
create policy "anon full access (prototype only)" on bookmarks for all using (true) with check (true);
create policy "anon full access (prototype only)" on course_ratings for all using (true) with check (true);