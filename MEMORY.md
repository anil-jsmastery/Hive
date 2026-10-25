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

## After step 08
- /explore: URL state (q, stack), search form, stack filter pills, SkillCard list from searchSkills() in lib/queries/search.ts (search_skills RPC).
- Events: search_performed (TrackOnMount keyed by query and stack), search_result_opened (SkillCard).
- SkillCard shows author, stack, team badge, Private badge, tags and stars.

## After step 09
- /s/[slug]: getSkill() and hasStarred() in lib/queries/skill.ts (RLS decides visibility).
- app/s/[slug]/actions.ts: installSkill (skill_installed), toggleStar (skill_starred on star only). Star counts come from the trigger.
- Client events: skill_viewed, share_link_opened. Toasts: "Install command copied", "Starred", "Star removed", "Link copied", "Published".

## After step 10
- forkSkill (public skills only, forks are public and personal, skill_forked) and postComment (1–500 chars, comment_posted) in app/s/[slug]/actions.ts.
- Comments section on the skill page. Notifications and activities for forks and comments come from triggers.

## After step 11
- /publish: PublishForm (useActionState) with title, description, stack, tags, Write/Preview content. publish_started on mount.
- app/publish/actions.ts publishSkill(variant, ...): validates with lib/validation.ts, checks plan features for private skills (returns paywall), publishes as team via ensureOrganization() when owner=team, sends skill_published.
- lib/organization.ts ensureOrganization() upserts the active Clerk organization into Supabase and identifies the PostHog group.

## After step 12
- /u/[handle]: profile header, follower counts, Follow button (toggleFollow, not tracked on purpose), published skills.

## After step 13
- /dashboard: Notifications (openNotification marks read, sends notification_clicked, redirects), Your skills, Your forks.
- Header Dashboard link shows unreadCount() from lib/queries/notifications.ts.

## After step 14
- Clerk organizations are Hive teams. OrganizationSwitcher in the header (personal accounts allowed, slugs on).
- /o/[slug] team page. Publish as personal or team (owner field). Dashboard "Team skills" when a team is active.
- Team actions carry the PostHog organization group (client group + server orgId + identifyOrganization).

## After step 15
- Deployed on Vercel with the Clerk development instance. PostHog: replays, heatmaps and exception autocapture on, autocapture off, a test-account filter for cohort starting with swarm.

## After step 16
- Clerk Billing: Pro (user, private_skills, $8) and Team (organization, team_private_skills, $20) on the development gateway.
- /pricing with For you / For teams tabs (pricing_viewed). Header has a Pricing link.
- Publish form: Visibility field and PaywallDialog (paywall_shown). publishSkill gates private skills with has({ feature }).
- app/api/webhooks/clerk/route.ts verifies Clerk webhooks: organization.created (upsert + organization_created), subscriptionItem.active/canceled (subscription_started/canceled, free plans ignored).
