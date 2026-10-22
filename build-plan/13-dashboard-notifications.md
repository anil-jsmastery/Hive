# Step 13: Dashboard and notifications

| | |
| --- | --- |
| Starts from | `step-12` |
| Ends at | `step-13` |
| What you'll learn | Retention loops |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 12 is committed and tagged `step-12`. If this step goes wrong, go back with `git reset --hard step-12` and run it again in a new conversation.

**Goal:** your skills, your forks, notifications, and the event that shows whether notifications bring people back.

## Files

`app/dashboard/page.tsx`, `app/dashboard/actions.ts`, `components/dashboard/notification-list.tsx`, `lib/queries/notifications.ts`. Update `components/site-header.tsx`.

`app/dashboard/actions.ts`, **VERBATIM**:

```ts
'use server';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/profile';
import { trackServer } from '@/lib/analytics/server';

export async function openNotification(id: string) {
  const me = await getCurrentProfile();
  if (!me) redirect('/sign-in?redirect_url=/dashboard');
  const supabase = await createServerSupabase();
  const { data: n } = await supabase
    .from('notifications')
    .select('id, type, read_at, actor:profiles!notifications_actor_id_fkey(handle), skill:skills!notifications_skill_id_fkey(slug)')
    .eq('id', id)
    .maybeSingle();
  if (!n) redirect('/dashboard');

  if (!n.read_at) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  await trackServer(me.id, 'notification_clicked', { type: n.type as 'fork' | 'comment' | 'follow' });

  if (n.type === 'follow' || !n.skill) redirect(`/u/${n.actor?.handle ?? ''}`);
  redirect(`/s/${n.skill.slug}`);
}
```

**`lib/queries/notifications.ts`:** `listNotifications()` (up to 30, newest first, with actor handle and skill slug and title, using the same FK hints as above) and `unreadCount()` (`count: 'exact', head: true` where `read_at` is null). RLS limits both to the current user.

**Page:** signed out → `redirect('/sign-in?redirect_url=/dashboard')`. H1 "Dashboard", then these sections in order:

1. **H2 "Notifications".** Each row is a `<form action={openNotification.bind(null, id)}>` with a full-width button. Unread rows: `bg-accent` and a small honey dot.

   | Type | Text |
   | --- | --- |
   | fork | "@{actor} forked {skill title}" |
   | comment | "@{actor} commented on {skill title}" |
   | follow | "@{actor} followed you" |

   Each row shows `timeAgo` on the right. Empty: `EmptyState` with title "Nothing yet" and body "When someone forks, comments or follows, it shows up here."
2. **H2 "Your skills":** your skills where `forked_from_id` is null, as `SkillCard`s. Empty: title "No skills yet", body "You haven’t published a skill yet.", action button "Publish a skill" to `/publish`.
3. **H2 "Your forks":** your skills where `forked_from_id` is not null. Empty: title "No forks yet", body "Fork a skill to make your own version.", action link "Explore skills" to `/explore`.

**Header:** the "Dashboard" link gets a small `bg-primary text-primary-foreground` badge with `unreadCount()`, hidden at 0.

## Checks

- As user A, fork a seed skill. As user B, fork one of A's skills. A sees one unread notification and the header badge shows 1.
- Clicking it sends `notification_clicked` with `type: fork`, marks it read and opens the skill.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 13
- /dashboard: Notifications (openNotification marks read, sends notification_clicked, redirects), Your skills, Your forks.
- Header Dashboard link shows unreadCount() from lib/queries/notifications.ts.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 13: dashboard notifications` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-13`.

**Next:** `14-organizations.md`
