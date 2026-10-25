import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';

export type SkillCardData = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  stack: string;
  stars_count: number;
  visibility: 'public' | 'private';
  author: { handle: string } | null;
  org: { slug: string; name: string } | null;
};

export const CARD_FIELDS =
  'slug, title, description, tags, stack, stars_count, visibility, author:profiles!skills_author_id_fkey(handle), org:organizations!skills_org_id_fkey(slug, name)';

export async function searchSkills(q: string, stack: string | null): Promise<SkillCardData[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .rpc('search_skills', { q, ...(stack ? { stack_filter: stack } : {}) })
    .select(CARD_FIELDS);
  if (error) throw error;
  return (data ?? []) as unknown as SkillCardData[];
}
