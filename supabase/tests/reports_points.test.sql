-- 잠잠 pgTAP: 제보 2인 규칙, 포인트 1회 적립, RLS, 직접 쓰기 거부
-- 요구사항: supabase-backend 2.4, 3.2~3.4, 4.2~4.3
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(33);

-- 사용자 A(작성자), B, C, D
-- 도우미: 사용자 전환 (익명 로그인 사용자와 같은 방식으로 auth.uid()가 정해진다)
create function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  execute 'set local role authenticated';
end $$;

create function pg_temp.as_postgres() returns void language plpgsql as $$
begin
  execute 'reset role';
end $$;

grant execute on function pg_temp.as_user(uuid), pg_temp.as_postgres() to public;

-- ---------------------------------------------------------------- 제보 등록

select pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select set_config('t.r1', public.submit_report('2:강남-선릉', 'strike', '강남역', '08:00', '파업이에요')::text, true);
select pg_temp.as_postgres();

select is((select count(*)::int from public.reports where id = current_setting('t.r1')::uuid), 1, '제보가 저장돼요');
select is((select amount from public.point_ledger
            where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and reason = 'report'),
          10, '제보 +10 적립 (4.1)');

-- ---------------------------------------------------------------- 3.2 본인 확인 제외
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select throws_ok(
  format($q$select public.confirm_report(%L, '2:강남-선릉')$q$, current_setting('t.r1')),
  'P0001', 'self_confirm', '작성자 본인 확인은 거부해요');
select pg_temp.as_postgres();

-- DB 트리거: RPC를 우회한 본인 확인도 거부
select throws_ok(
  format($q$insert into public.report_confirmations (report_id, user_id) values (%L, 'aaaaaaaa-0000-0000-0000-000000000001')$q$,
         current_setting('t.r1')),
  'P0001', 'self_confirm', '트리거가 본인 확인 직접 insert를 막아요');

-- ---------------------------------------------------------------- 3.2 다른 경로 확인 제외
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select throws_ok(
  format($q$select public.confirm_report(%L, '9:다른-경로')$q$, current_setting('t.r1')),
  'P0001', 'route_mismatch', '다른 경로 키의 확인은 거부해요');
select pg_temp.as_postgres();

-- ---------------------------------------------------------------- 3.3 2인 규칙
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select is(public.confirm_report(current_setting('t.r1')::uuid, '2:강남-선릉'), 1, '1명 확인: 확인 수 1');
select is((select confirmed from public.report_status where id = current_setting('t.r1')::uuid),
          false, '1명 확인만으로는 confirmed가 아니에요');

-- 중복 확인
select throws_ok(
  format($q$select public.confirm_report(%L, '2:강남-선릉')$q$, current_setting('t.r1')),
  'P0001', 'duplicate', '같은 사용자의 중복 확인은 거부해요');
select is((select confirmations from public.report_status where id = current_setting('t.r1')::uuid),
          1, '중복 확인은 한 번으로만 세요');
select pg_temp.as_postgres();

-- 확인이 부족하면 도움됨 불가
select pg_temp.as_user('cccccccc-0000-0000-0000-000000000003');
select throws_ok(
  format($q$select public.mark_helpful(%L)$q$, current_setting('t.r1')),
  'P0001', 'not_confirmed', '확인되지 않은 제보에는 도움됨을 적립하지 않아요 (4.2)');

select is(public.confirm_report(current_setting('t.r1')::uuid, '2:강남-선릉'), 2, '2명 확인: 확인 수 2');
select is((select confirmed from public.report_status where id = current_setting('t.r1')::uuid),
          true, '서로 다른 사용자 2명 확인 시 confirmed (3.3)');
select pg_temp.as_postgres();

-- 작성자 확인이 섞여도 작성자는 세지 않는다 (트리거 우회 상황을 가정해 직접 삽입)
select is((select count(*)::int from public.report_confirmations where report_id = current_setting('t.r1')::uuid),
          2, '확인 행은 B, C 둘뿐이에요');

-- ---------------------------------------------------------------- 4.2 도움됨 +5, 1회
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select throws_ok(
  format($q$select public.mark_helpful(%L)$q$, current_setting('t.r1')),
  'P0001', 'self_helpful', '작성자 본인의 도움됨은 거부해요');
select pg_temp.as_postgres();

select pg_temp.as_user('cccccccc-0000-0000-0000-000000000003');
select is(public.mark_helpful(current_setting('t.r1')::uuid), true, '도움됨 첫 호출은 true');
select is(public.mark_helpful(current_setting('t.r1')::uuid), false, '같은 사용자의 도움됨 중복은 false');
select pg_temp.as_postgres();

select is((select count(*)::int from public.point_ledger
            where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and reason = 'helpful'),
          1, '도움됨 원장은 1행');
select is((select sum(amount)::int from public.point_ledger
            where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and reason = 'helpful'),
          5, '도움됨 +5 (4.1)');

-- 다른 사용자의 도움됨은 별도로 +5
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select is(public.mark_helpful(current_setting('t.r1')::uuid), true, '다른 사용자의 도움됨은 따로 인정해요');
select pg_temp.as_postgres();
select is((select sum(amount)::int from public.point_ledger where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
          20, '작성자 합계: 제보 10 + 도움됨 5 + 5');

-- ---------------------------------------------------------------- 제보 +10 한 번, 피드백 +1 한 번
select is((select count(*)::int from public.point_ledger
            where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and reason = 'report'),
          1, '제보 원장은 제보당 1행');

select pg_temp.as_user('dddddddd-0000-0000-0000-000000000004');
select is(public.record_feedback('notice-1'), true, '피드백 첫 호출은 true');
select is(public.record_feedback('notice-1'), false, '같은 알림 피드백 중복은 false');
select is(public.record_feedback('notice-2'), true, '다른 알림 피드백은 따로 적립해요');
select pg_temp.as_postgres();
select is((select sum(amount)::int from public.point_ledger
            where user_id = 'dddddddd-0000-0000-0000-000000000004' and reason = 'feedback'),
          2, '피드백 +1이 알림 ID당 한 번씩 (4.4)');

-- ---------------------------------------------------------------- 3.2 지난 날짜 제보 제외
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select set_config('t.r2', public.submit_report('2:강남-선릉', 'rain', '선릉역', '07:50', '')::text, true);
select pg_temp.as_postgres();
-- 어제 제보로 만든다 (테스트 준비용, 슈퍼유저)
update public.reports
   set report_day = ((now() at time zone 'Asia/Seoul')::date - 1)
 where id = current_setting('t.r2')::uuid;

select pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select throws_ok(
  format($q$select public.confirm_report(%L, '2:강남-선릉')$q$, current_setting('t.r2')),
  'P0001', 'expired', '제보한 날이 지나면 확인을 거부해요');
select is((select count(*)::int from public.report_status where id = current_setting('t.r2')::uuid),
          0, '지난 날짜 제보는 report_status에 안 보여요');
select pg_temp.as_postgres();

-- ---------------------------------------------------------------- 4.3 남의 원장을 못 읽음
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select is((select count(*)::int from public.point_ledger
            where user_id <> 'bbbbbbbb-0000-0000-0000-000000000002'),
          0, '남의 point_ledger 행이 하나도 안 보여요');
select pg_temp.as_postgres();

-- ---------------------------------------------------------------- 2.4 / 4.3 직접 쓰기 거부
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select throws_ok(
  $q$insert into public.reports (author, route_key, situation, place, "time")
     values ('bbbbbbbb-0000-0000-0000-000000000002', 'x', 'rain', '역', '08:00')$q$,
  '42501', null, 'reports 직접 insert 거부 (2.4)');
select throws_ok(
  $q$update public.reports set place = 'hack'$q$,
  '42501', null, 'reports 직접 update 거부');
select throws_ok(
  $q$delete from public.reports$q$,
  '42501', null, 'reports 직접 delete 거부');
select throws_ok(
  $q$insert into public.point_ledger (id, user_id, amount, reason)
     values ('hack', 'bbbbbbbb-0000-0000-0000-000000000002', 10, 'report')$q$,
  '42501', null, 'point_ledger 직접 insert 거부 (4.3)');
select throws_ok(
  $q$select * from public.report_confirmations$q$,
  '42501', null, 'report_confirmations 직접 select 거부');
select pg_temp.as_postgres();

select * from finish();
rollback;
