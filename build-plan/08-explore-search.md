# Step 08: Explore and search

| | |
| --- | --- |
| Starts from | `step-07` |
| Ends at | `step-08` |
| What you'll learn | Search as the voice of the user |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 07 is committed and tagged `step-07`. If this step goes wrong, go back with `git reset --hard step-07` and run it again in a new conversation.

**Goal:** browse and search skills with a stack filter, and track what people search for.

## Files

`app/explore/page.tsx`, `components/explore/search-form.tsx`, `components/explore/stack-filter.tsx`, `components/explore/skill-card.tsx`, `lib/queries/search.ts`.

**`lib/queries/search.ts`, VERBATIM:**

```ts
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
```

Every embedded relation in this plan names its foreign key (for example `profiles!skills_author_id_fkey`). Skills and profiles are linked in several ways (author, stars, comments), so without the hint Supabase can't tell which link you mean.

**The URL is the state:** `/explore?q=<query>&stack=<stack>`. `stack` is missing or one of `STACKS`; anything else counts as "All".

**Page, top to bottom:**

1. H1 "Explore skills".
2. **Search form** (client): label "Search skills", input with placeholder `Try “code review” or “auth”`, primary button "Search". Submitting goes to `/explore?q=…` and keeps the current `stack`. An empty search removes `q`.
3. **Stack filter:** pill links "All" + each stack. Active pill `bg-primary text-primary-foreground`, others outline. Clicking keeps `q`.
4. **Count:** `text-sm text-muted-foreground`: "{n} skills" ("1 skill" when singular).
5. **Results:** one-column list of `SkillCard`s, `gap-3`.
6. **Empty state** (only when `q` is set and there are 0 results): `EmptyState` with title `No skills match “{q}”`, body "Try a shorter search, or browse every skill." and a link "Browse all skills" to `/explore`.

**`SkillCard`** (client component, so it can track clicks): white card, `rounded-xl`, border.

- **Top:** title as a link to `/s/[slug]` (card title style).
- **Below:** description, muted.
- **Bottom row, left:** "@{author.handle}" linking to `/u/[handle]`, the stack badge, a team badge when `org` is set (links to `/o/[slug]`), a "Private" badge when `visibility` is `private`, then tag badges.
- **Bottom row, right:** lucide `Star` in `text-primary` and the star count.
- When the card receives a `query` prop, clicking the title calls `trackClient('search_result_opened', { query, rank, slug })`, where `rank` is the 1-based position.

**Tracking searches** (only when `q` is set):

```tsx
<TrackOnMount key={`${q}|${stack ?? 'All'}`} event="search_performed"
  properties={{ query: q, stack: stack ?? 'All', result_count: results.length }} />
```

## Checks

- Searching "auth" returns the auth skills.
- Searching "terraform" shows the empty state and sends `search_performed` with `result_count: 0`.
- Changing the stack filter while a query is set sends a new `search_performed`.
- Opening `/explore` with no query sends no search event.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 08
- /explore: URL state (q, stack), search form, stack filter pills, SkillCard list from searchSkills() in lib/queries/search.ts (search_skills RPC).
- Events: search_performed (TrackOnMount keyed by query and stack), search_result_opened (SkillCard).
- SkillCard shows author, stack, team badge, Private badge, tags and stars.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 08: explore search` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-08`.

**Next:** `09-skill-page.md`
