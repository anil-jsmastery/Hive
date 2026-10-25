import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';

// RLS limits both queries to the current user's notifications.
export async function listNotifications() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, read_at, created_at, actor:profiles!notifications_actor_id_fkey(handle), skill:skills!notifications_skill_id_fkey(slug, title)')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function unreadCount() {
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .is('read_at', null);
  return count ?? 0;
}

export type NotificationRow = Awaited<ReturnType<typeof listNotifications>>[number];
