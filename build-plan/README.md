# Hive swarm

AI agents that use the deployed Hive app in real browsers, so PostHog records real sessions, events and replays. Each agent gets a persona, a goal and a patience limit, never a click path. Success is checked against evidence (Supabase rows, or what the browser showed), never against what the agent claims.

## Setup

```bash
npm install -D playwright @clerk/testing
npx playwright install chromium
cp swarm/.env.example swarm/.env      # then fill in SWARM_MODEL and your API key
```

- **Choose the model:** use any LLM API you have a key for. On its pricing page, pick the cheapest model that supports **structured outputs** or **JSON mode**, set `SWARM_MODEL` in `swarm/.env`, and add its price to `swarm/prices.json` so costs are reported.

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
# 10-agent test batch: always do this first with a new model
node swarm/run.mjs --url=https://your-app.vercel.app --cohort=A --agents=10

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
| `--seed` | 42 | Same seed, same personas |
| `--headed` | off | Show the browsers (for debugging) |

Free dry run without any API key: `--model=mock:random`.

## Is the model good enough?

After the 10-agent batch, read the **Reliability** line and `swarm/results/summary.json`:

- `crashed` should be 0, and `parseErrors` close to 0.
- If many agents give up early or fail at simple goals (installing a skill), move up one model tier and run the batch again.
- Read a few `thought` lines in `swarm/results/agents.jsonl`: they should sound like a person trying to get something done.

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
| `prices.json` | Prices per million tokens. Never guessed |
| `state/`, `results/` | Saved sessions and run results. Both git-ignored |