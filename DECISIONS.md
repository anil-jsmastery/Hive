# Decision log

One entry per decision: the date, the decision and the evidence behind it.

| Date | Decision | Evidence |
| --- | --- | --- |
| 2026-10-26 | Swarm model: `openai:gpt-6-luna` at reasoning effort `low` | 10-agent batch: 0 crashed, 0 unclear replies, $0.0038 per agent; consumers 67%, builder 100%, curators 100% |
| 2026-10-26 | Fix: clear each field's error when its value changes (test variant of publish-flow-v2) | Cohort A: 1 of 13 builders published; replays show builders re-fixing fields that were already correct because the old error stayed on screen |
| 2026-10-26 | publish-flow-v2: inconclusive. Keep testing; don't ship the test variant yet | Cohort B (40 builders, experiment restarted 12:38 UTC): skill_published ÷ publish_started, per person, control 11/19 (58%), test 6/19 (32%); Fisher's exact p = 0.19, not significant (PostHog: not enough exposures for a result). Most stuck builders in both variants failed on the stack dropdown (swarm actions failing while it was open), not on stale errors |
| 2026-10-26 | publish-flow-v2 (rerun with the swarm dropdown fix): inconclusive. Keep testing; don't ship the test variant yet | Cohort B rerun (40 builders, experiment restarted 13:14 UTC): skill_published ÷ publish_started, per person, control 9/20 (45%), test 10/19 (53%); Fisher's exact p = 0.75, not significant (PostHog: control 9/20, test 10/19, not enough exposures for a result). Plain builders only: control 9/14, test 10/10 (p = 0.053); all 5 stuck control builders had 0 failed actions and kept re-picking Any while the old stack error stayed on screen. Private and team builders published 0 in both variants (paywall, team flow) |
