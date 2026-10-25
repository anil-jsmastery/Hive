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

## After step 04
- seed/skills/ holds the 30 skill files copied from build-plan/seed-skills/.
- npm run db:seed resets all skills, stars, comments, follows, notifications and activities, then loads 8 seed authors (ids start with seed_) and 30 public skills.

## After step 05
- PostHog helpers: lib/analytics/events.ts (the only event list), server.ts (trackServer with optional orgId, setPersonProperties, identifyOrganization, getFlag), client.ts (trackClient).
- instrumentation-client.ts initializes posthog-js with autocapture off and registers swarm properties from the URL.
- TrackOnMount fires a client event once per mount.

## After step 06
- Clerk: ClerkProvider (shadcn theme), proxy.ts with clerkMiddleware, /sign-in and /sign-up pages, username required, development instance.
- Supabase accepts Clerk session tokens (third-party auth). lib/supabase/server.ts createServerSupabase() is the only app client.
- lib/profile.ts getCurrentProfile() creates the profile on first sign-in and sends user_signed_up once.
- AnalyticsIdentity identifies the Clerk user, resets on sign-out and sets the organization group.
- /onboarding saves the stack to profiles and to PostHog person properties.

## After step 07
- Landing page: hero with one CTA (landing_cta_clicked) and an 8-row activity rail from latestActivity() in lib/queries/activity.ts.
