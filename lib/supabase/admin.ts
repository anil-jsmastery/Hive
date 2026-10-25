import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Bypasses RLS. Only app/api/webhooks/clerk/route.ts may use this.
export function createAdminSupabase() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}
