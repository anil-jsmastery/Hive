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

export async function forkSkill(slug: string): Promise<NeedsAuth | Failed | { slug: string }> {
  const { orgId } = await auth();
  const profile = await getCurrentProfile();
  if (!profile) return { needsAuth: true };
  const { supabase, skill } = await visibleSkill(slug);
  if (!skill) return { error: 'Skill not found.' };
  if (skill.visibility === 'private') return { error: 'Private skills can’t be forked.' };

  const forkSlug = await uniqueSlug(
    slugify(`${skill.slug}-${profile.handle}`, 70),
    'fork',
    async (candidate) => (await supabase.rpc('slug_taken', { candidate })).data === true,
  );
  const { error } = await supabase.from('skills').insert({
    slug: forkSlug,
    title: skill.title,
    description: skill.description,
    content: skill.content,
    tags: skill.tags,
    stack: skill.stack,
    visibility: 'public',
    author_id: profile.id,
    forked_from_id: skill.id,
  });
  if (error) return { error: 'Could not fork this skill.' };
  await trackServer(profile.id, 'skill_forked', { slug, fork_slug: forkSlug }, orgId);
  return { slug: forkSlug };
}

export async function postComment(slug: string, body: string): Promise<NeedsAuth | Failed | { ok: true }> {
  const { orgId } = await auth();
  const profile = await getCurrentProfile();
  if (!profile) return { needsAuth: true };
  const text = body.trim();
  if (!text) return { error: 'Write a comment first.' };
  if (text.length > 500) return { error: 'Comments can be at most 500 characters.' };
  const { supabase, skill } = await visibleSkill(slug);
  if (!skill) return { error: 'Skill not found.' };
  const { error } = await supabase.from('comments').insert({ skill_id: skill.id, author_id: profile.id, body: text });
  if (error) return { error: 'Could not post your comment.' };
  await trackServer(profile.id, 'comment_posted', { slug, length: text.length }, orgId);
  revalidatePath(`/s/${slug}`);
  return { ok: true };
}
