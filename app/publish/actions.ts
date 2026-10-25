'use server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { ensureOrganization } from '@/lib/organization';
import { trackServer } from '@/lib/analytics/server';
import type { Variant } from '@/lib/analytics/events';
import { FEATURES } from '@/lib/constants';
import { publishSchema } from '@/lib/validation';
import { slugify, uniqueSlug } from '@/lib/slug';

export type PublishField = 'title' | 'description' | 'stack' | 'tags' | 'content';
export type PublishState = {
  errors?: Partial<Record<PublishField, string>>;
  formError?: string;
  values?: Record<string, string>;
  paywall?: (typeof FEATURES)[keyof typeof FEATURES];
};

const FIELDS = ['title', 'description', 'stack', 'tags', 'content', 'visibility', 'owner'] as const;

export async function publishSkill(variant: Variant, _prev: PublishState, formData: FormData): Promise<PublishState> {
  const { orgId, has } = await auth();
  const profile = await getCurrentProfile();
  if (!profile) redirect('/sign-in?redirect_url=/publish');

  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? '')]));
  const parsed = publishSchema.safeParse(values);
  if (!parsed.success) {
    const errors: NonNullable<PublishState['errors']> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as PublishField;
      if (!errors[field]) errors[field] = issue.message;
    }
    return { errors, formError: 'Fix the highlighted fields to publish.', values };
  }
  const { title, description, stack, tags, content, visibility } = parsed.data;
  const asTeam = values.owner === 'team' && Boolean(orgId);

  // Billing decides who may create a private skill. RLS decides who may see it.
  if (visibility === 'private') {
    const feature = asTeam ? FEATURES.team : FEATURES.personal;
    if (!has({ feature })) return { paywall: feature, values };
  }

  const org = asTeam ? await ensureOrganization() : null;
  if (asTeam && !org) return { formError: 'Could not publish for this team. Try again.', values };

  const supabase = await createServerSupabase();
  const slug = await uniqueSlug(
    slugify(title),
    'skill',
    async (candidate) => (await supabase.rpc('slug_taken', { candidate })).data === true,
  );
  const { error } = await supabase.from('skills').insert({
    slug, title, description, stack, tags, content, visibility,
    author_id: profile.id,
    org_id: org?.id ?? null,
  });
  if (error) return { formError: 'Could not publish your skill. Try again.', values };

  await trackServer(
    profile.id,
    'skill_published',
    {
      slug, stack, tag_count: tags.length, content_length: content.length, visibility,
      owner: asTeam ? 'team' : 'personal', variant,
    },
    org?.id ?? null,
  );
  redirect(`/s/${slug}?published=1`);
}
