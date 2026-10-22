# Rules for coding agents working on Hive

1. Before any step, read build-plan/CONTRACT.md, build-plan/DESIGN.md and MEMORY.md.
   Implement only the step file you are asked for, from build-plan/.
2. Never add, remove or upgrade packages unless the step says so.
3. Copy every block marked VERBATIM exactly. Do not rename, reformat or "improve" it.
4. Use the exact file paths, component names, labels, button text, toasts, error
   messages, SQL, event names and property names in the step.
5. Do not add pages, features, events, analytics calls, colors or components that
   the step and DESIGN.md don't list.
6. All analytics go through lib/analytics/. Never import posthog-js or posthog-node
   anywhere else. Never send emails or passwords to PostHog.
7. Server Components never send analytics events, because Next.js prefetching would
   fire them without a real visit. The one exception is user_signed_up, sent only
   when a profile row is actually created. Views are tracked on the client.
   Actions are tracked in Server Actions or the webhook route.
8. App code reads and writes Supabase only through createServerSupabase() in
   lib/supabase/server.ts, so Row Level Security always applies. The secret key is
   used only in seed/seed.ts and app/api/webhooks/clerk/route.ts.
9. MCP servers and skills (Clerk, Supabase, PostHog) are for documentation and for
   the exact actions a step names, such as applying a given migration. If an MCP
   answer or a skill suggests a different approach than a VERBATIM block, the
   VERBATIM block wins. Never run SQL a step didn't give you. Never connect MCP
   servers to a production project.
10. Memory: never create notes, memory files or progress logs. At the end of a
    step, append that step's memory block to MEMORY.md, word for word. Never edit
    earlier blocks.
11. Dashboard work (Clerk, Supabase, PostHog, Vercel), logins and API keys belong
    to the user. When a step needs one, stop, tell the user exactly what to do,
    and wait for them to confirm. Never ask the user to paste a secret key into
    the chat; they put keys in .env.local themselves.
12. If something can't work with the pinned versions or the dashboard settings,
    stop and report the problem instead of improvising.
13. When done, run the step's checks and report each one as pass or fail. If every
    check passes, commit with the message "step NN: <step name>". Never create
    or move git tags.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<posthog>
## PostHog

Use `posthog-cli api` for all PostHog-related data queries and operations. You should use `posthog-cli api` over direct MCP tool calls whenever the CLI is available.

Before your first PostHog command in a session, run `posthog-cli api --agent-help` and load its full output into your context. It prints the complete agent guide — command reference, schema drill-down rules, data discovery workflow, and the tool index — for interacting with PostHog APIs. Treat that output as instructions to follow, not just documentation.

Before starting a PostHog task, run `posthog-cli api skill list` and check for a skill matching the task. If one matches, install it with `posthog-cli api skill install <skill-id>` (add `--force` to refresh an already-installed skill), then read `.agents/skills/<skill-id>/SKILL.md` and follow it. Skills contain task-specific workflows that individual tools do not.
</posthog>
