create or replace function public.search_skills(q text default '', stack_filter text default null)
returns setof public.skills
language sql stable security invoker set search_path = public as $$
  with params as (
    select case when coalesce(trim(q), '') = '' then null
                else websearch_to_tsquery('english', q) end as tsq
  )
  select s.*
  from public.skills s, params p
  where (p.tsq is null
         or to_tsvector('english', s.title || ' ' || s.description || ' ' || array_to_string(s.tags, ' ')) @@ p.tsq)
    and (stack_filter is null or s.stack = stack_filter)
  order by
    case when p.tsq is null then 0
         else ts_rank(to_tsvector('english', s.title || ' ' || s.description || ' ' || array_to_string(s.tags, ' ')), p.tsq)
    end desc,
    s.stars_count desc,
    s.created_at desc
  limit 30
$$;
grant execute on function public.search_skills(text, text) to anon, authenticated;

-- Slug checks must see every skill, including private ones the caller can't read.
create or replace function public.slug_taken(candidate text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.skills where slug = candidate)
$$;
grant execute on function public.slug_taken(text) to authenticated;
