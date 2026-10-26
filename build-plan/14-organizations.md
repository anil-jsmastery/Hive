# Step 14: Organizations (teams)

| | |
| --- | --- |
| Starts from | `step-13` |
| Ends at | `step-14` |
| What you'll learn | B2B analytics: measure teams, not just people |
| Run it with | The prompt in `build-plan/README.md`, with this file's name |

**Before you start.** Step 13 is committed and tagged `step-13`. If this step goes wrong, go back with `git reset --hard step-13` and run it again in a new conversation.

**Goal:** Clerk organizations as Hive teams: switch teams, publish as a team, a public team page, and every team action attached to the team in PostHog.

## Dashboard checklist (Clerk)

1. **Organizations → Settings:** enable Organizations. Allow **personal accounts** (people can use Hive without a team). Enable **organization slugs**. Let any user create organizations. Keep the default roles (`admin`, `member`).

## Files

| File | Change |
| --- | --- |
| `components/site-header.tsx` | Signed in: add `<OrganizationSwitcher hidePersonal={false} afterCreateOrganizationUrl="/dashboard" afterSelectOrganizationUrl="/dashboard" afterSelectPersonalUrl="/dashboard" />` before `<UserButton>` |
| `app/o/[slug]/page.tsx` | New: the team page (spec below) |
| `components/publish/publish-form.tsx` | Add "Publish as" (spec below) |
| `app/publish/page.tsx` | Pass the active team's name to the form: `const org = await ensureOrganization()` |
| `app/dashboard/page.tsx` | When a team is active, call `ensureOrganization()` and add the "Team skills" section |

**`/o/[slug]` page:** load `organizations` by `slug`; `notFound()` if missing.

- **Header:** a `rounded-xl` square with the team's first letter (`bg-secondary`), H1 team name, `<Badge variant="secondary">` with a `Users` icon and the text "Team".
- **H2 "Team skills":** `SkillCard`s for skills where `org_id` = the team's id, newest first. RLS shows private team skills only to members with this team active.
- Empty: `EmptyState` with title "No team skills yet" and body "Skills published for {team name} show up here."

**"Publish as"** (only rendered when a team is active), placed directly after the Title field: a `Select` for `owner` (held in React state and submitted through `<input type="hidden" name="owner" value={owner} />`, as Step 11 describes), label "Publish as", options "Personal (@{handle})" with value `personal` and "{team name}" with value `team`. Default `personal`. Help text: "Team skills show your team’s name and live on its team page."

**Dashboard "Team skills"** (only when a team is active), after "Your forks": H2 "Team skills: {team name}", `SkillCard`s for that team. Empty: title "No team skills yet", body "Publish a skill as your team to see it here.", action button "Publish a skill" to `/publish`.

**Analytics:** nothing new to write. `AnalyticsIdentity` already calls `posthog.group('organization', …)`, server actions already pass `orgId`, and `ensureOrganization()` already calls `identifyOrganization()`. Group analytics may be a paid PostHog add-on; check your project. The group is recorded on events either way.

## Checks

- Create a team "Acme Labs" from the switcher. You land on `/dashboard` with "Team skills: Acme Labs".
- Publish a skill with "Publish as: Acme Labs". `skill_published` has `owner: team` and `$groups.organization` set. The skill shows the team badge and appears on `/o/acme-labs`.
- Supabase `organizations` has one row for Acme Labs.
- Switch to your personal account: the dashboard has no team section.

## Update project memory

Append this block to the end of `MEMORY.md`, **VERBATIM**:

```md
## After step 14
- Clerk organizations are Hive teams. OrganizationSwitcher in the header (personal accounts allowed, slugs on).
- /o/[slug] team page. Publish as personal or team (owner field). Dashboard "Team skills" when a team is active.
- Team actions carry the PostHog organization group (client group + server orgId + identifyOrganization).
```

## Finish this step

The agent runs the checks and, if all of them pass, commits with the message `step 14: organizations` (AGENTS.md rule 13). Then:

1. Review what changed: `git show --stat HEAD`. Only this step's files, plus `MEMORY.md`, should appear.
2. Tag the checkpoint: `git tag step-14`.

**Next:** `15-deploy-and-settings.md`