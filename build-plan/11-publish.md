# Step 11: Publish (with visibility and the paywall)

| | |
| --- | --- |
| Starts from | `step-10` |
| Ends at | `step-11` |
| What you'll learn | Activation, and where builders give up |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 10 is committed and tagged `step-10`. If this step goes wrong, go back with `git reset --hard step-10` and run it again in a new conversation.

**Goal:** the editor, preview, validation and publishing. The action already handles team ownership and private skills; the form only shows those choices from Steps 14 and 16.

## Files

`app/publish/page.tsx`, `app/publish/actions.ts`, `components/publish/publish-form.tsx`, `components/publish/publish-started.tsx`, `lib/validation.ts`, `lib/organization.ts`.

`lib/validation.ts`, **VERBATIM**:

```ts
import { z } from 'zod';
import { STACKS } from './constants';

export const publishSchema = z.object({
  title: z.string().trim()
    .min(3, 'Title needs at least 3 characters.')
    .max(60, 'Title can be at most 60 characters.'),
  description: z.string().trim()
    .min(10, 'Description needs at least 10 characters.')
    .max(160, 'Description can be at most 160 characters.'),
  stack: z.enum(STACKS, { message: 'Choose a stack.' }),
  tags: z.string()
    .transform((v) => [...new Set(v.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))])
    .pipe(z.array(z.string().regex(/^[a-z0-9-]{1,20}$/, 'Tags use lowercase letters, numbers and dashes, up to 20 characters each.'))
      .min(1, 'Add at least one tag.')
      .max(5, 'Use at most 5 tags.')),
  content: z.string().trim()
    .min(80, 'Skill content needs at least 80 characters.')
    .max(20000, 'Skill content can be at most 20,000 characters.'),
  visibility: z.enum(['public', 'private']).catch('public'),
});
```

`lib/organization.ts`, **VERBATIM** (used from Step 14):

```ts
import 'server-only';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { identifyOrganization } from '@/lib/analytics/server';

// Makes sure the active Clerk organization has a row in Supabase.
// Returns it, or null when no team is active.
export async function ensureOrganization() {
  const { orgId } = await auth();
  if (!orgId) return null;
  const supabase = await createServerSupabase();
  const { data: existing } = await supabase.from('organizations').select('id, slug, name').eq('id', orgId).maybeSingle();
  if (existing) return existing;

  const org = await (await clerkClient()).organizations.getOrganization({ organizationId: orgId });
  const row = { id: org.id, slug: org.slug ?? org.id, name: org.name, image_url: org.imageUrl };
  const { data, error } = await supabase.from('organizations').upsert(row).select('id, slug, name').single();
  if (error) return null;
  await identifyOrganization(org.id, { name: org.name, slug: row.slug });
  return data;
}
```

`app/publish/actions.ts`, **VERBATIM**:

```ts
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
```

**`/publish` page:** signed out → `redirect('/sign-in?redirect_url=/publish')`. In this step, `const variant: Variant = 'control'` (Step 18 replaces this with a feature flag). Render `<PublishStarted variant={variant} />` (sends `publish_started` once on mount, built on `TrackOnMount`) and `<PublishForm variant={variant} />`.

**`PublishForm`** (client), using `useActionState(publishSkill.bind(null, variant), {})`. Top to bottom:

1. H1 "Publish a skill".
2. `formError` as `<Alert variant="destructive">`.
3. "Title" input. Under it, live muted text: "Your skill will live at /s/{slugify(title) or "your-skill"}".
4. "Description" input, help text "One sentence on what the skill does."
5. "Stack" select with the `STACKS` options, placeholder "Choose a stack".
6. "Tags" input, help text "Comma-separated, up to 5. Example: auth, nextjs".
7. "Skill content" with tabs "Write" and "Preview". Write: a `font-mono` textarea, minimum height 320px, placeholder `# Skill name` then a new line and `When should an agent use this skill?`. Preview: `markdown.tsx`.
8. Primary button "Publish skill" (pending: "Publishing…").

Each field error shows directly under its field. The form keeps its values after a failed submit (from `state.values`). In this step the form ignores `state.paywall`; Step 16 handles it.

**Submit through `onSubmit`, not the form's `action` prop.** React 19 resets a form after its `action` runs. Text inputs come back from `state.values`, but shadcn `Select` and `RadioGroup` fields fall back to their defaults, so Stack (and later Publish as and Visibility) would empty out after every failed submit or paywall. Instead: `<form onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => formAction(data)); }}>`, where `formAction` comes from `useActionState` and `startTransition` from `useTransition`. Every field added to this form in later steps follows the same pattern.

## Checks

- Pick a Stack, leave Title empty and submit: the Title error shows and the Stack select still shows your choice.
- Opening `/publish` sends one `publish_started` with `variant: control`.
- Submitting an empty form shows 5 field errors and the top alert, and sends no `skill_published`.
- A valid submit creates the skill, sends `skill_published` with `visibility: public` and `owner: personal`, and lands on the skill page with the "Published" toast.
- A title "Code Review!!" becomes slug `code-review`; a second one becomes `code-review-2`.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 11
- /publish: PublishForm (useActionState) with title, description, stack, tags, Write/Preview content. publish_started on mount.
- PublishForm submits through onSubmit + startTransition(formAction), never the form's action prop, so React 19 doesn't reset its Select and RadioGroup fields.
- app/publish/actions.ts publishSkill(variant, ...): validates with lib/validation.ts, checks plan features for private skills (returns paywall), publishes as team via ensureOrganization() when owner=team, sends skill_published.
- lib/organization.ts ensureOrganization() upserts the active Clerk organization into Supabase and identifies the PostHog group.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 11: publish` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-11`.

**Next:** `12-profiles-follow.md`