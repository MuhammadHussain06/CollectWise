import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only: the service role key bypasses row level security, so it must never reach the browser.
export const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
