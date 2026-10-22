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

Ask the PostHog MCP to create a multivariate feature flag with key `publish-flow-v2`, variants `control` and `test` at 50% each, released to 100% of users, and an experiment on that flag with `skill_published` as the goal metric. Then confirm both exist in the PostHog app.

## Code

In `app/publish/page.tsx`, replace the fixed variant with, **VERBATIM**:

```ts
const flag = await getFlag(profile.id, 'publish-flow-v2');
const variant: Variant = flag === 'test' ? 'test' : 'control';
```

(`profile` comes from `getCurrentProfile()`; `getFlag` from `lib/analytics/server.ts`.) This server-side call also records the exposure the experiment needs. `PublishForm` already takes `variant`; it renders the same for both until Step 19.

## Checks

- Two test users land in different variants.
- Their `publish_started` and `skill_published` events carry the matching `variant`.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 18
- Feature flag publish-flow-v2 (control/test, 50/50) and its experiment, created via the PostHog MCP. /publish picks the variant on the server with getFlag().
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 18: feature flag` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-18`.

**Next:** `19-the-fix.md`
