// src/lib/supabase.ts — Supabase Postgres client (free tier: 500MB DB, 50k MAU)
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// We authenticate with Firebase, not Supabase Auth — so we disable Supabase's
// own session handling and rely on Row Level Security policies keyed off
// the firebase_uid column instead (passed explicitly in every query).
//
// Note: we intentionally don't pass a generic `Database` type here.
// supabase-js's generated-types generic is strict about matching Supabase's
// exact `{ Row, Insert, Update, Relationships }` shape per table; a
// hand-written approximation (see src/types/database.ts) trips it into
// inferring `never` for inserts/updates throughout db.ts. Run
// `npx supabase gen types typescript` against your real project once it's
// linked, and you can wire the generated type back in here for full
// inference — src/types/database.ts's hand-written Row types are still
// used directly (and correctly) as return-value casts in db.ts.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
