'use server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { trackServer } from '@/lib/analytics/server';
import { INSTALL_COMMAND } from '@/lib/constants';
import { slugify, uniqueSlug } from '@/lib/slug';

type NeedsAuth = { needsAuth: true };
type Failed = { error: string };

async function visibleSkill(slug: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('skills')
    .select('id, slug, title, description, content, tags, stack, visibility')
    .eq('slug', slug)
    .maybeSingle();
  return { supabase, skill: data };
}

export async function installSkill(slug: string): Promise<NeedsAuth | Failed | { command: string }> {
  const { orgId } = await auth();
  const profile = await getCurrentProfile();
  if (!profile) return { needsAuth: true };
  const { skill } = await visibleSkill(slug);
  if (!skill) return { error: 'Skill not found.' };
  await trackServer(profile.id, 'skill_installed', { slug, stack: skill.stack }, orgId);
  return { command: INSTALL_COMMAND(slug) };
}

export async function toggleStar(slug: string): Promise<NeedsAuth | Failed | { starred: boolean; starsCount: number }> {
  const { orgId } = await auth();
  const profile = await getCurrentProfile();
  if (!profile) return { needsAuth: true };
  const { supabase, skill } = await visibleSkill(slug);
  if (!skill) return { error: 'Skill not found.' };

  let starred = true;
  const inserted = await supabase.from('stars').insert({ user_id: profile.id, skill_id: skill.id });
  if (inserted.error) {
    if (inserted.error.code !== '23505') return { error: 'Could not update the star.' };
    await supabase.from('stars').delete().eq('user_id', profile.id).eq('skill_id', skill.id);
    starred = false;
  }
  const { data: fresh } = await supabase.from('skills').select('stars_count').eq('id', skill.id).single();
  if (starred) await trackServer(profile.id, 'skill_starred', { slug }, orgId);
  revalidatePath(`/s/${slug}`);
  return { starred, starsCount: fresh?.stars_count ?? 0 };
}
