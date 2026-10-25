'use server';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { trackServer } from '@/lib/analytics/server';

export async function openNotification(id: string) {
  const me = await getCurrentProfile();
  if (!me) redirect('/sign-in?redirect_url=/dashboard');
  const supabase = await createServerSupabase();
  const { data: n } = await supabase
    .from('notifications')
    .select('id, type, read_at, actor:profiles!notifications_actor_id_fkey(handle), skill:skills!notifications_skill_id_fkey(slug)')
    .eq('id', id)
    .maybeSingle();
  if (!n) redirect('/dashboard');

  if (!n.read_at) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  await trackServer(me.id, 'notification_clicked', { type: n.type as 'fork' | 'comment' | 'follow' });

  if (n.type === 'follow' || !n.skill) redirect(`/u/${n.actor?.handle ?? ''}`);
  redirect(`/s/${n.skill.slug}`);
}
