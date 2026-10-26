# Decision log

One entry per decision: the date, the decision and the evidence behind it.

| Date | Decision | Evidence |
| --- | --- | --- |
| 2026-10-26 | Swarm model: `openai:gpt-6-luna` at reasoning effort `low` | 10-agent batch: 0 crashed, 0 unclear replies, $0.0038 per agent; consumers 67%, builder 100%, curators 100% |
| 2026-10-26 | Fix: clear each field's error when its value changes (test variant of publish-flow-v2) | Cohort A: 1 of 13 builders published; replays show builders re-fixing fields that were already correct because the old error stayed on screen |
