# Step 07: Landing page

| | |
| --- | --- |
| Starts from | `step-06` |
| Ends at | `step-07` |
| What you'll learn | One page, one job: does the landing page convert? |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 06 is committed and tagged `step-06`. If this step goes wrong, go back with `git reset --hard step-06` and run it again in a new conversation.

**Goal:** one sentence, one call to action and a live activity rail.

## Files

`app/page.tsx`, `components/landing/hero-cta.tsx`, `components/landing/activity-rail.tsx`, `lib/queries/activity.ts`.

**`lib/queries/activity.ts`, VERBATIM:**

```ts
import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';
import { ACTIVITY_LIMIT } from '@/lib/constants';

export async function latestActivity() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('activities')
    .select('id, type, created_at, actor:profiles!activities_actor_id_fkey(display_name, handle), skill:skills!activities_skill_id_fkey(slug, title)')
    .order('created_at', { ascending: false })
    .limit(ACTIVITY_LIMIT);
  if (error) throw error;
  return data ?? [];
}
```

**Layout** (desktop: two columns, 7/5 grid; mobile: stacked, hero first):

```text
┌──────────────────────────────────┬─────────────────────────┐
│ The registry for agent skills.   │ Happening now           │
│                                  │ ⬢ Priya published …     │
│ Find, install and share the      │ ⬢ Sam forked …          │
│ Markdown playbooks your AI       │ ⬢ … (8 rows)            │
│ agents run on.                   │                         │
│ [ Explore skills ]               │                         │
└──────────────────────────────────┴─────────────────────────┘
```

- **Hero:** H1 "The registry for agent skills." Paragraph (`text-lg text-muted-foreground`): "Find, install and share the Markdown playbooks your AI agents run on." One primary button, size `lg`: "Explore skills", linking to `/explore`. `hero-cta.tsx` is a client component that calls `trackClient('landing_cta_clicked', { cta: 'hero' })` on click.
- **Activity rail** (server component): a card with H2 "Happening now", then one row per activity: `HiveMark` (`size-3`) + sentence + `timeAgo` (muted `text-sm`, right-aligned).

| Type | Sentence | Marker color |
| --- | --- | --- |
| published | "{display_name} published {skill title}" | `text-primary` |
| forked | "{display_name} forked {skill title}" | `text-foreground` |
| starred | "{display_name} starred {skill title}" | `text-primary/60` |
| commented | "{display_name} commented on {skill title}" | `text-muted-foreground` |

The skill title links to `/s/[slug]`. If there are no rows: `EmptyState` with title "It’s quiet in here" and body "New skills will show up here as people publish them."

`export const dynamic = 'force-dynamic'` on the page.

## Checks

- With seed data, the rail shows 8 "published" rows, newest first.
- Clicking "Explore skills" sends exactly one `landing_cta_clicked`.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 07
- Landing page: hero with one CTA (landing_cta_clicked) and an 8-row activity rail from latestActivity() in lib/queries/activity.ts.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 07: landing` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-07`.

**Next:** `08-explore-search.md`
