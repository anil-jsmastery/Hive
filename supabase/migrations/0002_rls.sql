alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.skills enable row level security;
alter table public.stars enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.activities enable row level security;

-- profiles
create policy "profiles are public" on public.profiles
  for select using (true);
create policy "users create their own profile" on public.profiles
  for insert to authenticated with check (id = (select public.requesting_user_id()));
create policy "users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select public.requesting_user_id()))
  with check (id = (select public.requesting_user_id()));

-- organizations
create policy "organizations are public" on public.organizations
  for select using (true);
create policy "members create their active organization" on public.organizations
  for insert to authenticated with check (id = (select public.requesting_org_id()));
create policy "members update their active organization" on public.organizations
  for update to authenticated
  using (id = (select public.requesting_org_id()))
  with check (id = (select public.requesting_org_id()));

-- skills: public ones for everyone; private ones for the author, or for the
-- owning team while it's the active organization. No update or delete (out of scope).
create policy "skills are visible to the right people" on public.skills
  for select using (
    visibility = 'public'
    or author_id = (select public.requesting_user_id())
    or (org_id is not null and org_id = (select public.requesting_org_id()))
  );
create policy "authors publish as themselves or their active team" on public.skills
  for insert to authenticated with check (
    author_id = (select public.requesting_user_id())
    and (org_id is null or org_id = (select public.requesting_org_id()))
  );

-- stars: you only see and change your own
create policy "users see their own stars" on public.stars
  for select to authenticated using (user_id = (select public.requesting_user_id()));
create policy "users star visible skills" on public.stars
  for insert to authenticated with check (
    user_id = (select public.requesting_user_id())
    and exists (select 1 from public.skills s where s.id = skill_id)
  );
create policy "users unstar" on public.stars
  for delete to authenticated using (user_id = (select public.requesting_user_id()));

-- comments: visible wherever the skill is visible
create policy "comments follow skill visibility" on public.comments
  for select using (exists (select 1 from public.skills s where s.id = skill_id));
create policy "users comment as themselves on visible skills" on public.comments
  for insert to authenticated with check (
    author_id = (select public.requesting_user_id())
    and exists (select 1 from public.skills s where s.id = skill_id)
  );

-- follows
create policy "follows are public" on public.follows
  for select using (true);
create policy "users follow as themselves" on public.follows
  for insert to authenticated with check (follower_id = (select public.requesting_user_id()));
create policy "users unfollow" on public.follows
  for delete to authenticated using (follower_id = (select public.requesting_user_id()));

-- notifications: created only by triggers
create policy "users read their notifications" on public.notifications
  for select to authenticated using (recipient_id = (select public.requesting_user_id()));
create policy "users mark their notifications read" on public.notifications
  for update to authenticated
  using (recipient_id = (select public.requesting_user_id()))
  with check (recipient_id = (select public.requesting_user_id()));

-- activities: created only by triggers, shown only for public skills
create policy "activity on public skills is public" on public.activities
  for select using (
    exists (select 1 from public.skills s where s.id = skill_id and s.visibility = 'public')
  );

-- grants
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update on public.organizations to authenticated;
grant insert on public.skills to authenticated;
grant insert, delete on public.stars to authenticated;
grant insert on public.comments to authenticated;
grant insert, delete on public.follows to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant execute on function public.requesting_user_id(), public.requesting_org_id() to anon, authenticated;
