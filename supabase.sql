-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists scores (
  id         bigint generated always as identity primary key,
  week       int          not null,
  name       text         not null,
  name_key   text         not null,
  time       numeric(8,2) not null,
  racer      smallint     not null default 0,
  created_at timestamptz  not null default now(),
  unique (week, name_key)
);
create index if not exists scores_week_time on scores (week, time);

-- Row Level Security ON with no policies = the public/anon key can't read or write directly.
-- Only the server function (secret key) touches this table.
alter table scores enable row level security;

-- Atomic "keep my best time" submit
create or replace function submit_score(p_week int, p_name text, p_time numeric, p_racer smallint)
returns json language plpgsql security definer set search_path = public as $$
declare v_improved boolean; v_best numeric; v_rank int; k text := lower(p_name);
begin
  insert into scores(week, name, name_key, time, racer) values (p_week, p_name, k, p_time, p_racer)
  on conflict (week, name_key) do update
    set name = excluded.name, time = excluded.time, racer = excluded.racer, created_at = now()
    where scores.time > excluded.time
  returning true into v_improved;
  select time into v_best from scores where week = p_week and name_key = k;
  select count(*) + 1 into v_rank from scores where week = p_week and time < v_best;
  return json_build_object('improved', coalesce(v_improved, false), 'best', v_best, 'rank', v_rank);
end $$;
revoke all on function submit_score(int, text, numeric, smallint) from public, anon, authenticated;
grant execute on function submit_score(int, text, numeric, smallint) to service_role;
