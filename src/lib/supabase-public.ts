import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Read-only client. Row Level Security limits it to active products and approved reviews. */
export function getPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
