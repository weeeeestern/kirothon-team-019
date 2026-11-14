---
inclusion: fileMatch
fileMatchPattern: ['supabase/**', 'src/api/**']
---

# Supabase 백엔드 규칙

- 스키마 변경은 항상 `supabase/migrations/`에 새 SQL 파일로 만든다. 이미 있는 마이그레이션은 고치지 않는다.
- 모든 테이블에 RLS를 켜고 정책을 같은 마이그레이션에 둔다. 기본은 "읽기는 인증된 사용자, 쓰기는 RPC만"이다.
- 쓰기 RPC는 `security definer`로 만들고 `set search_path = public`을 둔다. 입력은 RPC 안에서 다시 검증한다.
- 제보 확인은 작성자가 아닌 서로 다른 사용자 2명이 같은 경로, 같은 날에 했을 때만 신뢰한다. 이 규칙은 DB 제약과 RPC로 지킨다.
- 포인트는 `point_ledger`에 이유별 고유 키(`report:<id>`, `helpful:<id>:<user>`, `feedback:<id>`)로 한 번만 쌓는다. 금액은 제보 10, 도움됨 5, 피드백 1이다.
- Edge Function은 `supabase/functions/<이름>/index.ts`에 둔다. 키는 `Deno.env.get`으로만 읽고 로그에 출력하지 않는다.
- DB 테스트는 `supabase/tests/*.sql`(pgTAP)에 두고 `npx supabase test db`로 돌린다.
- 원격 반영(`db push`, `functions deploy`, `link`)은 사람이 승인한 뒤에만 한다.
