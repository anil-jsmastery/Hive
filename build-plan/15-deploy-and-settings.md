# Step 15: Deploy and dashboard settings

| | |
| --- | --- |
| Starts from | `step-14` |
| Ends at | `step-15` |
| What you'll learn | Verify your data before users arrive |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 14 is committed and tagged `step-14`. If this step goes wrong, go back with `git reset --hard step-14` and run it again in a new conversation.

**Goal:** Hive live on Vercel, PostHog configured for replays and testing traffic, and every tracked event checked by hand before any agents arrive.

## Dashboard checklist

**Vercel**
1. Import the repo and add every variable from `CONTRACT.md` except `SUPABASE_PROJECT_REF`. Leave `CLERK_WEBHOOK_SIGNING_SECRET` empty until Step 16.
2. Deploy, and note the production URL.

**Clerk**
1. Keep the **development instance**. It works on the Vercel URL (you'll see Clerk's "development mode" badge), and the swarm needs its test emails and test payment gateway. Moving to a production instance is out of scope for this build.

**PostHog**
1. Turn on **session replay** (record all sessions), **heatmaps** and **exception autocapture**. Leave autocapture off.
2. Add a **test account filter** that excludes events where `cohort` starts with `swarm`. It's off by default in insights; Step 17 uses it to compare swarm and human traffic.

## Verify the data

1. Run `npm run db:seed` once against the project (same Supabase project as local).
2. On the deployed site, click through every row of `TRACKING_PLAN.md` that exists so far (everything except `paywall_shown`, `pricing_viewed`, `organization_created` and the subscription events).
3. Ask the PostHog MCP: "List all custom events received in the last hour with one example of their properties." Compare the list with `TRACKING_PLAN.md`: names and property names must match exactly, and nothing extra may appear.
4. Open one session recording and confirm it shows your clicks.

## Checks

- Every tracking-plan row built so far has at least one event in PostHog with the right properties.
- `identify` merged your anonymous visit, and team events show the organization group.
- At least one session recording exists.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 15
- Deployed on Vercel with the Clerk development instance. PostHog: replays, heatmaps and exception autocapture on, autocapture off, a test-account filter for cohort starting with swarm.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 15: deploy and settings` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-15`.

**Next:** `16-billing.md`
