import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';
import { CARD_FIELDS, type SkillCardData } from '@/lib/queries/search';

export async function getProfileByHandle(handle: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, stack')
    .eq('handle', handle)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getFollowCounts(profileId: string) {
  const supabase = await createServerSupabase();
  const [followers, following] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function isFollowing(profileId: string, userId: string | null) {
  if (!userId) return false;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', userId)
    .eq('following_id', profileId)
    .maybeSingle();
  return Boolean(data);
}

// RLS hides private skills from everyone who isn't allowed to see them.
export async function getProfileSkills(profileId: string): Promise<SkillCardData[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('skills')
    .select(CARD_FIELDS)
    .eq('author_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SkillCardData[];
}
