# supabase/AGENTS.md

잠잠의 Supabase 백엔드예요. 소유는 `backend-dev`예요. 경계는 `.kiro/steering/api-contract.md`, 스펙은 `.kiro/specs/supabase-backend/`예요.

## 명령 (Docker 필요)
```bash
npx supabase start        # 로컬 Supabase 시작
npx supabase db reset     # 마이그레이션 전부 다시 적용
npx supabase test db      # pgTAP 테스트 (supabase/tests/*.sql)
npx supabase stop
```
원격 반영(`link`, `db push`, `functions deploy`)은 사람이 승인한 뒤에만 해요.

## 규칙
- 스키마 변경은 `migrations/`에 새 SQL 파일로 만들어요. 있는 파일은 고치지 않아요.
- 모든 테이블에 RLS를 켜고 정책을 같은 마이그레이션에 넣어요. 클라이언트 쓰기 정책은 없어요.
- 쓰기는 `security definer` RPC로만 해요(`submit_report`, `confirm_report`, `mark_helpful`, `record_feedback`). RPC에는 `set search_path = public`을 두고 입력을 다시 검증해요.
- 사용자는 익명 로그인(`auth.uid()`)만 써요. 이메일, 전화번호, 위치, 정류장 목록, 출발 시각은 저장하지 않아요.
- 포인트는 `point_ledger`에 이유별 고유 키로 한 번만 쌓아요. 제보 10, 도움됨 5, 피드백 1.
- `service_role` 키와 공공데이터 키는 커밋하지 않아요. Edge Function은 `Deno.env.get`으로만 읽고 로그에 남기지 않아요.
- 테스트는 `qa`가 `tests/`에 써요.
