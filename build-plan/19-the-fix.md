# Step 19: The fix

| | |
| --- | --- |
| Starts from | `step-18` |
| Ends at | `step-19` |
| What you'll learn | Decide with evidence |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 18 is committed and tagged `step-18`. If this step goes wrong, go back with `git reset --hard step-18` and run it again in a new conversation.

**Goal:** ship the fix that Cohort A's data points to, only in the `test` variant of `publish-flow-v2`, then run Cohort B to see whether it works.

## What Cohort A showed

Builders filled in the publish form, submitted, and got field errors, which is expected. Then they corrected the field, but the old error stayed on screen until the next submit. Believing it, they kept "fixing" a field that was already correct, and many gave up. In the replays, one builder re-selects the same stack about 15 times under a stale "Choose a stack." message.

**Hypothesis:** if a field's error disappears as soon as its value changes, builders can see a fix worked, and more of them publish.

**One change only.** The test variant changes this one behaviour. Everything else on the page stays identical, so a difference in the result can be traced to this change.

## Rules

- Only what `variant === 'test'` renders changes. The control stays exactly as built in Steps 11, 14 and 16: errors stay until the next submit.
- No new events. The experiment reads `publish_started` and `skill_published`, which already carry `variant`.
- `lib/validation.ts` and `app/publish/actions.ts` don't change. The server still validates every submit.

## Files

| File | Change |
| --- | --- |
| `components/publish/use-live-errors.ts` | New, VERBATIM below |
| `components/publish/publish-form.tsx` | Use `useLiveErrors` for the field errors and the top alert (spec below) |

`components/publish/use-live-errors.ts`, **VERBATIM**:

```ts
'use client';
import { useState } from 'react';
import type { PublishField, PublishState } from '@/app/publish/actions';

// publish-flow-v2, test variant: a field's error disappears as soon as its value
// changes, instead of staying on screen until the next submit. With enabled =
// false (the control), it returns the server's errors unchanged.
export function useLiveErrors(state: PublishState, enabled: boolean) {
  // Fields cleared since the last submit. Each submit returns a new state object,
  // so cleared fields belong to the state they were cleared on, and reset by
  // themselves when the next result arrives. No effect needed.
  const [cleared, setCleared] = useState<{ state: PublishState; fields: PublishField[] }>({
    state,
    fields: [],
  });
  const clearedFields = cleared.state === state ? cleared.fields : [];

  function clear(field: PublishField) {
    if (!enabled || clearedFields.includes(field) || !state.errors?.[field]) return;
    setCleared({ state, fields: [...clearedFields, field] });
  }

  const shown: PublishState['errors'] = enabled && state.errors
    ? Object.fromEntries(
        Object.entries(state.errors).filter(([field]) => !clearedFields.includes(field as PublishField)),
      )
    : state.errors;
  const remaining = Boolean(shown && Object.keys(shown).length);
  const fromFields = Boolean(state.errors && Object.keys(state.errors).length);
  // The top alert summarises field errors, so it goes once they're all fixed.
  // Other form errors (for example a failed save) always stay.
  const showFormError = Boolean(state.formError) && (!enabled || !fromFields || remaining);

  return { errors: shown, clear, showFormError };
}
```

**`components/publish/publish-form.tsx`:**

1. Call `const { errors, clear, showFormError } = useLiveErrors(state, variant === 'test');` right after `useActionState`.
2. Show each field's error from `errors` (for example `errors?.title`) instead of `state.errors`.
3. Show the top `<Alert variant="destructive">` with `state.formError` only when `showFormError` is true.
4. Call `clear(field)` whenever that field's value changes, alongside what the field already does:
   - Title, Description and Tags inputs: in `onChange`, `clear('title')`, `clear('description')`, `clear('tags')`.
   - Stack select: in `onValueChange`, after `setStack(value)`, `clear('stack')`.
   - Skill content textarea: in `onChange`, `clear('content')`.
5. Nothing else changes: labels, help text, layout, submission through `onSubmit`, hidden inputs, the paywall and the draft restore all stay as they are.

## Checks (before the commit)

- `git diff HEAD --stat` shows only `components/publish/use-live-errors.ts` and `components/publish/publish-form.tsx`. `lib/analytics/events.ts`, `lib/validation.ts` and `app/publish/actions.ts` are unchanged.
- `npx tsc --noEmit`, `npm run lint` and `npm run build` pass. (The hook uses no effect, so the React hooks lint rules pass.)
- On the dev server, with the two test users from Step 18 (one in each variant):
  - **Control:** submit an empty form, then type a title. The title error **stays** until you submit again, exactly as before.
  - **Test:** submit an empty form (5 field errors and the top alert). Type a title: its error disappears straight away. Choose a stack: its error disappears. Fix every field: the top alert disappears too. Submit: the skill publishes.
- Both variants still send `publish_started` and `skill_published` with the right `variant`.

When every check passes, append the memory block below and commit as `step 19: the fix`. Cohort B comes after this commit, because it needs the fix deployed.

## Run the experiment (after the commit)

1. **Push, tag and confirm the deploy** (the user, rule 11): `git push origin main`, `git tag step-19`, `git push origin step-19`. Wait until Vercel shows the new deployment as Ready **and** its commit is `step 19: the fix`. Then, on the live site, open `/publish` as a test user in the `test` variant, submit an empty form and type a title: the title error must disappear. If it doesn't, the live site is still serving the old form, and a cohort would measure nothing.
2. **Restart the experiment's clock.** In PostHog, reset the `publish-flow-v2` experiment (or move its start date to now), so exposures from testing don't count. Only Cohort B should be in the result.
3. **Release Cohort B: builders only, and enough of them.** The experiment compares control and test *inside* Cohort B; Cohort A was the baseline that showed what to fix, not part of the experiment. Only builders open the publish form, so other personas add cost and nothing else. Decide the sample size before you run:

   | Run | Command | Builders | Per variant |
   | --- | --- | --- | --- |
   | Rehearsal | `--agents=160 --only=builder` | 40 | about 20 |
   | Recorded video | `--agents=320 --only=builder` | 80 | about 40 |

   ```bash
   node swarm/cleanup.mjs --yes
   node swarm/run.mjs --cohort=B --agents=320 --only=builder --spread-minutes=30 --url=<deployed URL>
   ```

   Even 40 per variant only detects a large difference reliably (for example 20% against 50%), so "inconclusive, keep testing" is a possible and honest outcome.
4. **Read the result** in PostHog (the experiment, or through the PostHog MCP server): `skill_published` divided by `publish_started` for control and for test, and whether the difference is significant.
5. **Record the decision** as a new row in `DECISIONS.md`: the date, what you'll do (ship the change to everyone, keep testing, or drop it) and the numbers behind it. An inconclusive result is a valid result: write it down as such. Commit as `decision: publish-flow-v2 result`.

`DECISIONS.md` should already have the row recording why this fix was chosen (added after Cohort A, before Step 18). If it's missing, add it first:

```text
| <date> | Fix: clear each field's error when its value changes (test variant of publish-flow-v2) | Cohort A: few builders published; replays show builders re-fixing fields that were already correct because the old error stayed on screen |
```

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**, before the `step 19: the fix` commit:

```md
## After step 19
- publish-flow-v2 test variant: a field's error clears as soon as its value changes (components/publish/use-live-errors.ts, no effect). The control keeps errors until the next submit. No new events.
- The experiment's result is recorded in DECISIONS.md once Cohort B (builders only, sized for the experiment) has run against the deployed fix.
```

## Finish this step

1. The agent commits the fix as `step 19: the fix` when the checks pass. Review it with `git show --stat HEAD`.
2. Tag and deploy: `git tag step-19 && git push origin main --tags`.
3. After Cohort B, the agent commits the result row as `decision: publish-flow-v2 result`.