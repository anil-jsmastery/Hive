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
import { useEffect, useState } from 'react';
import type { PublishField, PublishState } from '@/app/publish/actions';

// publish-flow-v2, test variant: a field's error disappears as soon as its value
// changes, instead of staying on screen until the next submit. With enabled =
// false (the control), it returns the server's errors unchanged.
export function useLiveErrors(state: PublishState, enabled: boolean) {
  const [errors, setErrors] = useState<PublishState['errors']>(state.errors);

  // Every submit returns a new state: start again from the server's errors.
  useEffect(() => {
    setErrors(state.errors);
  }, [state]);

  function clear(field: PublishField) {
    if (!enabled) return;
    setErrors((prev) => {
      if (!prev?.[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  const shown = enabled ? errors : state.errors;
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

## Run the experiment

The code above ships the fix to half of all builders (the `test` variant). Cohort B shows whether it works.

1. Deploy, and confirm the deployment is live.
2. Release Cohort B with **the same size and spread as Cohort A**, so the two are comparable:
   ```bash
   node swarm/cleanup.mjs --yes
   node swarm/run.mjs --cohort=B --agents=<Cohort A's size> --spread-minutes=<Cohort A's spread> --url=<deployed URL>
   ```
3. Read the result in PostHog (the experiment on `publish-flow-v2`, or through the PostHog MCP server): `skill_published` divided by `publish_started` for control and for test, and whether the difference is significant.
4. Add the decision to `DECISIONS.md` as a new row: the date, what you'll do (ship the change to everyone, keep testing, or drop it), and the numbers behind it. An inconclusive result is a valid result: write it down as such.

DECISIONS.md should already have the row recording why this fix was chosen (added after Cohort A, before Step 18). If it's missing, add it first:

```text
| <date> | Fix: clear each field's error when its value changes (test variant of publish-flow-v2) | Cohort A: few builders published; replays show builders re-fixing fields that were already correct because the old error stayed on screen |
```

## Checks

- `git diff step-18 --stat` shows only `components/publish/use-live-errors.ts`, `components/publish/publish-form.tsx` and `MEMORY.md`. `lib/analytics/events.ts`, `lib/validation.ts` and `app/publish/actions.ts` are unchanged.
- **Control** (a test user in the `control` variant): submit an empty form, then type a title. The title error **stays** until you submit again, exactly as before.
- **Test** (a test user in the `test` variant):
  - Submit an empty form: 5 field errors and the top alert, as before.
  - Type a title: the title error disappears straight away.
  - Choose a stack: the stack error disappears straight away.
  - Fix every field: the top alert disappears too.
  - Submit: the skill publishes.
- Both variants still send `publish_started` and `skill_published` with the right `variant`.
- After Cohort B: the experiment shows exposures in both variants, and `DECISIONS.md` has the new row with the result.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 19
- publish-flow-v2 test variant: a field's error clears as soon as its value changes (components/publish/use-live-errors.ts). The control keeps errors until the next submit. No new events.
- Cohort B ran against the experiment with the same size and spread as Cohort A. The result and the decision are in DECISIONS.md.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 19: the fix` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md` and `DECISIONS.md`, should appear.
2. Tag the checkpoint: `git tag step-19`.