# Step 17: The swarm harness

| | |
| --- | --- |
| Starts from | `step-16` |
| Ends at | `step-17` |
| What you'll learn | Rehearse launch day with synthetic users |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 16 is committed and tagged `step-16`. If this step goes wrong, go back with `git reset --hard step-16` and run it again in a new conversation.

**Goal:** the swarm harness that sends AI agents through the deployed Hive, each in its own real browser, signing up through Clerk like a person would.

**The harness is copied, not generated.** Copy the tested `swarm/` folder provided with this plan into the project, rather than asking an agent to write it. Agent behaviour has to be identical every time the swarm runs.

## Install

```bash
npm install -D playwright @clerk/testing
npx playwright install chromium
```

## Files (provided with this plan; don't regenerate them)

| File | What it does |
| --- | --- |
| `swarm/run.mjs` | Runs agents in parallel (`--concurrency`), spreads arrivals (`--spread-minutes`), saves each agent's browser state, writes `swarm/results/summary.json` |
| `swarm/personas.mjs` | Builds the persona list for a cohort |
| `swarm/providers.mjs` | One function for every model provider, returning real token usage |
| `swarm/prices.json` | Prices per million tokens. Never guessed |
| `swarm/state/` | Saved browser state per agent, for the return wave |
| `swarm/.env` | The swarm's model API keys (`SWARM_*`). Add both `swarm/.env` and `swarm/state/` to `.gitignore` |

## Rules the harness follows

| Area | Rule |
| --- | --- |
| Target | `--url=` the deployed Hive URL |
| Start URL | `/?swarm={cohort}&persona={type}&model={model}&utm_source={source}&utm_medium=swarm&utm_campaign=launch-rehearsal`. 10% of consumers start at `/s/{random seed slug}?ref=share` with the same parameters |
| Clerk | Calls `clerkSetup()` once and `setupClerkTestingToken({ page })` on every page, so Clerk's bot protection lets agents through. Requires the development instance |
| Accounts | Each agent's prompt includes: "If you need an account, sign up with email agent-{cohort}-{id}+clerk_test@example.com, username {name}-{cohort}{id}, password {random 16 characters}. The verification code is 424242." |
| Payments | Agents who decide to pay are told: "Use card 4242 4242 4242 4242, any future expiry date and any CVC." (development gateway only) |
| Personas | consumer 40%, builder 25%, curator 15%, mobile 15% (390×844 viewport, phone user agent), lurker 5%. Of the builders, one in five wants a **private** skill for themselves and one in five wants a private skill **for their company's team** |
| Goals | Agents get a goal and a patience limit, never a click path |
| Arrivals | Agents start at random times across `--spread-minutes` (default 90), never all at once |
| Return wave | `--return-wave=A` reloads saved state for about half of Cohort A, starts on `/dashboard` with the goal "See what happened to your skills and react to anything interesting." |
| Ground truth | Success comes from evidence, never from what the agent claims: the "Install command copied" toast seen in the page, or rows in Supabase (skills, comments, stars) authored by the agent's profile |
| Browser identity | A normal desktop or phone user agent, never headless Chrome's default, so PostHog doesn't drop the sessions as bots |

## Models (paid APIs only)

Local models are too slow for a swarm, so the harness uses a paid API. Use whichever provider you have a key for, and record your choice in `DECISIONS.md`.

| Provider | Model spec | Key in `swarm/.env` | Watch out for |
| --- | --- | --- | --- |
| OpenAI | `openai:<model>` | `SWARM_OPENAI_API_KEY` | New accounts start with low rate limits. Check your usage tier |
| Anthropic (Claude) | `anthropic:<model>`, for example `anthropic:claude-haiku-5-5` | `SWARM_ANTHROPIC_API_KEY` | Tier 1 allows 50 requests a minute per model. Use Tier 2 or higher for a 300-agent cohort |
| Google Gemini | `gemini:<model>` | `SWARM_GEMINI_API_KEY` | Use the paid tier for cohorts. Free-tier daily limits are too low |
| DeepSeek | `deepseek:deepseek-v4-flash` | `SWARM_DEEPSEEK_API_KEY` | Thinking mode is on by default; turn it off. Check the price on the day you run |
| Moonshot (Kimi) | `moonshot:<model>`, for example `moonshot:kimi-k2.6` | `SWARM_MOONSHOT_API_KEY` | New accounts allow 1 request at a time and 3 a minute. Fine for a 5-agent test, too slow for a cohort |

**Rules for every provider:**

- Turn thinking or reasoning off, or set it to the lowest level. It makes each step slower and more expensive and can break the JSON reply.
- Prices in `swarm/prices.json` come from the provider's own pricing page, by exact model id. Never guess. A model without a price still reports tokens, shown as "no price".
- Keys live only in `swarm/.env` (git-ignored), always with the `SWARM_` prefix. Never export them in the terminal where your coding agent runs: if `ANTHROPIC_API_KEY` is set there, Claude Code bills that API key instead of your Claude plan.
- Match `--concurrency` to your rate limit:

| Account | `--concurrency` |
| --- | --- |
| Claude Tier 1, or a new OpenAI account | 10–15 |
| Claude Tier 2+, established OpenAI or Gemini paid tier, DeepSeek | 20–40 |
| Moonshot (new account) | 1 |

Results differ between models. That's expected: the code must match, the data doesn't have to.

## Honesty rules

- The first minute says the users are AI agents.
- Agents get goals, never click paths. Never tune a persona to fail at a specific step.
- Persona prompts are public in the repo.

## Checks

- A 10-agent test batch: 10 Clerk users exist with `+clerk_test` emails, PostHog shows events with `cohort: swarm-A`, nothing is filtered as a bot, and each agent has a session recording.
- `swarm/results/summary.json` shows cost per agent and success rate per model.
- Clean up test users between dry runs (Clerk Dashboard, or the Clerk CLI via the Clerk skill).

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 17
- swarm/ harness (copied from tag step-17): Playwright agents with personas, Clerk testing tokens and +clerk_test accounts, test card for payments, spread arrivals, saved state for the return wave, evidence-based success.
- Models: paid APIs only (OpenAI, Anthropic, Gemini, DeepSeek, Moonshot), keys as SWARM_* in swarm/.env (git-ignored, never in the coding agent's shell), thinking off. The main-run model is recorded in DECISIONS.md.
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 17: swarm` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-17`.

**Next:** `18-feature-flag.md`
