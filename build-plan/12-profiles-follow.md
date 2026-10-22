# Step 12: Profiles and follow

| | |
| --- | --- |
| Starts from | `step-11` |
| Ends at | `step-12` |
| What you'll learn | Not everything needs tracking |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 11 is committed and tagged `step-11`. If this step goes wrong, go back with `git reset --hard step-11` and run it again in a new conversation.

**Goal:** public profiles and following. Following is deliberately not tracked: no decision depends on it yet.

## Files

`app/u/[handle]/page.tsx`, `app/u/[handle]/actions.ts`, `components/profile/follow-button.tsx`, `lib/queries/profile.ts`.

**Queries** (`lib/queries/profile.ts`): the profile by `handle`; follower count (`follows` where `following_id` = id, `count: 'exact', head: true`); following count; whether the current user follows them; their skills as `SkillCard` data using `CARD_FIELDS` from `lib/queries/search.ts`, filtered by `author_id`, newest first. RLS hides private skills from other people automatically.

`app/u/[handle]/actions.ts`, **VERBATIM**:

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';

export async function toggleFollow(handle: string): Promise<{ needsAuth: true } | { following: boolean } | { error: string }> {
  const me = await getCurrentProfile();
  if (!me) return { needsAuth: true };
  const supabase = await createServerSupabase();
  const { data: them } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle();
  if (!them || them.id === me.id) return { error: 'You can’t follow this profile.' };

  const inserted = await supabase.from('follows').insert({ follower_id: me.id, following_id: them.id });
  let following = true;
  if (inserted.error) {
    if (inserted.error.code !== '23505') return { error: 'Could not update follow.' };
    await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', them.id);
    following = false;
  }
  revalidatePath(`/u/${handle}`);
  return { following };
}
```

**Page:** `notFound()` when there's no profile with that handle.

- **Header:** avatar (`avatar_url`, falling back to the first letter on a `bg-primary text-primary-foreground` circle), H1 display name, "@{handle}" (muted), the stack badge if set, "{n} followers" and "{n} following" (singular "1 follower").
- **Button:** none on your own profile. Signed out: "Follow" goes to `/sign-in?redirect_url=/u/{handle}`. Signed in: "Follow" (primary) or "Following" (outline).
- **H2 "Published skills":** `SkillCard`s, newest first. Empty: `EmptyState` with title "No skills yet" and body "@{handle} hasn’t published a skill yet."

## Checks

- Follow then unfollow updates the counts, and the follow creates one `follow` notification (from the trigger).
- No PostHog event is sent for follows.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 12
- /u/[handle]: profile header, follower counts, Follow button (toggleFollow, not tracked on purpose), published skills.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 12: profiles follow` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-12`.

**Next:** `13-dashboard-notifications.md`
