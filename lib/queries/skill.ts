import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';

const SKILL_FIELDS = `id, slug, title, description, content, tags, stack, visibility, stars_count, author_id, org_id, created_at,
  author:profiles!skills_author_id_fkey(handle, display_name),
  org:organizations!skills_org_id_fkey(slug, name),
  forked_from:forked_from_id(slug, title, author:profiles!skills_author_id_fkey(handle))`;

// RLS decides visibility: a private skill the viewer can't see comes back as null.
export async function getSkill(slug: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from('skills').select(SKILL_FIELDS).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function hasStarred(skillId: string, userId: string | null) {
  if (!userId) return false;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('stars')
    .select('skill_id')
    .eq('skill_id', skillId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getComments(skillId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, author:profiles!comments_author_id_fkey(handle)')
    .eq('skill_id', skillId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
