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

1. **Billing → Settings:** turn on **Enable user billing** and **Enable organization billing**. Leave **Require payment method for free trials** as it is (Hive has no trials). A development instance uses Clerk's test gateway automatically, so no Stripe account is needed. Alternative from the terminal: `npx clerk@latest enable billing`.
2. **Billing → Subscription plans → Plans for users:** check that the default free plan exists and its key is `free_user`. Then **Create Plan**:

   | Field | Value |
   | --- | --- |
   | Name | Pro |
   | Key | `pro` |
   | Description | `Publish private skills only you can see.` |
   | Billing period | Monthly |
   | Monthly base fee | $8.00 |
   | Free trial | Off |
   | Publicly available | On |
   | Features | **Add feature**: name `Private skills`, key `private_skills`, description `Publish skills only you can see and install.` |

3. **Plans for organizations:** check that the default free plan exists and its key is `free_org`. Then **Create Plan**:

   | Field | Value |
   | --- | --- |
   | Name | Team |
   | Key | `team` |
   | Description | `Publish private skills only your team can see.` |
   | Billing period | Monthly |
   | Monthly base fee | $20.00 (turn the toggle on first) |
   | Seat-based | Off (flat price per team; seat-based pricing is out of scope) |
   | Free trial | Off |
   | Publicly available | On |
   | Features | **Add feature**: name `Private team skills`, key `team_private_skills`, description `Publish skills only members of your team can see and install.` |

   For Team, add the feature from the **New feature** tab of the Add feature dialog, keep **Publicly available** on, and ignore the Roles & Permissions note (any team member may publish private team skills). Don't tick **Private skills** under Available features: that's Pro's feature, and team subscriptions are checked against `team_private_skills`.

   The keys matter more than the names: the code checks them exactly.
4. **Developers → Webhooks → Add endpoint:** `https://<your-vercel-url>/api/webhooks/clerk`, subscribed to `organization.created`, `subscriptionItem.active` and `subscriptionItem.canceled`. Copy the signing secret into Vercel and `.env.local` as `CLERK_WEBHOOK_SIGNING_SECRET`, then redeploy.

## Files

| File | Change |
| --- | --- |
| `lib/supabase/admin.ts` | New, VERBATIM below |
| `app/api/webhooks/clerk/route.ts` | New, VERBATIM below |
| `app/pricing/page.tsx`, `components/billing/pricing-tabs.tsx` | New: the pricing page. Redirects to `/publish?upgraded=1` after checkout only when the URL has `from=publish` (spec below) |
| `components/billing/paywall-dialog.tsx` | New: the paywall. "See plans" saves the draft and opens `/pricing?...&from=publish` (spec below) |
| `components/publish/publish-form.tsx` | Add the "Visibility" field, open the paywall when `state.paywall` is set, and restore the draft after an upgrade (spec below). The form must submit through `onSubmit` + `startTransition(() => formAction(data))`, never the form's `action` prop: React 19 resets a form after its `action` runs, which empties Publish as, Stack and Visibility. If the form still uses `action`, switch it in this step |
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

- **Return to the editor after upgrading from the paywall.** When the URL has `from=publish`, both pricing tables get `newSubscriptionRedirectUrl="/publish?upgraded=1"`, so a successful checkout returns to the editor. Without `from=publish` (someone who opened `/pricing` directly), the prop is left out and they stay on `/pricing` after paying.
- **For you:** `<PricingTable />`.
- **For teams:** when a team is active, `<PricingTable for="organization" />`. Otherwise `EmptyState` with title "No team selected", body "Create or switch to a team to see team plans." and `<OrganizationSwitcher hidePersonal />` as the action.
- **Tracking:** `<TrackOnMount key={tab} event="pricing_viewed" properties={{ tab }} />`, so switching tabs sends a new event.

**"Visibility" field** in the publish form, after Tags: a `RadioGroup` named `visibility`, label "Visibility". Like every field in this form, it must keep its value after a submit that shows the paywall (the form submits through `onSubmit`, see Step 11).

| Option | Help text |
| --- | --- |
| "Public" (default) | "Anyone can find and install it." |
| "Private" (with a `Lock` icon) | Personal: "Only you can see it. Needs Pro." Team (when "Publish as" is the team): "Only your team can see it. Needs Team." |

**Restoring the draft after an upgrade.** On mount, when the URL has `upgraded=1` and `sessionStorage` holds `hive:publish-draft`, the publish form fills every field from the draft (Visibility stays Private), removes the draft from `sessionStorage`, removes `upgraded=1` from the URL with `router.replace` (no scroll), and shows the toast "Your plan is active. Your draft is back, ready to publish." It never publishes on its own: the user submits again. Without `upgraded=1`, a leftover draft is ignored and removed.

**`PaywallDialog`** (shadcn `Dialog`), opened whenever a submit returns `state.paywall`:

- Title: "Private skills are a paid feature".
- Body: for `private_skills`, "Upgrade to Pro to publish skills only you can see." For `team_private_skills`, "Upgrade your team to Team to publish skills only your team can see."
- A `bg-accent` box: "Pro: $8/month" or "Team: $20/month".
- Primary button "See plans". Before leaving, it saves the current form values (with Visibility set to Private) to `sessionStorage` under the key `hive:publish-draft`, then goes to `/pricing?tab=personal&from=publish` or `/pricing?tab=team&from=publish`.
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
- After the paywall opens, Publish as, Stack and Visibility still show what you chose, and the text fields keep their values.
- "See plans" opens the "For you" tab (URL includes `from=publish`) and sends `pricing_viewed` with `tab: personal`.
- After paying from the paywall, checkout returns to `/publish` with every field restored, Visibility on Private and the toast showing. Nothing is published until you submit.
- Opening `/pricing` directly and subscribing there leaves you on `/pricing` (no redirect).
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
- Upgrading from the paywall: "See plans" saves the draft to sessionStorage (hive:publish-draft) and opens /pricing?from=publish; only then does PricingTable redirect to /publish?upgraded=1, where the draft is restored. Direct visits to /pricing stay there after paying.
- app/api/webhooks/clerk/route.ts verifies Clerk webhooks: organization.created (upsert + organization_created), subscriptionItem.active/canceled (subscription_started/canceled, free plans ignored).
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 16: billing` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-16`.

**Next:** `17-swarm.md`