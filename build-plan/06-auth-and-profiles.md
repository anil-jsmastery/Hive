# Step 06: Auth, profiles and onboarding (Clerk + Supabase)

| | |
| --- | --- |
| Starts from | `step-05` |
| Ends at | `step-06` |
| What you'll learn | Identity: link anonymous visitors to real accounts |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 05 is committed and tagged `step-05`. If this step goes wrong, go back with `git reset --hard step-05` and run it again in a new conversation.

**Goal:** Clerk sign-up and sign-in, Clerk's session token accepted by Supabase, a profile row per user, the stack picker, and identity linked in PostHog.

**Identity lesson (optional):** first build this step with `AnalyticsIdentity` left out of the layout, sign up once, and look in PostHog at how the anonymous visit and the signed-in user look like two different people. Then add it, and watch them merge.

## Dashboard checklist (Clerk, development instance)

1. Create an application named `Hive`. Sign-in options: **Email** and **Password** on, **Username** on and **required**, phone off, all social connections off. Email verification: **code**.
2. Copy the publishable and secret keys into `.env.local`. Also add the four `NEXT_PUBLIC_CLERK_*` URL variables from `CONTRACT.md`.
3. Open **Integrations → Supabase** (Clerk's Supabase integration setup) and select **Activate Supabase integration**. This adds the `role` claim Supabase needs. Copy the Clerk domain it shows.
4. Keep the instance in **development**. The swarm needs its test emails (`+clerk_test`, code `424242`) and test mode.

## Dashboard checklist (Supabase)

1. **Authentication → Sign In / Providers → Third-Party Auth → Add provider → Clerk**, and paste the Clerk domain from above.

## Files

| File | Contains |
| --- | --- |
| `proxy.ts` (`middleware.ts` if the pinned Next.js is 15 or lower) | VERBATIM below |
| `lib/supabase/server.ts` | VERBATIM below |
| `lib/profile.ts` | VERBATIM below |
| `components/analytics/analytics-identity.tsx` | VERBATIM below |
| `app/layout.tsx` | Wrap everything in `<ClerkProvider appearance={{ theme: shadcn }}>` (`shadcn` from `@clerk/ui/themes`). Call `getCurrentProfile()` and render `<AnalyticsIdentity stack={profile?.stack ?? null} />` after the footer |
| `app/sign-in/[[...sign-in]]/page.tsx` | `<div className="flex justify-center py-16"><SignIn /></div>` |
| `app/sign-up/[[...sign-up]]/page.tsx` | `<div className="flex justify-center py-16"><SignUp /></div>` |
| `app/onboarding/page.tsx` | The stack picker page (spec below) |
| `components/onboarding/stack-picker.tsx` | Client component: radio cards plus buttons |
| `app/onboarding/actions.ts` | `saveStack(stack)` |
| `components/site-header.tsx` | Wire in Clerk (spec below) |

`proxy.ts`, **VERBATIM**:

```ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
};
```

`lib/supabase/server.ts`, **VERBATIM**:

```ts
import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Every app read and write goes through this client, so RLS always applies.
// Signed-out visitors get the anon role; signed-in users get their Clerk session token.
export async function createServerSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
}
```

`lib/profile.ts`, **VERBATIM**:

```ts
import 'server-only';
import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { trackServer } from '@/lib/analytics/server';

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  stack: string | null;
};

const FIELDS = 'id, handle, display_name, avatar_url, stack';

// The signed-in user's profile. Created on their first signed-in request, which is
// also the only place user_signed_up is sent.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase.from('profiles').select(FIELDS).eq('id', userId).maybeSingle();
  if (existing) return existing;

  const user = await currentUser();
  if (!user?.username) return null; // Username is required in the Clerk dashboard settings.

  const base = { id: userId, display_name: user.fullName || user.username, avatar_url: user.imageUrl };
  let result = await supabase.from('profiles').insert({ ...base, handle: user.username }).select(FIELDS).single();
  if (result.error) {
    // Either another request created the profile first, or the handle belongs to a seed author.
    const { data: raced } = await supabase.from('profiles').select(FIELDS).eq('id', userId).maybeSingle();
    if (raced) return raced;
    const fallback = `${user.username}-${userId.slice(-6).toLowerCase()}`;
    result = await supabase.from('profiles').insert({ ...base, handle: fallback }).select(FIELDS).single();
    if (result.error) return null;
  }

  await trackServer(userId, 'user_signed_up', { method: 'email' });
  return result.data;
});
```

`components/analytics/analytics-identity.tsx`, **VERBATIM**:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';

// Links the anonymous visitor to the Clerk user, resets on sign-out,
// and attaches the active team as a PostHog group.
export function AnalyticsIdentity({ stack }: { stack: string | null }) {
  const { isLoaded, user } = useUser();
  const { organization } = useOrganization();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      if (lastUserId.current) posthog.reset();
      lastUserId.current = null;
      return;
    }
    lastUserId.current = user.id;
    if (posthog.get_distinct_id() === user.id) return;
    posthog.identify(user.id, {
      handle: user.username ?? '',
      name: user.fullName ?? user.username ?? '',
      ...(stack ? { stack } : {}),
      cohort: posthog.get_property('cohort') ?? 'human',
      persona: posthog.get_property('persona') ?? 'none',
    });
  }, [isLoaded, user, stack]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!organization) {
      posthog.resetGroups();
      return;
    }
    posthog.group('organization', organization.id, { name: organization.name, slug: organization.slug ?? '' });
  }, [isLoaded, organization]);

  return null;
}
```

**`/onboarding` page:** if signed out, `redirect('/sign-in')`.

- H1 "Pick your stack". Text (muted): "We’ll use it to show skills that fit how you build."
- One radio card per stack in `STACKS` order (shadcn `RadioGroup`, each option a bordered card, selected card `border-primary`).
- Primary button "Continue", disabled until a stack is chosen, pending label "Saving…". It calls `saveStack`.
- Text link "Skip for now" to `/explore`.

**`saveStack(stack)`:** reject anything not in `STACKS`. Update the user's `profiles.stack` through `createServerSupabase()`, call `setPersonProperties(userId, { stack })`, then `redirect('/explore')`.

**Header, signed out:** `<Show when="signed-out"><SignInButton><Button>Sign in</Button></SignInButton></Show>`.

**Header, signed in** (`<Show when="signed-in">`), right side, in this order:

1. A link "Dashboard" to `/dashboard`. In Step 13 it gets an unread badge.
2. `<UserButton>` with one extra menu item: `<UserButton.MenuItems><UserButton.Link label="Profile" labelIcon={<UserIcon className="size-4" />} href={`/u/${profile.handle}`} /></UserButton.MenuItems>`.

## Checks

- Sign up with `ada+clerk_test@example.com`, username `ada`, any password, verification code `424242`. You land on `/onboarding`.
- Supabase has a `profiles` row with `id` = your Clerk user id and `handle` = `ada`.
- PostHog shows exactly one `user_signed_up`, and your earlier anonymous `$pageview`s are merged into the identified person.
- Choosing "Python" and Continue sets `stack: Python` on the PostHog person and in `profiles`.
- Sign out from the user menu, then sign in again: still one person in PostHog, no second `user_signed_up`.
- In the Supabase SQL editor, running `set role anon; insert into profiles (id, handle, display_name) values ('x', 'x', 'x');` fails with a row-level security error.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 06
- Clerk: ClerkProvider (shadcn theme), proxy.ts with clerkMiddleware, /sign-in and /sign-up pages, username required, development instance.
- Supabase accepts Clerk session tokens (third-party auth). lib/supabase/server.ts createServerSupabase() is the only app client.
- lib/profile.ts getCurrentProfile() creates the profile on first sign-in and sends user_signed_up once.
- AnalyticsIdentity identifies the Clerk user, resets on sign-out and sets the organization group.
- /onboarding saves the stack to profiles and to PostHog person properties.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 06: auth and profiles` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-06`.

**Next:** `07-landing.md`
