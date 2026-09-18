-- supabase/migrations/003_onboarding.sql
-- Run this if you already executed schema.sql before this update.
-- (New setups get these columns automatically from schema.sql directly.)

alter table users
  add column if not exists onboarding_completed boolean not null default false;

alter table users
  add column if not exists interest_category_ids uuid[] not null default '{}';