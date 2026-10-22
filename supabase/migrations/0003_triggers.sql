create or replace function public.on_skill_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare original_author text;
begin
  insert into public.activities (actor_id, type, skill_id, created_at)
  values (new.author_id, case when new.forked_from_id is null then 'published' else 'forked' end, new.id, new.created_at);
  if new.forked_from_id is not null then
    select author_id into original_author from public.skills where id = new.forked_from_id;
    if original_author is not null and original_author <> new.author_id then
      insert into public.notifications (recipient_id, actor_id, type, skill_id)
      values (original_author, new.author_id, 'fork', new.forked_from_id);
    end if;
  end if;
  return new;
end $$;
create trigger skills_after_insert after insert on public.skills
  for each row execute function public.on_skill_created();

create or replace function public.on_star_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.skills set stars_count = stars_count + 1 where id = new.skill_id;
  insert into public.activities (actor_id, type, skill_id) values (new.user_id, 'starred', new.skill_id);
  return new;
end $$;
create trigger stars_after_insert after insert on public.stars
  for each row execute function public.on_star_created();

create or replace function public.on_star_deleted() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.skills set stars_count = greatest(stars_count - 1, 0) where id = old.skill_id;
  return old;
end $$;
create trigger stars_after_delete after delete on public.stars
  for each row execute function public.on_star_deleted();

create or replace function public.on_comment_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare skill_author text;
begin
  insert into public.activities (actor_id, type, skill_id) values (new.author_id, 'commented', new.skill_id);
  select author_id into skill_author from public.skills where id = new.skill_id;
  if skill_author is not null and skill_author <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, skill_id)
    values (skill_author, new.author_id, 'comment', new.skill_id);
  end if;
  return new;
end $$;
create trigger comments_after_insert after insert on public.comments
  for each row execute function public.on_comment_created();

create or replace function public.on_follow_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end $$;
create trigger follows_after_insert after insert on public.follows
  for each row execute function public.on_follow_created();
