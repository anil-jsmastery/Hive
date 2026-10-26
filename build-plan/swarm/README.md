# Hive swarm

AI agents that use the deployed Hive app in real browsers, so PostHog records real sessions, events and replays. Each agent gets a persona, a goal and a patience limit, never a click path. Success is checked against evidence (Supabase rows, or what the browser showed), never against what the agent claims.

## Setup

```bash
npm install -D playwright @clerk/testing
npx playwright install chromium
cp swarm/.env.example swarm/.env      # then fill in SWARM_MODEL and your API key
```

- **Choose the model:** the course uses `openai:gpt-6-luna` (GPT-6 Luna, OpenAI's cheapest structured-output model, already in `prices.json`) at reasoning effort `low`. You can use any LLM API you have a key for. On its pricing page, pick the cheapest model that supports **structured outputs** or **JSON mode**, set `SWARM_MODEL` in `swarm/.env`, and add its price to `swarm/prices.json` so costs are reported.

| Provider | `SWARM_MODEL` | Key in `swarm/.env` |
| --- | --- | --- |
| OpenAI | `openai:<model id>` | `SWARM_OPENAI_API_KEY` |
| Anthropic (Claude) | `anthropic:<model id>` | `SWARM_ANTHROPIC_API_KEY` |
| Google Gemini | `gemini:<model id>` | `SWARM_GEMINI_API_KEY` |
| DeepSeek | `deepseek:<model id>` | `SWARM_DEEPSEEK_API_KEY` |
| Moonshot (Kimi) | `moonshot:<model id>` | `SWARM_MOONSHOT_API_KEY` |
| OpenRouter (hundreds of models, one key) | `openrouter:<vendor/model>` | `SWARM_OPENROUTER_API_KEY` |
| Any OpenAI-compatible API (Groq, Together, Mistral, xAI, Fireworks…) | `compat:<model id>` | `SWARM_API_KEY`, plus `SWARM_BASE_URL` (the base URL from the provider's docs) |

  The harness asks every OpenAI-compatible provider for a strict JSON schema first. If a model rejects that, it falls back to JSON mode, then to reading the JSON from plain text, once per run.
- **Keys stay in `swarm/.env`**, with a `SWARM_` prefix. Never export them in the terminal where your coding agent runs.
- **The harness also reads `.env.local`** (project root) for the Clerk keys (testing tokens let agents past Clerk's bot protection) and the Supabase URL and secret key (read-only success checks).

## Run

```bash
# 10-agent test batch: always do this first with a new model.
# Test batches use cohort T, so they never mix with Cohort A's data.
node swarm/run.mjs --url=https://your-app.vercel.app --cohort=T --agents=10

# Cohort A: 300 agents arriving over 90 minutes
node swarm/run.mjs --url=https://your-app.vercel.app --cohort=A --agents=300 --spread-minutes=90

# Return wave: about half of Cohort A comes back, using their saved sessions
node swarm/run.mjs --url=https://your-app.vercel.app --return-wave=A --cohort-size=300

# Cohort B (after the fix ships behind the flag)
node swarm/run.mjs --url=https://your-app.vercel.app --cohort=B --agents=300 --spread-minutes=90
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--url` | required | The deployed Hive URL |
| `--cohort` | `A` | Cohort name, sent to PostHog as `cohort: swarm-<name>` |
| `--agents` | 10 | Number of agents |
| `--concurrency` | 10 | Browsers at once. Lower it if you hit rate limits or your laptop slows down |
| `--spread-minutes` | 0 | Spread arrivals over this many minutes |
| `--max-usd` | 10 | Stop starting agents once this much has been spent |
| `--model` | `SWARM_MODEL` | Override the model for one run, as `provider:model` |
| `--return-wave` | off | Re-run about half of a cohort from saved sessions, starting at `/dashboard` |
| `--cohort-size` | 300 | With `--return-wave`: how many agents the original cohort had |
| `--only` | all | Run only some personas, by type or variant, for example `--only=builder` or `--only=builder-private,builder-team` |
| `--seed` | 42 | Same seed, same personas |
| `--headed` | off | Show the browsers (for debugging) |

Free dry run without any API key: `--model=mock:random`.

## Clean up between runs

Each run creates real Clerk accounts (and, for team builders, teams). Remove them before the next run:

```bash
node swarm/cleanup.mjs          # shows what would be deleted
node swarm/cleanup.mjs --yes    # deletes it
```

It only touches accounts with `agent-<cohort>-<id>+clerk_test@example.com` emails and the teams they created. Their Supabase profiles are deleted too, which removes their skills, stars, comments and notifications, and saved sessions in `swarm/state/` are cleared. PostHog keeps earlier events: filter them out by `cohort`, or use a fresh project.

## How agents stay visible to PostHog

Headless Chrome announces itself (`navigator.webdriver` and a "HeadlessChrome" browser brand), and posthog-js drops those visitors as bots before any event is sent. The harness launches Chrome without the automation flag and reports a normal browser brand, so the sessions are recorded. The agents aren't hidden: every event carries `cohort: swarm-<name>`, and the test-account filter removes them in one click. Each browser also gets clipboard permission, because "Install" copies a command.

## Retesting one part of the product

To check a fix cheaply, run only the personas it affects. With `--agents=100 --only=builder` you get Cohort T's 25 builders (15 public, 5 private, 5 team) for about $0.15:

```bash
node swarm/run.mjs --url=https://your-app.vercel.app --cohort=T --agents=100 --only=builder
```

## Is the model good enough?

After the 10-agent batch, read the **Reliability** line and `swarm/results/summary.json`:

- `crashed` should be 0, and `parseErrors` close to 0.
- If many agents give up early or fail at simple goals (installing a skill), move up one model tier and run the batch again.
- Read a few `thought` lines in `swarm/results/agents.jsonl`: they should sound like a person trying to get something done.
- Signing up takes about 12 steps, so step limits (30 for consumers, 36 to 60 for builders) leave room for the goal itself. If agents still run out of steps right before succeeding, that's friction worth looking at in the product, not a reason to raise the limits further.

## Personas

| Persona | Share | Goal | Success means |
| --- | --- | --- | --- |
| consumer | 40% | Find a skill for a topic and install it (1 in 10 start from a shared link) | The "Install command copied" toast appeared |
| builder | 25% | Publish their own skill (1 in 5 want it private, 1 in 5 want a private team skill) | A matching row in `skills` |
| curator | 15% | Star a skill and leave a helpful comment | A row in `comments` |
| mobile | 15% | Same as consumer, on a phone, impatient | The toast appeared |
| lurker | 5% | Read about one skill and leave | Opened a skill page |

Agents sign up with `agent-<cohort>-<id>+clerk_test@example.com` and code `424242`, which only works in a Clerk development instance. Agents who decide to pay use the test card `4242 4242 4242 4242`.

## Files

| File | What it does |
| --- | --- |
| `run.mjs` | The runner: personas, parallel browsers, spread arrivals, saved sessions, summary |
| `personas.mjs` | The persona list for a cohort |
| `observe.mjs` | Turns the page (and payment iframes) into text and performs the agent's actions |
| `providers.mjs` | One function for every model provider, with structured output and retries |
| `evidence.mjs` | Read-only success checks in Supabase |
| `cleanup.mjs` | Deletes swarm test accounts, their teams and their data |
| `prices.json` | Prices per million tokens. Never guessed |
| `state/`, `results/` | Saved sessions and run results. Both git-ignored |
