-- 잠잠 pgTAP: submit_report 입력 검증 (요구사항 supabase-backend 2.2)
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

create function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.as_postgres() returns void language plpgsql as $$
begin execute 'reset role'; end $$;
grant execute on function pg_temp.as_user(uuid), pg_temp.as_postgres() to public;

select pg_temp.as_user('aaaaaaaa-0000-0000-0000-0000000000a1');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'flood', '강남역', '08:00', '')$q$, 'P0001', 'invalid_input', '잘못된 상황 유형는 거부해요');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', '', '08:00', '')$q$, 'P0001', 'invalid_input', '빈 장소는 거부해요');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', '   ', '08:00', '')$q$, 'P0001', 'invalid_input', '공백뿐인 장소는 거부해요');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', repeat('가', 61), '08:00', '')$q$, 'P0001', 'invalid_input', '61자 장소는 거부해요');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', '강남역', '08:00', repeat('나', 101))$q$, 'P0001', 'invalid_input', '101자 설명는 거부해요');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', '강남역', '8:00', '')$q$, 'P0001', 'invalid_input', '시각 형식 8:00는 거부해요');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', '강남역', '24:00', '')$q$, 'P0001', 'invalid_input', '시각 범위 24:00는 거부해요');
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', '강남역', '08:60', '')$q$, 'P0001', 'invalid_input', '시각 범위 08:60는 거부해요');
select throws_ok($q$select public.submit_report('', 'strike', '강남역', '08:00', '')$q$, 'P0001', 'invalid_input', '빈 경로 키는 거부해요');
select throws_ok($q$select public.submit_report(repeat('가', 81), 'strike', '강남역', '08:00', '')$q$, 'P0001', 'invalid_input', '81자 경로 키는 거부해요');

-- 경계값은 통과해요: 장소 60자, 설명 100자, 시각 23:59
select lives_ok($q$select public.submit_report('2:강남-선릉', 'dust', repeat('가', 60), '23:59', repeat('나', 100))$q$, '경계값(장소 60자, 설명 100자, 23:59)은 저장해요');
select pg_temp.as_postgres();

select is((select count(*)::int from public.reports where author = 'aaaaaaaa-0000-0000-0000-0000000000a1'), 1, '거부된 입력은 reports에 남지 않아요');
select is((select count(*)::int from public.point_ledger where user_id = 'aaaaaaaa-0000-0000-0000-0000000000a1'), 1, '거부된 입력은 포인트를 적립하지 않아요 (경계값 1건만 +10)');

-- 로그인하지 않은 호출
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-0000000000a1');
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($q$select public.submit_report('2:강남-선릉', 'strike', '강남역', '08:00', '')$q$, null, null, 'uid가 없으면 거부해요');

select * from finish();
rollback;
