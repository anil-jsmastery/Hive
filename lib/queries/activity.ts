import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';
import { ACTIVITY_LIMIT } from '@/lib/constants';

export async function latestActivity() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('activities')
    .select('id, type, created_at, actor:profiles!activities_actor_id_fkey(display_name, handle), skill:skills!activities_skill_id_fkey(slug, title)')
    .order('created_at', { ascending: false })
    .limit(ACTIVITY_LIMIT);
  if (error) throw error;
  return data ?? [];
}
