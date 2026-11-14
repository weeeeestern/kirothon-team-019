-- 잠잠: 제보, 확인, 도움됨, 포인트 원장, 스냅숏
-- 쓰기는 security definer RPC로만 한다. 클라이언트에는 테이블 권한을 주지 않는다.

-- ---------------------------------------------------------------- 테이블

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  author      uuid not null,
  route_key   text not null check (char_length(route_key) between 1 and 80),
  situation   text not null check (situation in ('construction', 'strike', 'marathon', 'congestion', 'rain', 'dust')),
  place       text not null check (char_length(btrim(place)) between 1 and 60),
  "time"      text not null check ("time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  note        text not null default '' check (char_length(note) <= 100),
  created_at  timestamptz not null default now(),
  report_day  date not null default ((now() at time zone 'Asia/Seoul')::date)
);
create index reports_route_day_idx on public.reports (route_key, report_day);

create table public.report_confirmations (
  report_id   uuid not null references public.reports (id) on delete cascade,
  user_id     uuid not null,
  created_at  timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table public.report_helpful (
  report_id   uuid not null references public.reports (id) on delete cascade,
  user_id     uuid not null,
  created_at  timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table public.point_ledger (
  id          text not null check (char_length(id) between 1 and 200),
  user_id     uuid not null,
  amount      int  not null check (amount in (1, 5, 10)),
  reason      text not null check (reason in ('report', 'helpful', 'feedback')),
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.snapshots (
  id            bigserial primary key,
  source        text not null,
  area          text not null,
  payload       jsonb not null,
  collected_at  timestamptz not null default now()
);

-- 작성자 본인의 확인은 DB에서도 막는다 (RPC 우회 대비).
create function public.block_self_confirmation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from public.reports r where r.id = new.report_id and r.author = new.user_id) then
    raise exception 'self_confirm';
  end if;
  return new;
end;
$$;

create trigger report_confirmations_no_self
  before insert on public.report_confirmations
  for each row execute function public.block_self_confirmation();

-- ---------------------------------------------------------------- RLS 와 권한

alter table public.reports              enable row level security;
alter table public.report_confirmations enable row level security;
alter table public.report_helpful       enable row level security;
alter table public.point_ledger         enable row level security;
alter table public.snapshots            enable row level security;

-- Supabase 기본 권한을 걷어내고 필요한 것만 다시 준다.
revoke all on public.reports, public.report_confirmations, public.report_helpful,
              public.point_ledger, public.snapshots
  from public, anon, authenticated;
revoke all on sequence public.snapshots_id_seq from public, anon, authenticated;

-- reports, report_confirmations, report_helpful, snapshots: 정책 없음 = 클라이언트 접근 불가.
-- 읽기는 뷰 report_status로만 한다.

-- point_ledger: 자기 행만 읽는다. 쓰기 정책은 없다.
grant select on public.point_ledger to authenticated;
create policy point_ledger_select_own on public.point_ledger
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- 뷰

-- 소유자 권한으로 실행된다(security invoker 아님). 다른 사용자 ID는 노출하지 않는다.
-- 서울 날짜 기준 오늘 제보만 보인다.
create view public.report_status as
select
  r.id,
  r.route_key,
  r.situation,
  r.place,
  r."time",
  r.note,
  r.report_day,
  coalesce(c.n, 0)::int       as confirmations,
  coalesce(c.n, 0) >= 2       as confirmed,
  (r.author = auth.uid())     as is_mine
from public.reports r
left join lateral (
  select count(*) as n
  from public.report_confirmations rc
  where rc.report_id = r.id and rc.user_id <> r.author
) c on true
where r.report_day = (now() at time zone 'Asia/Seoul')::date;

revoke all on public.report_status from public, anon, authenticated;
grant select on public.report_status to authenticated;

-- ---------------------------------------------------------------- RPC

create function public.submit_report(
  p_route_key text,
  p_situation text,
  p_place     text,
  p_time      text,
  p_note      text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid;
  v_note text := coalesce(p_note, '');
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if p_route_key is null or char_length(p_route_key) not between 1 and 80
     or p_situation is null or p_situation not in ('construction', 'strike', 'marathon', 'congestion', 'rain', 'dust')
     or p_place is null or char_length(btrim(p_place)) not between 1 and 60
     or p_time is null or p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or char_length(v_note) > 100 then
    raise exception 'invalid_input';
  end if;

  insert into reports (author, route_key, situation, place, "time", note)
  values (v_uid, p_route_key, p_situation, btrim(p_place), p_time, v_note)
  returning id into v_id;

  insert into point_ledger (id, user_id, amount, reason)
  values ('report:' || v_id, v_uid, 10, 'report')
  on conflict do nothing;

  return v_id;
end;
$$;

create function public.confirm_report(p_report_id uuid, p_route_key text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rep reports%rowtype;
  v_n   int;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if p_report_id is null or p_route_key is null or char_length(p_route_key) not between 1 and 80 then
    raise exception 'invalid_input';
  end if;

  select * into v_rep from reports where id = p_report_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_rep.author = v_uid then
    raise exception 'self_confirm';
  end if;
  if v_rep.route_key <> p_route_key then
    raise exception 'route_mismatch';
  end if;
  if v_rep.report_day <> (now() at time zone 'Asia/Seoul')::date then
    raise exception 'expired';
  end if;

  insert into report_confirmations (report_id, user_id)
  values (p_report_id, v_uid)
  on conflict do nothing;
  if not found then
    raise exception 'duplicate';
  end if;

  select count(*)::int into v_n
  from report_confirmations
  where report_id = p_report_id and user_id <> v_rep.author;
  return v_n;
end;
$$;

create function public.mark_helpful(p_report_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rep reports%rowtype;
  v_n   int;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if p_report_id is null then
    raise exception 'invalid_input';
  end if;

  select * into v_rep from reports where id = p_report_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_rep.author = v_uid then
    raise exception 'self_helpful';
  end if;

  select count(*)::int into v_n
  from report_confirmations
  where report_id = p_report_id and user_id <> v_rep.author;
  if v_n < 2 then
    raise exception 'not_confirmed';
  end if;

  insert into report_helpful (report_id, user_id)
  values (p_report_id, v_uid)
  on conflict do nothing;
  if not found then
    return false;
  end if;

  insert into point_ledger (id, user_id, amount, reason)
  values ('helpful:' || p_report_id || ':' || v_uid, v_rep.author, 5, 'helpful')
  on conflict do nothing;
  return true;
end;
$$;

create function public.record_feedback(p_notice_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if p_notice_id is null or char_length(p_notice_id) not between 1 and 100 then
    raise exception 'invalid_input';
  end if;

  insert into point_ledger (id, user_id, amount, reason)
  values ('feedback:' || p_notice_id, v_uid, 1, 'feedback')
  on conflict do nothing;
  return found;
end;
$$;

revoke all on function public.submit_report(text, text, text, text, text) from public, anon;
revoke all on function public.confirm_report(uuid, text)                  from public, anon;
revoke all on function public.mark_helpful(uuid)                          from public, anon;
revoke all on function public.record_feedback(text)                       from public, anon;
grant execute on function public.submit_report(text, text, text, text, text) to authenticated;
grant execute on function public.confirm_report(uuid, text)                  to authenticated;
grant execute on function public.mark_helpful(uuid)                          to authenticated;
grant execute on function public.record_feedback(text)                       to authenticated;
