# Step 19: The fix (written after Cohort A)

| | |
| --- | --- |
| Starts from | `step-18` |
| Ends at | `step-19` |
| What you'll learn | Decide with evidence |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 18 is committed and tagged `step-18`. If this step goes wrong, go back with `git reset --hard step-18` and run it again in a new conversation.

This step depends on what Cohort A's data shows, so it's written after that data is read. It follows the same format as every other step (exact files, UI text, rules, checks and a memory block), so everyone builds the same fix.

Rules for the fix:

- It changes only what `variant === 'test'` renders. The control stays exactly as built in Steps 11 and 16.
- It adds no new events. The experiment reads `publish_started` and `skill_published`.
- The decision and its evidence go into `DECISIONS.md` as a new row, VERBATIM.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 19
- (Written after Cohort A.)
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 19: the fix` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-19`.
