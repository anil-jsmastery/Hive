# Decision log

One entry per decision: the date, the decision and the evidence behind it.

| Date | Decision | Evidence |
| --- | --- | --- |
| 2026-10-26 | Swarm model: `openai:gpt-6-luna` at reasoning effort `low` | 10-agent batch: 0 crashed, 0 unclear replies, $0.0038 per agent; consumers 67%, builder 100%, curators 100% |
| 2026-10-26 | Fix: clear each field's error when its value changes (test variant of publish-flow-v2) | Cohort A: 1 of 13 builders published; replays show builders re-fixing fields that were already correct because the old error stayed on screen |
| 2026-10-26 | publish-flow-v2: inconclusive. Keep testing; don't ship the test variant yet | Cohort B (40 builders, experiment restarted 12:38 UTC): skill_published ÷ publish_started, per person, control 11/19 (58%), test 6/19 (32%); Fisher's exact p = 0.19, not significant (PostHog: not enough exposures for a result). Most stuck builders in both variants failed on the stack dropdown (swarm actions failing while it was open), not on stale errors |
