# Start here

Claude Code builds all of Hive, step by step. You handle only what an agent can't: dashboards, logins and API keys. Claude Code stops and tells you exactly what to do each time.

## 1. Before you start

- [ ] Node 24 (`node -v`), Git, and Claude Code signed in with your Claude plan.
- [ ] `claude update` (Opus 5.5 needs v2.1.280 or later).
- [ ] `echo $ANTHROPIC_API_KEY` prints nothing in your terminal. If it prints a key, Claude Code bills that key instead of your plan.
- [ ] Accounts: Clerk, Supabase, PostHog (a new project just for Hive), GitHub, and later Vercel and a model API for the swarm.

## 2. Set up the folder

Unzip this download. You get a `hive` folder containing only:

```text
hive/
├─ .claude/settings.json   pins Claude Code to Opus 5.5 at medium effort
└─ build-plan/             START_HERE.md, README.md, CONTRACT.md, DESIGN.md and steps 00–19
```

Put it where you want the project (for example `~/Downloads/hive`). If an older `hive` folder is there, rename it first (`mv hive hive-old`). `.claude` is hidden in Finder; that's normal.

Open the `hive` folder in VS Code (or `cd hive && claude` in a terminal) and check that Claude Code shows **Opus 5.5 Medium**.

## 3. First prompt (Step 00)

Paste this into Claude Code:

```text
Read build-plan/00-project-setup.md and do Step 00 exactly as written, from start
to finish. Copy every block marked VERBATIM without changes. If a step needs a
login, a dashboard or a choice only I can make, stop and tell me exactly what to
do, then wait. When you're done, run the checks, report each one as pass or fail,
and commit if every check passes.
```

It will stop once and ask you to run the PostHog CLI installer in your own terminal (it needs a login). When it finishes, start a **new conversation**, approve the three MCP servers, and log in to PostHog with `/mcp`.

## 4. Every step after that

1. Start a new conversation (the **+** button, or `/clear`).
2. Paste the prompt from `build-plan/README.md`, changing only the step file name.
3. Do whatever dashboard work the agent asks for, then tell it to continue.
4. Review `git show --stat HEAD` after it commits, then tag the checkpoint: `git tag step-07` (with that step's number).

If a step goes wrong, don't patch it by hand: go back with `git reset --hard` to the previous tag and run the step again in a new conversation.
