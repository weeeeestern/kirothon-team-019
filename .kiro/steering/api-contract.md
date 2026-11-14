---
inclusion: always
---

# 프론트와 백엔드의 계약

잠잠은 Vercel(프론트)과 Supabase(백엔드)로 나뉜다. 둘의 경계는 `src/api/`와 이 문서뿐이다.

## 무엇이 어디에 있나

| 데이터 | 위치 | 이유 |
|---|---|---|
| 판정(runDay), 경로, 출발 시각, 임계값 T, 읽음 표시, 착용 옷 | 브라우저 (`localStorage`) | 개인 이동 정보를 서버로 보내지 않는다 |
| 시민 제보, 제보 확인, 도움됨 | Supabase (`reports`, `report_confirmations`, `report_helpful`) | 서로 다른 사용자 2명 확인은 여러 사용자가 같은 데이터를 봐야 가능하다 |
| 포인트 원장 | Supabase (`point_ledger`) | 클라이언트가 포인트를 직접 쓰면 조작할 수 있다 |
| 공공데이터 스냅숏 | Supabase (`snapshots`), 수집은 Edge Function | API 키를 브라우저에 두지 않는다 |

## 규칙

- 계약 파일(`src/api/contract.ts`, `src/api/client.ts`)은 `backend-dev`만 고친다. 다른 에이전트는 읽기만 하고, 필요한 것이 없으면 lead에게 요청한다.
- 클라이언트는 테이블에 직접 insert/update 하지 않는다. 제보 등록, 확인, 도움됨, 포인트 적립은 RPC(`submit_report`, `confirm_report`, `mark_helpful`)로만 한다.
- 사용자 식별은 Supabase 익명 로그인(`auth.uid()`)만 쓴다. 이메일, 전화번호, 위치를 받지 않는다.
- 클라이언트에는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`만 둔다. `service_role` 키와 공공데이터 키는 Supabase 시크릿에만 둔다.
- Supabase 환경변수가 없으면 앱은 `localStorage` 데모 모드로 동작한다. 데모는 백엔드 없이도 끝까지 돌아가야 한다.
- 계약이 바뀌면 `backend-dev`가 보고 끝에 `계약 변경:`으로 적고, `ui-dev`가 그다음에 반영한다.
