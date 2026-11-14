# 잠잠 작업 지침

잠잠은 평소와 다른 날에만 울리는 서울 출퇴근 알림이에요. 프론트와 외부 API 중계는 Vercel, 시민 제보·포인트 저장은 Supabase예요.

## 공통 규칙
- 제품과 화면 규칙은 `.kiro/steering/`, 기능 요구사항은 `.kiro/specs/`에서 확인한다. 사용자가 변경한 범위는 관련 문서와 함께 갱신한다.
- 결정은 `docs/DECISIONS.md`에 기록하고, 작업을 이어갈 때 먼저 읽는다.
- 다운로드 원본과 기존 작업자의 변경을 보존한다. 큰 원본은 저장소에 넣지 않고 수집 스크립트, 출처, 체크섬, 정제된 번들을 남긴다.
- 브라우저 공개 키와 서버 비밀 키를 구분한다. `.env` 전체나 인증키가 포함된 URL을 출력하지 않는다. ODsay Server 키(`ODSAY_API_KEY`), 카카오 REST 키, Supabase `service_role` 키를 클라이언트 번들에 넣지 않는다. 브라우저에는 카카오 지도 JS 키, 사용자가 승인한 ODsay Web/URI 키(`VITE_ODSAY_WEB_KEY`), Supabase anon 키(`VITE_SUPABASE_ANON_KEY`)만 쓴다.
- 실제 API 호출 성공, 앱 연동 성공, 배포 성공은 따로 확인한다. 실패한 API를 합성 성공 결과로 대체하지 않는다.
- 열차 혼잡도(%), 역 이용량(명), 지역 인구, 대기질(µg/m³)을 같은 수치로 비교하지 않는다. 과거 통계와 현재 관측, 합성 평가를 화면과 문서에서 구분한다.
- 커밋과 푸시는 사용자의 현재 지시에 따른다. 사용자 Git 작성자 설정을 유지하고 요청하지 않은 공동 작성자를 추가하지 않는다. `main` 머지는 사용자 검토 후에만 한다.
- 제출 문서는 수행 결과와 검증 근거 중심으로 쓴다. 특정 도구의 수행 이력은 확인한 사실만 기록한다.

## 에이전트 (`.kiro/agents/`)

`lead` 하나가 위임하고, 나머지는 자기 경로에만 쓴다. 경로 제한은 각 에이전트의 `permissions`(`fs_write deny ** exclude <허용 경로>`)로 강제된다.

| 이름 | 태그 | 맡는 일 | 쓰기 허용 |
|---|---|---|---|
| `lead` | — | 태그로 위임, qa 검토 루프, 푸시 전 security | 없음 |
| `backend-dev` | `[backend]` | Supabase 스키마·RLS·RPC, 클라이언트 계약 | `supabase/`, `src/api/`, `src/.env.example` |
| `engine-dev` | `[engine]` | 판정 엔진, 합성 시나리오, 평가 | `src/engine/`, `src/data/synthetic/`, `src/data/evaluation.json`, `scripts/eval/` |
| `jamjam-data` | `[data]` | 공공데이터 수집·정제, 기준선, 출처 | `scripts/collect/`, `src/data/public/`, `src/data/{provenance.ts,sources.json,types.ts,regions.json}`, `src/features/baseline/`, `data/` |
| `jamjam-transit` | `[transit]` | 카카오 지도·장소 검색, ODsay 길찾기, 경로 화면, API 중계 | `api/`, `server/`, `src/features/{transit,routes}/`, `src/components/KakaoMap.tsx`, `src/pages/Routes.tsx`, `src/engine/types.ts`(경로 타입만), `src/theme/{transit,routes}.css`, `src/vite.config.ts`, `src/.env.example`, `vercel.json` |
| `ui-dev` | `[ui]` | 홈·알림·제보·키로의 방·평가 화면, 상태, 키로, 의존성·빌드 설정 통합 | `src/pages/`, `src/components/`, `src/theme/`, `src/state/`, `src/features/{reports,points,live}/`, `src/App.tsx`, `src/main.tsx`, `src/package.json`, tsconfig 등 (transit 소유 파일 제외) |
| `jamjam-docs` | `[docs]` | README, BUILD_REPORT, PRESENTATION.pdf, docs/, steering·스펙 문서 | 해당 문서 (`docs/*.xlsx` 제외) |
| `qa` | `[qa]` | 테스트, 스펙 대조, tasks.md 체크, PASS/NEEDS_CHANGES | 테스트 파일, `supabase/tests/`, `qa/`, `tasks.md` |
| `security` | — | 푸시 전 보안 검사, SECURE/BLOCK | `qa/reports/` |

겹치는 파일은 두 개뿐이에요. `src/.env.example`은 backend-dev(Supabase 변수)와 jamjam-transit(지도·길찾기 변수)가, `src/engine/types.ts`는 engine-dev와 jamjam-transit(경로 타입만)이 함께 써요. 서로의 항목을 지우지 않아요.

흐름: lead → 계약 먼저(backend-dev, jamjam-data, 경로 타입) → 나머지 병렬 → qa(PASS) → jamjam-docs(확정 수치 반영) → security(SECURE) → push

실행: `kiro-cli --agent lead`. 비대화형은 `kiro-cli chat --v3 --agent lead --no-interactive ...`예요. `--v3`가 없으면 V2 엔진이 이 에이전트들을 읽지 못해요.

## 검증 (Node 20.19 이상)
```bash
npm test                          # vitest
npm run build
node --test server/*.test.mjs     # API 중계
npm --prefix src run verify:build # 프로덕션 번들 점검
npx supabase test db              # DB 테스트 (Docker, npx supabase start 필요)
```
새 화면은 모바일 폭에서 확인한다.
