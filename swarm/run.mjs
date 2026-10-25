// Hive swarm: AI agents using the deployed app in real browsers.
//
//   node swarm/run.mjs --url=https://your-app.vercel.app --cohort=A --agents=10
//   node swarm/run.mjs --url=... --cohort=A --agents=300 --spread-minutes=90
//   node swarm/run.mjs --url=... --return-wave=A --cohort-size=300
//
// Prints one line per agent. Details go to swarm/results/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { chromium } from 'playwright';
import { buildPersonas, returnWave, seeded, TEST_CARD } from './personas.mjs';
import { observe, act } from './observe.mjs';
import { callModel, checkSpec, priceOf, splitSpec } from './providers.mjs';
import { evidenceClient, succeeded } from './evidence.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(HERE, '..', '.env.local'), quiet: true });
config({ path: path.join(HERE, '.env'), override: true, quiet: true });

// ---------- arguments ----------
const arg = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || 'true'];
}));
const URL_BASE = (arg.url || '').replace(/\/$/, '');
const RETURN_OF = arg['return-wave'] || null;
const COHORT = RETURN_OF || arg.cohort || 'A';
const AGENTS = Number(arg.agents || 10);
const CONCURRENCY = Number(arg.concurrency || 10);
const SPREAD_MIN = Number(arg['spread-minutes'] || 0);
const MAX_USD = Number(arg['max-usd'] || 10);
const SEED = Number(arg.seed || 42);
const MODEL = arg.model || process.env.SWARM_MODEL || '';
const HEADED = arg.headed === 'true';
const STATE_DIR = path.join(HERE, 'state');
const OUT_DIR = path.join(HERE, 'results');

const fail = (msg) => { console.error(msg); process.exit(1); };
if (!URL_BASE) fail('Pass --url=<your deployed Hive URL>.');
const specProblem = checkSpec(MODEL);
if (specProblem) fail(specProblem);

// ---------- personas ----------
let personas;
if (RETURN_OF) {
  const cohortAgents = buildPersonas({ n: Number(arg['cohort-size'] || 300), cohort: RETURN_OF, seed: SEED })
    .filter((p) => fs.existsSync(path.join(STATE_DIR, `${p.cohort}-${p.id}.json`)));
  personas = returnWave(cohortAgents);
  if (!personas.length) fail(`No saved sessions for cohort ${RETURN_OF} in swarm/state/. Run that cohort first.`);
} else {
  personas = buildPersonas({ n: AGENTS, cohort: COHORT, seed: SEED });
}

// Spread arrivals: each agent gets a start time within the window, never all at once.
const rand = seeded(SEED + 7);
const jobs = personas
  .map((p) => ({ p, startAfterMs: SPREAD_MIN > 0 ? Math.floor(rand() * SPREAD_MIN * 60_000) : 0 }))
  .sort((a, b) => a.startAfterMs - b.startAfterMs);

// ---------- the prompt ----------
const SYSTEM = `You are a real person using Hive, a website where developers find, install and publish
"skills" (Markdown instructions for AI coding agents). Stay in character as the persona you are given.
You see a text snapshot of the current page. Interactive elements have ids like [0:12]; elements
inside a frame (such as a payment form) have ids like [2:3].
Reply with one JSON object only, with these fields:
- thought: up to 15 words, what you think right now
- action: one of click, type, select, keyboard, press_enter, scroll, back, wait, done, give_up
- target: the element id for click, type or select, otherwise ""
- text: what to type, or the option to select, otherwise ""
Use "keyboard" to type into whatever is focused (for example a verification code).
Field values are shown up to 160 characters; a longer value also shows its total length.
If a field already holds your text, it is filled: don't type it again.
Use "done" only when your goal is truly achieved. Use "give_up" when a real person like you would leave.
Never invent element ids. Never type anything you were not given or would not know.`;

function prompt(p, obs, history, step) {
  const lines = [
    `PERSONA: ${p.name}, ${p.type}${p.mobile ? ', on a phone' : ''}. Arrived from: ${p.source}.`,
    `GOAL: ${p.goal}`,
    `IF YOU NEED AN ACCOUNT: sign up with email ${p.email}, username ${p.username}, password ${p.password}.`,
    'If asked for a verification code, it is 424242. If you already have an account, sign in with the same email and password.',
  ];
  if (p.canPay) {
    lines.push(`IF YOU DECIDE TO PAY: card ${TEST_CARD.number}, expiry ${TEST_CARD.expiry}, CVC ${TEST_CARD.cvc}, ZIP ${TEST_CARD.zip}.`);
  }
  if (p.draft) {
    lines.push('YOUR SKILL DRAFT:', `Title: ${p.draft.title}`, `Description: ${p.draft.description}`,
      `Stack: ${p.draft.stack}`, `Tags: ${p.draft.tags}`, `Content:\n${p.draft.content}`);
  }
  lines.push('', `RECENT ACTIONS:\n${history.slice(-6).join('\n') || 'none yet'}`, '',
    `PAGE: ${obs.url} | ${obs.title}`);
  if (obs.toasts) lines.push(`NOTIFICATIONS ON SCREEN: ${obs.toasts}`);
  if (obs.dialog) lines.push(`DIALOG: ${obs.dialog}`);
  if (obs.errors) lines.push(`ERRORS SHOWN: ${obs.errors}`);
  lines.push(`TEXT: ${obs.text}`, 'ELEMENTS:', obs.items.join('\n') || '(none)', '',
    `Step ${step + 1} of at most ${p.budget}.`);
  return lines.join('\n');
}

const parseAction = (t) => {
  const m = (t || '').match(/\{[\s\S]*\}/);
  try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
};

// ---------- browsers ----------
// Normal user agents: headless Chrome's default UA gets filtered out as a bot by analytics.
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

// Headless Chrome announces itself (navigator.webdriver = true, a "HeadlessChrome" brand),
// and posthog-js drops those visitors as bots before any event is sent. The agents are not
// hidden: every event carries cohort: swarm-<name>. This only stops the bot filter from
// discarding them before that tag can be seen.
function realBrowserSignals({ mobile }) {
  Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
  if (mobile) {
    // Safari on iPhone has no userAgentData.
    Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined, configurable: true });
    return;
  }
  const real = navigator.userAgentData;
  if (!real) return;
  const brands = [
    { brand: 'Chromium', version: '130' },
    { brand: 'Google Chrome', version: '130' },
    { brand: 'Not?A_Brand', version: '99' },
  ];
  const platform = real.platform || 'macOS';
  const fake = {
    brands,
    mobile: false,
    platform,
    getHighEntropyValues: (hints) => real.getHighEntropyValues(hints)
      .then((v) => ({ ...v, brands, fullVersionList: brands })),
    toJSON: () => ({ brands, mobile: false, platform }),
  };
  Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => fake, configurable: true });
}

// Clerk testing tokens let agents past Clerk's bot protection (development instances only).
let clerkTesting = null;
async function setupClerk() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.log('Clerk keys not found in .env.local: running without Clerk testing tokens.');
    return;
  }
  process.env.CLERK_PUBLISHABLE_KEY ||= process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  try {
    const mod = await import('@clerk/testing/playwright');
    await mod.clerkSetup();
    clerkTesting = mod;
  } catch (e) {
    console.log(`Clerk testing tokens unavailable (${String(e.message).slice(0, 80)}). Install @clerk/testing.`);
  }
}

function startUrl(p) {
  const u = new URL(URL_BASE + p.startPath);
  u.searchParams.set('swarm', p.cohort);
  u.searchParams.set('persona', p.variant);
  u.searchParams.set('model', splitSpec(MODEL).model);
  u.searchParams.set('utm_source', p.source);
  u.searchParams.set('utm_medium', 'swarm');
  u.searchParams.set('utm_campaign', 'launch-rehearsal');
  return u.toString();
}

// ---------- one agent ----------
let spent = 0;
let stopped = false;
const startedAtIso = new Date().toISOString();

async function runAgent(browser, p) {
  const rec = {
    id: p.id, cohort: p.cohort, type: p.type, variant: p.variant, username: p.username, success: p.success,
    model: MODEL, steps: 0, inTok: 0, outTok: 0, cost: 0, priceKnown: true, retries: 0,
    parseErrors: 0, actionErrors: 0, outcome: null, lastThought: '', trace: [],
    seen: { installToast: false, skillPage: false, dashboard: false, leftDashboardTo: false },
  };
  const t0 = Date.now();
  const statePath = path.join(STATE_DIR, `${p.cohort}-${p.id}.json`);
  let context;
  try {
    context = await browser.newContext({
      ...(p.mobile
        ? { viewport: { width: 390, height: 844 }, userAgent: MOBILE_UA, isMobile: true, hasTouch: true }
        : { viewport: { width: 1280, height: 800 }, userAgent: DESKTOP_UA }),
      ...(RETURN_OF && fs.existsSync(statePath) ? { storageState: statePath } : {}),
      // "Install" copies a command; without this permission the copy fails and no toast appears.
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    await context.addInitScript(realBrowserSignals, { mobile: p.mobile });
    const page = await context.newPage();
    if (clerkTesting) await clerkTesting.setupClerkTestingToken({ page });
    await page.goto(startUrl(p), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1200);

    const history = [];
    for (let step = 0; step < p.budget; step++) {
      if (stopped) { rec.outcome = 'budget_stop'; break; }
      const obs = await observe(page);
      if (obs.toasts.includes('Install command copied')) rec.seen.installToast = true;
      if (obs.url.startsWith('/s/')) rec.seen.skillPage = true;
      if (obs.url.startsWith('/dashboard')) rec.seen.dashboard = true;
      else if (rec.seen.dashboard && (obs.url.startsWith('/s/') || obs.url.startsWith('/u/'))) rec.seen.leftDashboardTo = true;

      const r = await callModel(MODEL, SYSTEM, prompt(p, obs, history, step));
      rec.steps++;
      rec.inTok += r.inTok;
      rec.outTok += r.outTok;
      rec.retries += r.retries || 0;
      const c = priceOf(MODEL, r.inTok, r.outTok);
      if (c === null) rec.priceKnown = false; else { rec.cost += c; spent += c; }
      if (spent >= MAX_USD) stopped = true;

      const a = parseAction(r.text);
      if (!a || !a.action) { rec.parseErrors++; history.push(`${step + 1}. (my reply was unclear)`); continue; }
      rec.lastThought = a.thought || '';
      rec.trace.push({ url: obs.url, action: a.action, target: a.target, text: a.action === 'type' && /password/i.test(a.target) ? '••••' : a.text, thought: a.thought });
      if (a.action === 'done' || a.action === 'give_up') { rec.outcome = a.action; break; }
      try {
        await act(page, obs.frames, a);
        const shown = a.text && a.action !== 'select' ? ` "${String(a.text).slice(0, 30)}"` : '';
        history.push(`${step + 1}. ${a.action}${a.target ? ` [${a.target}]` : ''}${shown} (${a.thought || ''})`);
      } catch {
        rec.actionErrors++;
        history.push(`${step + 1}. ${a.action} [${a.target}] did not work`);
      }
      // Human-ish pacing, so session replays are watchable.
      await page.waitForTimeout(400 + Math.floor(Math.random() * 800));
    }
    rec.outcome ||= 'out_of_steps';
    if (!RETURN_OF) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      await context.storageState({ path: statePath });
    }
  } catch (e) {
    rec.outcome = 'crashed';
    rec.error = String(e.message || e).slice(0, 200);
  } finally {
    await context?.close().catch(() => {});
  }
  rec.seconds = Math.round((Date.now() - t0) / 1000);
  fs.appendFileSync(path.join(OUT_DIR, 'agents.jsonl'), `${JSON.stringify(rec)}\n`);
  console.log(`#${p.id} ${p.variant.padEnd(16)} ${rec.outcome.padEnd(12)} ${String(rec.steps).padStart(2)} steps  ${rec.priceKnown ? `$${rec.cost.toFixed(4)}` : 'no price'}${rec.error ? `  (${rec.error.slice(0, 60)})` : ''}`);
  return rec;
}

// ---------- run ----------
const reachable = await fetch(URL_BASE, { method: 'GET' }).then((r) => r.status < 500).catch(() => false);
if (!reachable) fail(`Can't reach ${URL_BASE}. Check the URL and that the site is deployed.`);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'agents.jsonl'), '');
await setupClerk();
console.log(`Swarm ${RETURN_OF ? `return wave of ${RETURN_OF}` : `cohort ${COHORT}`}: ${jobs.length} agents, ${CONCURRENCY} at a time, spread over ${SPREAD_MIN} min, model ${MODEL}, budget cap $${MAX_USD}`);

const browser = await chromium.launch({
  headless: !HEADED,
  args: ['--disable-blink-features=AutomationControlled'],
});
const runStart = Date.now();
const results = [];
let next = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    const wait = runStart + job.startAfterMs - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (stopped) break;
    results.push(await runAgent(browser, job.p));
  }
}));
await browser.close();

// ---------- evidence and summary ----------
const db = evidenceClient();
for (const r of results) r.verified = await succeeded(db, r, startedAtIso).catch(() => null);

const round = (n, d = 4) => Number(n.toFixed(d));
const byVariant = {};
for (const r of results) {
  const g = (byVariant[r.variant] ||= { agents: 0, succeeded: 0, unverified: 0, steps: 0, cost: 0 });
  g.agents++;
  g.steps += r.steps;
  g.cost += r.cost;
  if (r.verified === true) g.succeeded++;
  if (r.verified === null) g.unverified++;
}
for (const g of Object.values(byVariant)) {
  g.successRate = `${Math.round((100 * g.succeeded) / g.agents)}%`;
  g.avgSteps = round(g.steps / g.agents, 1);
  g.avgCostUSD = round(g.cost / g.agents);
  delete g.steps;
  g.cost = round(g.cost);
}
const steps = results.reduce((a, r) => a + r.steps, 0) || 1;
const priced = results.every((r) => r.priceKnown);
const summary = {
  ranAt: new Date().toISOString(),
  target: URL_BASE,
  run: RETURN_OF ? `return-wave-${RETURN_OF}` : `cohort-${COHORT}`,
  model: MODEL,
  agents: results.length,
  wallClockMinutes: round((Date.now() - runStart) / 60000, 1),
  totalCostUSD: priced ? round(spent) : 'add the model to swarm/prices.json',
  costPerAgentUSD: priced && results.length ? round(spent / results.length) : null,
  avgInputTokensPerStep: Math.round(results.reduce((a, r) => a + r.inTok, 0) / steps),
  avgOutputTokensPerStep: Math.round(results.reduce((a, r) => a + r.outTok, 0) / steps),
  stoppedByBudget: stopped,
  reliability: {
    crashed: results.filter((r) => r.outcome === 'crashed').length,
    parseErrors: results.reduce((a, r) => a + r.parseErrors, 0),
    actionErrors: results.reduce((a, r) => a + r.actionErrors, 0),
    apiRetries: results.reduce((a, r) => a + r.retries, 0),
  },
  evidence: db ? 'supabase + browser' : 'browser only (no Supabase keys in .env.local)',
  byVariant,
};
fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));

console.log(`\nDone in ${summary.wallClockMinutes} min. Cost: ${typeof summary.totalCostUSD === 'number' ? `$${summary.totalCostUSD}` : summary.totalCostUSD}.`);
console.log(`Reliability: ${summary.reliability.crashed} crashed, ${summary.reliability.parseErrors} unclear replies, ${summary.reliability.actionErrors} failed actions, ${summary.reliability.apiRetries} API retries.`);
for (const [v, g] of Object.entries(byVariant)) {
  console.log(`  ${v.padEnd(18)} ${String(g.agents).padStart(3)} agents  success ${g.successRate.padStart(4)}${g.unverified ? ` (${g.unverified} unverified)` : ''}  ${g.avgSteps} steps  $${g.avgCostUSD}/agent`);
}
console.log('Details: swarm/results/summary.json and swarm/results/agents.jsonl');
