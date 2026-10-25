# Step 09: Skill page: view, install, star, share

| | |
| --- | --- |
| Starts from | `step-08` |
| Ends at | `step-09` |
| What you'll learn | The value moment: tracking installs on the server |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 08 is committed and tagged `step-08`. If this step goes wrong, go back with `git reset --hard step-08` and run it again in a new conversation.

**Goal:** the skill page and its main actions: install, star and share.

## Files

`app/s/[slug]/page.tsx`, `app/s/[slug]/actions.ts`, `components/skill/skill-actions.tsx`, `components/skill/markdown.tsx`, `components/skill/share-tracker.tsx`, `lib/queries/skill.ts`.

`lib/queries/skill.ts`, **VERBATIM**:

```ts
import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';

const SKILL_FIELDS = `id, slug, title, description, content, tags, stack, visibility, stars_count, author_id, org_id, created_at,
  author:profiles!skills_author_id_fkey(handle, display_name),
  org:organizations!skills_org_id_fkey(slug, name),
  forked_from:forked_from_id(slug, title, author:profiles!skills_author_id_fkey(handle))`;

// RLS decides visibility: a private skill the viewer can't see comes back as null.
// forked_from embeds by column name: skills references itself, and a constraint-name
// hint can't tell "the skill this was forked from" from "the skills that fork this".
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
```

`app/s/[slug]/actions.ts`, **VERBATIM** (Step 10 appends two more actions to this file):

```ts
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
```

(`slugify` and `uniqueSlug` are imported now because Step 10's fork action uses them.)

**Page:** `notFound()` when `getSkill` returns null. Top to bottom:

1. **Header block:** H1 title; description (`text-lg text-muted-foreground`); a meta row with "by @{handle}" (link to `/u/[handle]`), the stack badge, the team badge when `org` is set, the "Private" badge when private, tag badges, and the star count with a `Star` icon.
2. **Forked from** (when `forked_from` is not null): `text-sm text-muted-foreground`: "Forked from {title} by @{handle}", the title linking to the original.
3. **Actions row** (`skill-actions.tsx`, client): "Install" (primary), "Star" or "Starred" (outline; filled star icon when starred), "Share" (ghost, public skills only). Step 10 adds "Fork".
4. **Content:** `markdown.tsx` renders `content` with `react-markdown` + `remark-gfm` inside `prose prose-neutral max-w-none`, code in `font-mono`. Raw HTML is not rendered.

**Client behaviour:**

- Any action returning `needsAuth`: go to `/sign-in?redirect_url=/s/{slug}`.
- **Install:** copy `command` to the clipboard, then toast "Install command copied" with the command (in `font-mono`) as its description.
- **Star:** update the button and count from the result, then toast "Starred" or "Star removed".
- **Share:** copy `${location.origin}/s/${slug}?ref=share`, toast "Link copied". No event; the open is what's tracked.
- `?published=1` in the URL: toast "Published" once, then remove the parameter with `router.replace` (no scroll).

**Tracking** (client): `<TrackOnMount event="skill_viewed" properties={{ slug, stack, author_handle, visibility }} />`. `share-tracker.tsx`: when the URL has `?ref=share`, send `share_link_opened` once and remove `ref` with `router.replace` (no scroll).

## Checks

- Signed out, Install goes to sign-in and comes back to the skill. Signed in, Install copies `npx hive add <slug>` and `skill_installed` arrives with `source: server`.
- Star then unstar: the count goes up then down, and exactly one `skill_starred` is sent.
- Opening `/s/<slug>?ref=share` sends `share_link_opened` once.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 09
- /s/[slug]: getSkill() and hasStarred() in lib/queries/skill.ts (RLS decides visibility).
- app/s/[slug]/actions.ts: installSkill (skill_installed), toggleStar (skill_starred on star only). Star counts come from the trigger.
- Client events: skill_viewed, share_link_opened. Toasts: "Install command copied", "Starred", "Star removed", "Link copied", "Published".
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 09: skill page` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-09`.

**Next:** `10-fork-comments.md`