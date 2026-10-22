# Hive build plan (Next.js, shadcn/ui, Clerk, Supabase, PostHog)

One file per step. Run them in order with your coding agent. Each step builds one small piece of Hive, teaches one product engineering idea, updates the project memory, and ends with a commit you tag as a checkpoint.

## What's in this folder

| File | What it is |
| --- | --- |
| `START_HERE.md` | How to start from an empty folder, and the first prompt |
| `README.md` | This guide |
| `CONTRACT.md` | Locked decisions: routes, data model, plans, events, environment variables. Read before every step |
| `DESIGN.md` | The design system: tokens, fonts, layout, components, Clerk theming, UI text rules |
| `00-…` to `19-…` | The steps, in order |

## How this plan keeps builds identical

1. **Same starting point.** Step 00 starts from a folder holding only `build-plan/` and `.claude/settings.json`, pins every package (`save-exact`, a committed `package-lock.json`) and uses a fixed shadcn preset code.
2. **Same contracts.** Everything that must match is written out in full and marked **VERBATIM**: SQL migrations, analytics helpers, Supabase clients, validation rules, design tokens and every piece of UI text. Agents copy these and never rewrite them.
3. **Same memory.** `CLAUDE.md` and `AGENTS.md` load the rules, the contract, the design system and `MEMORY.md` into every fresh session. Each step ends by appending a VERBATIM block to `MEMORY.md`. Agents never write their own notes.
4. **Same dashboards.** Steps that need Clerk, Supabase or PostHog dashboard settings list them as an exact checklist. Wrong settings produce a different app even with identical code.
5. **Checkpoints.** Tag every finished step (`git tag step-07`). If a step goes wrong, `git reset --hard` to the previous tag and run it again in a new conversation.

## The prompt (same for every step)

Start a **fresh agent session** for each step (in Claude Code, `/clear`), then paste this, changing only the file name:

```text
Read build-plan/07-landing.md. Implement that step exactly as written: every file
path, component name, label, piece of copy and rule. Copy every block marked
VERBATIM without changes. Use the Clerk, Supabase and PostHog MCP servers and
skills only for what this step asks. Do not start any other step, do not add or
upgrade packages, and do not change files from earlier steps unless this step
says so. When you finish, run this step's checks, report each one as pass or
fail, append this step's memory block to MEMORY.md, and commit if every check
passes.
```

Step 00 has its own first prompt, in `START_HERE.md`. The rules, contract, design system and memory load automatically through `CLAUDE.md` (Claude Code) or `AGENTS.md` (Codex, Cursor and others).

## The steps

| # | File | Product lesson | Checkpoint |
| --- | --- | --- | --- |
| 00 | `00-project-setup.md` | Set up a project everyone can reproduce exactly | `step-00` |
| 01 | `01-product-docs.md` | Project vs product: define the outcome and the tracking plan before code | `step-01` |
| 02 | `02-design-system.md` | A small, consistent design system | `step-02` |
| 03 | `03-database.md` | Model only the data the product needs, and secure it with RLS | `step-03` |
| 04 | `04-seed-data.md` | Never launch to an empty shelf | `step-04` |
| 05 | `05-posthog-foundation.md` | Instrument on purpose: a typed tracking plan instead of autocapture | `step-05` |
| 06 | `06-auth-and-profiles.md` | Identity: link anonymous visitors to real accounts | `step-06` |
| 07 | `07-landing.md` | One page, one job: does the landing page convert? | `step-07` |
| 08 | `08-explore-search.md` | Search as the voice of the user | `step-08` |
| 09 | `09-skill-page.md` | The value moment: tracking installs on the server | `step-09` |
| 10 | `10-fork-comments.md` | Deep engagement, and the notifications that bring people back | `step-10` |
| 11 | `11-publish.md` | Activation, and where builders give up | `step-11` |
| 12 | `12-profiles-follow.md` | Not everything needs tracking | `step-12` |
| 13 | `13-dashboard-notifications.md` | Retention loops | `step-13` |
| 14 | `14-organizations.md` | B2B analytics: measure teams, not just people | `step-14` |
| 15 | `15-deploy-and-settings.md` | Verify your data before users arrive | `step-15` |
| 16 | `16-billing.md` | Would someone pay? The paywall-to-subscription funnel | `step-16` |
| 17 | `17-swarm.md` | Rehearse launch day with synthetic users | `step-17` |
| 18 | `18-feature-flag.md` | Ship reversibly: server-side flags and experiments | `step-18` |
| 19 | `19-the-fix.md` | Decide with evidence | `step-19` |

## Files you add along the way

| What | Step | Where it goes |
| --- | --- | --- |
| The 30 seed skill files (provided with this plan) | 04 | `seed/skills/` |
| The swarm harness (provided with this plan) | 17 | `swarm/` |
| A model API key (OpenAI, Anthropic, Google, DeepSeek or Moonshot) | 17 | `swarm/.env` |
| `19-the-fix.md` | 19 | `build-plan/`, once Cohort A's data has been read: the fix depends on what it shows |

Steps 03, 05, 06 and 16 depend most on exact library and dashboard behaviour. The agent rules say to stop and report instead of improvising when something doesn't match.
