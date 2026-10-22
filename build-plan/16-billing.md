# Step 16: Billing (Clerk Billing)

| | |
| --- | --- |
| Starts from | `step-15` |
| Ends at | `step-16` |
| What you'll learn | Would someone pay? The paywall-to-subscription funnel |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 15 is committed and tagged `step-15`. If this step goes wrong, go back with `git reset --hard step-15` and run it again in a new conversation.

**Goal:** Clerk Billing with two paid plans, a pricing page, the paywall in the publish form, and webhooks that turn real subscriptions into PostHog events. The funnel to measure: `paywall_shown` → `pricing_viewed` → `subscription_started`.

## Dashboard checklist (Clerk)

1. **Billing → Settings:** enable Billing for **users and organizations**, using the **Clerk development gateway** (test payments, no Stripe account needed). Alternative from the terminal: `npx clerk@latest enable billing`.
2. **Subscription plans → Plans for users:** keep the default free plan (key `free_user`). Add plan **Pro**: key `pro`, $8 per month, publicly available, with feature **Private skills** (key `private_skills`).
3. **Plans for organizations:** keep the default free plan (key `free_org`). Add plan **Team**: key `team`, $20 per month, publicly available, with feature **Private team skills** (key `team_private_skills`).
4. **Webhooks → Add endpoint:** `https://<your-vercel-url>/api/webhooks/clerk`, subscribed to `organization.created`, `subscriptionItem.active` and `subscriptionItem.canceled`. Copy the signing secret into Vercel and `.env.local` as `CLERK_WEBHOOK_SIGNING_SECRET`, then redeploy.

## Files

| File | Change |
| --- | --- |
| `lib/supabase/admin.ts` | New, VERBATIM below |
| `app/api/webhooks/clerk/route.ts` | New, VERBATIM below |
| `app/pricing/page.tsx`, `components/billing/pricing-tabs.tsx` | New: the pricing page (spec below) |
| `components/billing/paywall-dialog.tsx` | New: the paywall (spec below) |
| `components/publish/publish-form.tsx` | Add the "Visibility" field and open the paywall when `state.paywall` is set |
| `components/site-header.tsx` | Add "Pricing" (`/pricing`; icon `Tag`, `aria-label` "Pricing" below 640px) between Explore and Publish |

`lib/supabase/admin.ts`, **VERBATIM**:

```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Bypasses RLS. Only app/api/webhooks/clerk/route.ts may use this.
export function createAdminSupabase() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}
```

`app/api/webhooks/clerk/route.ts`, **VERBATIM**:

```ts
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import type { NextRequest } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { identifyOrganization, trackServer } from '@/lib/analytics/server';

// Default free plans also send subscriptionItem events (for every new user and team).
const FREE_PLANS = new Set(['free_user', 'free_org']);

// Field paths for Clerk's subscriptionItem payload. If your events report plan "unknown",
// compare with one real test event in Clerk Dashboard → Webhooks → your endpoint → Logs.
function readSubscriptionItem(data: unknown) {
  const d = data as {
    plan?: { slug?: string; key?: string };
    payer?: { user_id?: string | null; organization_id?: string | null };
  };
  return {
    plan: String(d.plan?.slug ?? d.plan?.key ?? 'unknown'),
    userId: d.payer?.user_id ?? null,
    orgId: d.payer?.organization_id ?? null,
  };
}

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (evt.type === 'organization.created') {
    const org = evt.data;
    const slug = org.slug ?? org.id;
    await createAdminSupabase()
      .from('organizations')
      .upsert({ id: org.id, slug, name: org.name, image_url: org.image_url ?? null });
    await identifyOrganization(org.id, { name: org.name, slug });
    if (org.created_by) await trackServer(org.created_by, 'organization_created', { slug }, org.id);
  }

  if (evt.type === 'subscriptionItem.active' || evt.type === 'subscriptionItem.canceled') {
    const item = readSubscriptionItem(evt.data);
    if (!FREE_PLANS.has(item.plan) && (item.userId || item.orgId)) {
      const event = evt.type === 'subscriptionItem.active' ? 'subscription_started' : 'subscription_canceled';
      await trackServer(
        item.userId ?? `org_${item.orgId}`,
        event,
        { plan: item.plan, payer: item.orgId ? 'organization' : 'user' },
        item.orgId,
      );
    }
  }

  return new Response('ok', { status: 200 });
}
```

**`/pricing` page:** H1 "Plans". Text (muted): "Public skills are free. Pay only when you need private ones." Then `pricing-tabs.tsx` (client): shadcn `Tabs` with "For you" (`personal`) and "For teams" (`team`). The initial tab comes from `?tab=` (default `personal`).

- **For you:** `<PricingTable />`.
- **For teams:** when a team is active, `<PricingTable for="organization" />`. Otherwise `EmptyState` with title "No team selected", body "Create or switch to a team to see team plans." and `<OrganizationSwitcher hidePersonal />` as the action.
- **Tracking:** `<TrackOnMount key={tab} event="pricing_viewed" properties={{ tab }} />`, so switching tabs sends a new event.

**"Visibility" field** in the publish form, after Tags: a `RadioGroup` named `visibility`, label "Visibility".

| Option | Help text |
| --- | --- |
| "Public" (default) | "Anyone can find and install it." |
| "Private" (with a `Lock` icon) | Personal: "Only you can see it. Needs Pro." Team (when "Publish as" is the team): "Only your team can see it. Needs Team." |

**`PaywallDialog`** (shadcn `Dialog`), opened whenever a submit returns `state.paywall`:

- Title: "Private skills are a paid feature".
- Body: for `private_skills`, "Upgrade to Pro to publish skills only you can see." For `team_private_skills`, "Upgrade your team to Team to publish skills only your team can see."
- A `bg-accent` box: "Pro: $8/month" or "Team: $20/month".
- Primary button "See plans", linking to `/pricing?tab=personal` or `/pricing?tab=team`.
- Outline button "Publish as public instead": sets Visibility to Public and closes the dialog (the user submits again).
- Each time it opens, it sends `trackClient('paywall_shown', { feature })` once.

## Check against your own Clerk instance

| Question | Where to check |
| --- | --- |
| Are the default free plan keys exactly `free_user` and `free_org`? | Clerk Dashboard → Subscription plans |
| Where are the plan key and the payer's user or organization id in a `subscriptionItem.active` payload? | Webhook logs after one test subscription; update `readSubscriptionItem` |
| How many users does the development instance allow? The swarm creates one per agent | Clerk Dashboard, or Clerk support |

## Checks

- Signed in without a plan, publishing a Private skill opens the paywall and sends `paywall_shown` with `feature: private_skills`. Nothing is published.
- "See plans" opens the "For you" tab and sends `pricing_viewed` with `tab: personal`.
- Subscribe to Pro with test card `4242 4242 4242 4242`, any future expiry date and any CVC. The webhook log shows 200, and PostHog receives `subscription_started` with `plan: pro` and `payer: user`.
- Publishing a Private skill now works: `skill_published` has `visibility: private`, and the skill is invisible when signed out.
- Creating a new team sends `organization_created`. Default free-plan webhook events send nothing.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 16
- Clerk Billing: Pro (user, private_skills, $8) and Team (organization, team_private_skills, $20) on the development gateway.
- /pricing with For you / For teams tabs (pricing_viewed). Header has a Pricing link.
- Publish form: Visibility field and PaywallDialog (paywall_shown). publishSkill gates private skills with has({ feature }).
- app/api/webhooks/clerk/route.ts verifies Clerk webhooks: organization.created (upsert + organization_created), subscriptionItem.active/canceled (subscription_started/canceled, free plans ignored).
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 16: billing` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-16`.

**Next:** `17-swarm.md`
