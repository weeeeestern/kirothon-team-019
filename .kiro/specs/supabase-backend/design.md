# 설계: Supabase 백엔드 (supabase-backend)

## 구조

```
supabase/
  config.toml
  migrations/
    <timestamp>_reports_points.sql   테이블, RLS, RPC
  functions/
    collect-citydata/index.ts        (선택) 공공데이터 스냅숏
  tests/
    reports_points.test.sql          pgTAP
src/api/
  contract.ts     타입과 함수 시그니처 (backend-dev 소유)
  client.ts       Supabase 구현 + isRemoteEnabled()
  local.ts        localStorage 데모 구현 (같은 시그니처)
  index.ts        환경변수로 둘 중 하나를 고름
```

## 데이터 모델

| 테이블 | 열 | 비고 |
|---|---|---|
| `reports` | `id uuid`, `author uuid`, `route_key text`, `situation text`, `place text`, `time text`, `note text`, `created_at timestamptz`, `report_day date` | `report_day`는 서울 날짜. `situation`은 6종 check |
| `report_confirmations` | `report_id`, `user_id`, `created_at` | `(report_id, user_id)` 기본 키 |
| `report_helpful` | `report_id`, `user_id`, `created_at` | `(report_id, user_id)` 기본 키 |
| `point_ledger` | `id text`(이유별 키), `user_id`, `amount int`, `reason text`, `created_at` | `(user_id, id)` 기본 키, `amount in (1,5,10)` |
| `snapshots` | `id bigserial`, `source text`, `area text`, `payload jsonb`, `collected_at` | 선택 |

뷰 `report_status`: `id, route_key, situation, place, time, note, report_day, confirmations int, confirmed bool, is_mine bool`. 다른 사용자 ID를 노출하지 않는다.

## RLS

- 모든 테이블 RLS on. 클라이언트 쓰기 정책 없음(쓰기는 RPC만).
- `reports`, `report_confirmations`: 인증 사용자 select 불가, 뷰 `report_status`(security invoker 아님, 소유자 권한)로만 읽는다.
- `point_ledger`: `user_id = auth.uid()`인 행만 select.

## RPC (`security definer`, `search_path = public`)

| 함수 | 입력 | 동작 |
|---|---|---|
| `submit_report(route_key, situation, place, time, note)` | 검증 후 insert, `report:<id>` +10 | 새 제보 id 반환 |
| `confirm_report(report_id, route_key)` | 작성자·중복·경로·날짜 검사 후 insert | 확인 수 반환 |
| `mark_helpful(report_id)` | 확인됨 여부·작성자·중복 검사, 작성자에게 `helpful:<id>:<user>` +5 | 성공 여부 |
| `record_feedback(notice_id)` | `feedback:<notice_id>` +1 | 성공 여부 |

포인트 적립은 `insert ... on conflict do nothing`으로 한 번만 쌓는다.

## 클라이언트 계약 (`src/api/contract.ts`)

```ts
export interface ReportsApi {
  mode: 'remote' | 'local';
  submitReport(input: ReportInput): Promise<{ id: string }>;
  confirmReport(id: string, routeKey: string): Promise<{ confirmations: number }>;
  markHelpful(id: string): Promise<boolean>;
  recordFeedback(noticeId: string): Promise<boolean>;
  listToday(routeKey: string): Promise<ReportStatus[]>;
  myPoints(): Promise<PointEntry[]>;
}
```

`local.ts`는 지금의 `reducer` 동작을 그대로 감싼다. 화면은 `mode`와 상관없이 같은 함수를 쓴다.

## 오류 처리

- RPC는 검증 실패 시 `raise exception`으로 코드(`invalid_input`, `self_confirm` 등)를 돌려준다. 클라이언트는 코드별 안내 문구로 바꾼다.
- 네트워크 실패는 `ReportsApi`가 잡아서 화면 상태 `connectionError`로 올린다.

## 테스트

- `supabase/tests/reports_points.test.sql`: 2인 규칙, 본인·중복 제외, 날짜 경계, 포인트 1회, RLS로 남의 원장 못 읽음, 테이블 직접 insert 거부.
- `src/api/*.test.ts`: 환경변수 없을 때 `local` 선택, `local` 구현이 기존 reducer와 같은 결과.
