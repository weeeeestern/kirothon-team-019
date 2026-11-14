# AGENTS.md

잠잠은 평소와 다른 날에만 울리는 서울 출퇴근 알림이에요. 프론트는 Vercel, 백엔드는 Supabase예요.

## 읽는 순서
1. `.kiro/steering/product.md` 제품 규칙
2. `.kiro/steering/api-contract.md` 프론트와 백엔드의 경계
3. 맡은 작업의 `.kiro/specs/<스펙>/tasks.md`

## 에이전트 (`.kiro/agents/`)
| 이름 | 맡는 일 | 쓰기 허용 |
|---|---|---|
| `lead` | 작업 태그로 위임, qa 검토 루프 | 없음 |
| `backend-dev` | Supabase 스키마, RLS, RPC, Edge Function, 계약 | `supabase/`, `src/api/` |
| `engine-dev` | 판정 엔진, 번들 데이터, 평가 | `src/engine/`, `src/data/`, `scripts/` |
| `ui-dev` | 화면, 키로, 상태, 데이터 연결 | `src/pages/`, `src/components/`, `src/theme/`, `src/state/`, `src/features/` |
| `qa` | 테스트, 스펙 대조, PASS/NEEDS_CHANGES | 테스트 파일, `supabase/tests/`, `qa/` |

시작: `kiro-cli --agent lead`

## 명령 (Node 20.19 이상)
```bash
npm --prefix src ci          # 의존성
npm run dev                  # 프론트 개발 서버
npm test                     # vitest
npm run evaluate             # 합성 시나리오 지표
npx supabase start           # 로컬 Supabase (Docker 필요)
npx supabase db reset        # 마이그레이션 다시 적용
npx supabase test db         # DB 테스트 (pgTAP)
```
