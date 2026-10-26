# Step 18: Feature flag and experiment

| | |
| --- | --- |
| Starts from | `step-17` |
| Ends at | `step-18` |
| What you'll learn | Ship reversibly: server-side flags and experiments |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 17 is committed and tagged `step-17`. If this step goes wrong, go back with `git reset --hard step-17` and run it again in a new conversation.

**Goal:** `/publish` can show two versions, assigned on the server so there's no flicker. Both versions look identical until Step 19.

## Do it with the PostHog MCP

1. **Create the experiment, which creates its flag.** Use the PostHog MCP's experiment tool (`experiment-create`) in one call; don't create the flag separately. Settings:

   | Setting | Value |
   | --- | --- |
   | Name | `Publish flow v2` |
   | Flag key | `publish-flow-v2` |
   | Variants | `control` 50%, `test` 50% |
   | Release condition | 100% of users, no property filters |
   | Goal metric | A funnel from exposure to `skill_published` (did an exposed builder publish?), where an increase is good |

2. **Include the swarm in the results.** New experiments filter out test accounts, and Step 15's filter removes everything tagged `cohort: swarm-…`. Here the swarm *is* the traffic, so turn **Filter test accounts off** for this experiment. Do it on purpose and say so: in a real launch you'd keep test traffic out.

3. **Launch it.** A draft experiment keeps its flag inactive, so `getFlag` returns nothing and everyone falls back to `control`. Launch the experiment (through the MCP or in the PostHog app) before the checks. There are no real users yet, so launching affects only test accounts and the swarm.

4. **Confirm both exist in the PostHog app:** the flag is active, and the experiment is running with the funnel metric.

## Code

In `app/publish/page.tsx`, replace the fixed variant with, **VERBATIM**:

```ts
const flag = await getFlag(profile.id, 'publish-flow-v2');
const variant: Variant = flag === 'test' ? 'test' : 'control';
```

(`profile` comes from `getCurrentProfile()`; `getFlag` from `lib/analytics/server.ts`.) This server-side call also records the exposure the experiment needs. `PublishForm` already takes `variant`; it renders the same for both until Step 19.

## Checks

- The experiment "Publish flow v2" is **running** (not draft), its flag `publish-flow-v2` is active, and **Filter test accounts** is off for this experiment.
- Two test users land in different variants. (With 50/50 it can take a few users to get one of each.)
- Their `publish_started` and `skill_published` events carry the matching `variant`.
- The experiment page shows **exposures** for those test users. If it shows none, open the experiment's exposure settings and use the `$feature_flag_called` event for `publish-flow-v2`, which is what the server-side `getFlag` call sends.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 18
- Experiment "Publish flow v2" (created with its flag publish-flow-v2 in one PostHog MCP call): control/test 50/50, goal = funnel from exposure to skill_published, test-account filter off so the swarm counts, launched. /publish picks the variant on the server with getFlag().
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 18: feature flag` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-18`.

**Next:** `19-the-fix.md`