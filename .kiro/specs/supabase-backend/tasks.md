# 작업 목록: Supabase 백엔드 (supabase-backend)

태그는 담당 에이전트예요. `lead`가 이 태그로 위임해요. 체크는 명령으로 확인한 뒤에만 해요.

- [x] 1. [backend] 로컬 Supabase 준비
  - `npx supabase init`으로 `supabase/config.toml` 생성, `supabase/AGENTS.md` 작성(명령, 규칙)
  - 확인: `npx supabase start` 성공
  - _요구사항: 1.1_

- [x] 2. [backend] 스키마, RLS, RPC 마이그레이션
  - 테이블 5개, 뷰 `report_status`, RPC 4개 (`design.md`)
  - 확인: `npx supabase db reset` 성공
  - _요구사항: 1.2, 2.1~2.4, 3.1~3.4, 4.1~4.4_

- [x] 3. [qa] DB 테스트 (pgTAP)
  - `supabase/tests/reports_points.test.sql`: 2인 규칙, 본인·중복·경로·날짜 제외, 포인트 1회, 남의 원장 못 읽음, 직접 insert 거부
  - `supabase/tests/submit_report_validation.test.sql`: submit_report 입력 검증(상황·장소 1~60자·설명 100자·시각 형식·경로 키), 경계값 통과, 거부 시 적립 없음
  - 확인: `npx supabase test db` 통과
  - _요구사항: 2.2, 2.4, 3.2~3.4, 4.2~4.3_

- [x] 4. [backend] 클라이언트 계약
  - `src/api/contract.ts`, `client.ts`, `local.ts`, `index.ts`, `@supabase/supabase-js` 의존성
  - 확인: `npm --prefix src run build` 성공
  - _요구사항: 1.1, 5.1_

- [x] 5. [ui] 앱 연결
  - 제보, 확인, 도움됨, 피드백, 포인트 표시를 `src/api`로 바꾼다. 원격 모드에서는 포인트를 서버 원장으로 보여 준다
  - 연결 실패 시 "연결이 불안정해요" 안내
  - 확인: 환경변수 없이 `npm --prefix src test` 전부 통과(데모 모드 회귀 없음)
  - remote 경로(제출·확인·도움됨·syncRemote)와 연결 실패 안내(AppState.call, PageHeader)는 `src/state/remote.test.tsx`가 `@/api` mock으로 확인한다. 환경변수는 쓰지 않는다
  - _요구사항: 5.1, 5.2_

- [x] 6. [qa] 연결 검증과 시나리오
  - `src/api/*.test.ts`: 환경변수 없을 때 `local`, 있을 때 `remote`
  - `qa/scenarios.md`: 브라우저 2개(익명 사용자 2명)로 제보 → 확인 2회 → 알림 → 도움됨 +5
  - _요구사항: 3.3, 4.1, 5.1_

- [ ] 7. [backend] (선택) `collect-citydata` Edge Function
  - 확인: `npx supabase functions serve` 로컬 호출 1회, 로그에 키 없음
  - _요구사항: 6.1~6.3_
