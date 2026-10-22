# Project memory

What exists in this project right now. Each step appends one block at the end.
Never edit earlier blocks.

## After step 00
- Next.js App Router app with Tailwind CSS and shadcn/ui (Radix base, preset bIkeymG). Packages are pinned; install with npm ci only.
- .claude/settings.json pins the coding agent to claude-opus-5-5 at medium effort, ultracode off.
- Memory: CLAUDE.md imports AGENTS.md, MEMORY.md, build-plan/CONTRACT.md and build-plan/DESIGN.md.
- AGENTS.md: our rules on top; the Next.js and PostHog blocks below are tool-managed and never edited.
- MCP servers in .mcp.json: clerk, supabase (scoped by SUPABASE_PROJECT_REF), posthog.
- Committed skills: Clerk, Supabase and four PostHog skills in .agents/skills/.

## After step 01
- PRODUCT.md, TRACKING_PLAN.md and DECISIONS.md exist. The tracking plan is the only source of event names.

## After step 02
- Design tokens, fonts and Clerk's shadcn theme CSS are in app/globals.css. Light theme only.
- Shared components: HiveMark, SiteHeader (signed-out only), SiteFooter, EmptyState, not-found page.

## After step 03
- Supabase tables: profiles, organizations, skills, stars, comments, follows, notifications, activities. All have RLS.
- RLS reads Clerk's session token: requesting_user_id() = sub, requesting_org_id() = active organization.
- Triggers create activities and notifications and keep skills.stars_count correct. App code never does these.
- search_skills(q, stack_filter) RPC returns up to 30 visible skills, ranked. slug_taken(candidate) checks every slug, including private ones.
- lib/supabase/types.ts is generated (npm run db:types). lib/constants.ts, lib/slug.ts, lib/time.ts exist.
