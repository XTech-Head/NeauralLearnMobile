# NeuralLearn

An AI/ML learning app. Firebase Auth + Supabase (Postgres) + Gemini AI tutor — every piece free-tier.

## Stack

- **Auth**: Firebase Auth (email/password + email verification)
- **Database**: Supabase (Postgres, free tier: 500MB, 50k MAU)
- **AI**: Gemini 3.1 Flash Lite — stable (GA), multimodal (text, image, audio,
  documents in one call), free-tier friendly. Deliberately not
  gemini-2.5-flash (scheduled to shut down Oct 16 2026) or gemini-1.5-flash
  (already retired) — re-check ai.google.dev/gemini-api/docs/models before
  shipping, since Google's model lineup moves fast.
- **Framework**: Expo + expo-router

## Design

- **Light mode**: white background, purple accents.
- **Dark mode**: a real gradient — black fading into deep purple
  (`DARK_GRADIENT` in `src/themes.ts`), not a flat color. Rendered by the
  shared `<ScreenBackground>` component every screen uses.
- **Sizing**: `src/utils/scale.ts` scales fonts/spacing relative to a
  375×812 baseline so the UI doesn't feel oversized on compact phones or
  cramped on larger ones. `ScreenBackground` also respects each device's
  safe-area insets.

## Learning features

- **Lessons** — per-course, sequential, award XP on completion.
- **Notes** — a personal notes field on every lesson (`lesson_notes`),
  auto-saved on blur or when you complete the lesson.
- **Bookmarks** — save any course for later from its detail page; shows up
  under "Saved for later" on the Learn tab.
- **Quizzes** — one per course, taken after the lessons (`app/quiz/[quizId].tsx`).
  Multiple choice, step-through UI, pass/fail against a configurable
  threshold, XP awarded once on first pass (retries don't re-earn it).
- **Projects** — one per course, hands-on and self-submitted
  (`app/project/[projectId].tsx`). No grading pipeline — submitting your
  writeup/link marks it done and awards XP once. Submissions show up under
  "My Projects" on the Learn tab.
- **Ratings** — once a course is fully complete (all lessons + quiz passed),
  you can rate it 1–5 stars from the course page; the average shown there
  is computed live from real submitted ratings, not a static seed number.
- **Certificates** — a shareable certificate screen
  (`app/certificate/[courseId].tsx`) unlocks the same time ratings do.
- **Leaderboard** — top learners by total XP (`app/leaderboard.tsx`),
  linked from the Progress tab.
- **Streaks & achievements** — `src/lib/db.ts`'s `bumpDailyActivityAndStreak`
  recomputes the user's day streak the first time each day gets any
  activity (lesson, quiz pass, or project submission), and
  `checkAndAwardAchievements` checks a small set of name-keyed rules after
  each of those actions and awards + unlocks any newly-earned achievement
  (shown via a simple alert from `src/lib/notify.ts`).

## AI tutor

The AI tab (`app/(tabs)/ai.tsx`) supports three input modes into one
conversation:
- **Text** — plain chat.
- **Voice** — tap the mic to record, tap again to stop; the recording is
  sent to Gemini directly as audio (no separate speech-to-text step —
  Gemini 3.1 Flash Lite understands audio natively).
- **Upload** — the `+` button attaches a photo or a document (PDF/text),
  sent inline alongside your message.

See `src/lib/gemini.ts` for the model call, `src/hooks/useVoiceRecorder.ts`
for recording, and `src/lib/attachments.ts` for image/document picking.

## Setup

1. **Firebase** — console.firebase.google.com → new project → Authentication →
   enable Email/Password → Project settings → add a Web app → copy the config.
2. **Supabase** — supabase.com → new project (free tier) → SQL Editor → run
   `supabase/schema.sql`, then `supabase/seed.sql` for demo content →
   Settings → API → copy URL + anon key.
3. **Gemini** — aistudio.google.com/app/apikey → create a free API key.
4. Copy `.env.example` to `.env` and fill in all the values above.
5. `npm install`
6. `npx expo start`

## Project structure

```
src/lib/firebase.ts        Firebase Auth client
src/lib/supabase.ts        Supabase client
src/lib/gemini.ts          Gemini chat wrapper (text/image/audio/document)
src/lib/attachments.ts     Image/document picker → base64 for Gemini
src/lib/db.ts              All Supabase queries: users, courses, lessons,
                            quizzes, projects, streaks, achievements, AI history
src/lib/notify.ts          Achievement-unlock alert helper
src/hooks/useVoiceRecorder.ts  Voice recording (expo-audio) → base64 for Gemini
src/hooks/useTheme.ts      Resolves light/dark theme + gradient from system setting
src/context/AuthContext.tsx    Auth state + actions, exposed via useAuth()
src/components/ScreenBackground.tsx  Gradient backdrop + safe-area wrapper, used by every screen
src/types/database.ts      Types mirroring the Supabase schema
src/utils/scale.ts         Responsive sizing helpers
src/themes.ts              Light/dark palettes, gradients, type & spacing scale
supabase/schema.sql        Full Postgres schema + RLS policies
supabase/seed.sql          Demo courses/lessons/quiz/project/achievements

app/(auth)/                Sign in, sign up, email verification
app/(tabs)/                Home, Learn, Explore, AI tutor, Progress, Profile
app/course/[courseId].tsx  Course detail: lessons, quiz, project, bookmark, rating
app/lesson/[lessonId].tsx  Lesson content + notes + mark-complete
app/quiz/[quizId].tsx      Step-through quiz + results
app/project/[projectId].tsx  Project instructions + submission form
app/certificate/[courseId].tsx  Certificate of completion + share
app/leaderboard.tsx        Top learners by XP
```

## Note on security

RLS policies in `schema.sql` are permissive by default because auth lives in
Firebase, not Supabase, so there's no `auth.uid()` to key policies off out of
the box. Fine for prototyping; before real users, wire up Supabase's
Firebase third-party auth integration so RLS can verify Firebase ID tokens.
