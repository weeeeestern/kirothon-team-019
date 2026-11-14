**점검 커밋:** `8fd02c2dbe95aeadc72555f085dbbeb625e4619a` (`git log -1`) — docs: BUILD_REPORT에 PreToolUse 차단 훅과 PR #3 리뷰·실행 검증 기록
**작업 트리:** 추적되지 않는 파일 `.kiro/agents/qa-engine.json` 1개가 있었다. 나머지는 깨끗했다. 이 점검은 이 보고서 외의 파일을 수정하지 않았다.

# 잠잠 QA 보고서

범위는 판정 엔진(`src/engine`), 데이터(`src/data`), 평가(`scripts/eval`), 제보·포인트(`src/features`, `src/state`), 서버 함수(`api/`, `server/*.mjs`)이다. 코드와 설정은 수정하지 않았다. 외부 API는 호출하지 않았다. 모든 수치는 합성 시나리오 기준이다.

## 0. 실행하지 못했거나 대체한 것

| 항목 | 상태 | 이유 |
|---|---|---|
| `npm run evaluate` 직접 실행 | **미실행** | `scripts/eval/write.ts:4`가 `src/data/evaluation.json`을 덮어쓴다. 비교 기준이 사라지고 파일 수정 금지에도 어긋난다. 대신 같은 `evaluate()`를 호출하고 저장 파일과 `toEqual`로 비교하는 테스트(`src/engine/engine.test.ts:25`)를 근거로 썼다. |
| `evaluate()` 결과를 따로 출력해 보기 | **미검증** | 임시 `tsx` 명령이 도구 권한 오류로 4회 실행되지 않았다. 아래 지표는 저장 파일 값과 위 테스트 통과로 확인했고, 별도 출력으로 재확인하지 않았다. |
| `npm run build`, `npm --prefix src run verify:build` | **미검증** | 실행하지 않았다. `src/dist`를 만들지 않으려고 제외했다. |
| `python3 -m unittest discover -s scripts/collect` | **미검증** | 실행하지 않았다. |
| `npm --prefix src run lint` | **미검증** | 실행하지 않았다. |
| 브라우저 화면(390px, 터치 대상 44px, 다크 고정) | **미검증** | 코드와 jsdom 테스트만 봤다. |
| 외부 API 실제 호출 | **미검증(의도)** | 지시에 따라 호출하지 않았다. |

## 1. 스펙 추적

체크박스 열은 `tasks.md`의 표시이다. 테스트 열의 경로는 이번에 직접 읽은 파일이다.

### anomaly-engine

| 요구사항 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 1.1 기준선 키(요일유형×30분×지역) | 통과(합성 상수) | `src/engine/baseline.ts:3-14`는 하드코딩 표이다. 요일 유형별 `default` 키가 있다. | `tasks.md`가 인정한 대로 실제 파일 기준선(`features/baseline`)과 엔진은 연결되지 않았다. 화면에서 이 점을 구분해 표시한다. |
| 1.2 개인 데이터 없이 판정 | 통과 | `runDay`가 경로와 이상만 입력으로 쓴다(`src/engine/index.ts:6`). | - |
| 1.3 이력 부족 시 '학습 중' | 통과 | `baseline.ts:20-24`. 테스트: `engine.test.ts:23`. | - |
| 2.1 편차 공식 | 통과 | `impact.ts:25`. 음수 편차는 0으로 자른다. 요구사항 문구에는 없는 동작이다. | 스펙에 한 줄 추가를 권고한다. |
| 2.2~2.4 겹침과 영향도 | 통과 | `impact.ts:5-28`. 테스트: `engine.test.ts:21-22`. | - |
| 2.5 표준편차 0 | **테스트 없음** | 코드는 `baseline.std > 0`로 막는다(`impact.ts:25`). `std: 0`인 기준선을 쓰는 테스트가 없다. 표에도 std 0 항목이 없어 이 경로가 실행된 적이 없다. | std 0 기준선 테스트를 추가한다. |
| 3.1 예정형·돌발형 분류 | 부분 | `classify.ts:3-5`. 엔진 테스트는 `timing`을 명시해서 넣는다. `classifyTiming` 자체는 단독 테스트가 없다. 제보 변환이 이 함수를 쓰고(`reportStore.ts:23`), 그 경로의 `timing` 값은 단언하지 않는다. | `classifyTiming` 단위 테스트를 추가한다. |
| 3.2 공휴일 다음 날 패턴 | **실패(부분 구현)** | `getDayType(date)`가 공휴일 목록 없이 호출된다(`impact.ts:24`, `index.ts:8`). 목록 기본값은 `[]`이다(`utils.ts:7`). 런타임에서 `holiday`·`afterHoliday`가 나올 수 없다. `tasks.md` 머리말과 `data-and-evaluation/tasks.md` 하단이 이 사실을 인정한다. | 요구사항 3.2의 해당 항목은 미충족으로 본다. |
| 3.3 상황 이름 1:1 | 통과 | `types.ts`의 `Situation` 유니언과 `classify.ts:8-11`의 `Record<Situation,…>`. 컴파일 타입으로 보장된다. | - |
| 4.1~4.3 임계값 비교 | 통과 | `decide.ts:6`. 테스트: `engine.test.ts:14`(평범한 날), `:19`(T와 같음/T+0.01). | - |
| 5.1 알림 3요소 | 통과 | `notice.ts:25-37`. 테스트: `App.test.tsx:19-20`(비교 문구와 권고 문구). 엔진 단위의 3요소 단언은 없다. | - |
| 5.2 예정형 전날 밤 | 통과 | `notice.ts:20`. 테스트: `engine.test.ts:20`. | - |
| 5.3 돌발형 15~20분 전 | 부분 | `notice.ts:21`은 17분 고정이다. 테스트는 자정 넘김 한 건(`'23:48'`)만 확인한다. 일반 시각(08:00→07:43)은 단언이 없다. | 일반 시각 단언을 추가한다. |
| 5.4 근거 한 줄, 학습 상태 | 통과(코드) | `notice.ts:31-32`. UI 테스트에서 단언은 확인하지 못했다. | - |
| 5.5 오늘 평범도 | 부분 | `ordinariness.ts:4-6`은 **알림이 생성된 것만** 대상으로 최댓값을 쓴다. 임계값 미만 이상만 있는 날은 항상 100이다. 스펙 가정은 "오늘 최대 영향도"이다. 나누는 수 10에 근거 문서가 없다. | 스펙 가정과 코드 중 하나를 정한다. |
| 5.6, 6.1~6.3 피드백과 T 조정 | 부분 | `threshold.ts:1-8`. 테스트: `engine.test.ts:23`(하한 유지, 상한 유지, 1.5→1.4), `store.test.ts:21`. **상향(+0.1) 일반 경로는 상한값 3 입력만 단언**한다. | 1.5→1.6 단언을 추가한다. |
| 6.4 보정·정밀화는 문서만 | 통과 | 코드에 구현 없음. | - |
| 미확정표 T 초기값 | **불일치** | 스펙은 3.15~3.45 구간을 적었다. 코드는 `DEFAULT_THRESHOLD = 1.5`(`threshold.ts:1`)이다. 상한도 3.0으로 스펙 값보다 작다. `data-and-evaluation/tasks.md` 6번(튜닝)은 미체크이다. | 스펙의 가정 표를 실제 값으로 고친다. |

`tasks.md` 체크 `[x]` 1~9번은 코드와 모순되지 않는다. 단 3.2번 "std=0 처리"는 코드는 있고 테스트가 없다.

### citizen-report-points

| 요구사항 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 1.1 등록 후 '검증 대기' | 통과 | `store.ts:56-60`. 테스트: `store.test.ts:19`. | - |
| 1.2 필수 입력 누락 시 미등록 | 통과 | `reportStore.ts:14`. 테스트: `store.test.ts:18`(시각 누락). 유형·장소·경로 누락은 단언이 없다. | 나머지 필드 테스트를 추가한다. |
| 1.3 +10 | 통과 | `store.ts:59`. 테스트: `store.test.ts:19`. | - |
| 1.4 100자 제한 | 통과 | `reportStore.ts:14`, `Report.tsx:31`의 `maxLength=100`. 테스트: `store.test.ts:18`. | - |
| 2.1~2.3 확인 2명, 중복·본인 제외 | 통과 | `reportStore.ts:16-20`. 테스트: `store.test.ts:20`. | - |
| 2.4 미확인 제보는 알림이 되지 않음 | 통과 | `reportStore.ts:22`. 테스트: `store.test.ts:20`. | - |
| 2.5 AI 검증 없음 | 통과 | 해당 코드 없음. | - |
| 3.1 확인된 제보를 후보로 전달 | 부분 | `reportStore.ts:21-25`. `value`가 120 고정이다. `area`는 입력한 장소 텍스트 그대로여서, 등록 경로의 정류장과 정규화 후 **완전 일치**해야 겹침이 생긴다(`impact.ts:14-17`). 직접 입력(`Report.tsx:29`)한 장소가 정류장과 다르면 확인된 제보도 알림 0건이 된다. 코드로 확인한 가능성이며 화면에서 재현하지는 않았다. | 장소 선택을 경로 정류장으로 제한하거나 안내를 넣는다. |
| 3.2~3.3 도움됨 +5, 1회 | 통과 | `store.ts:63-67`. 테스트: `store.test.ts:21`(복원 후 반복에도 총 16점). | - |
| 4.1~4.3 피드백 +1, 레벨, 비감소 | 통과 | `store.ts:54`, `ledger.ts:2-7`. 테스트: `store.test.ts:21`, `:22`(레벨 경계). | - |
| 5.1 레벨 해금 | 통과 | `ledger.ts:8-14`. 테스트: `App.test.tsx:58`. | - |
| 5.2 이상별 한정판 | **부분** | 한정판은 `marathon` 제보에 `marathon26` 하나뿐이다(`store.ts:58`). 다른 이상 유형의 한정판은 없다. | 스펙 문구를 줄이거나 아이템을 추가한다. |
| 5.3 한정판 유지, 자정 경과 후 신규 불가 | 통과 | 테스트: `store.test.ts:19`. | - |
| 5.4 아이템 이름은 렌더러 키 | 통과 | `ledger.ts:8-14`의 10개 id가 `design/animation/kiro-avatar-soft.js:326-340`의 키에 모두 있다. 반대로 `cap`, `mug`, `bikehelmet`, `halo`, `flower`, `party`는 앱에서 얻을 수 없다. | 정보만 남긴다. |
| 미확정표 유효 기간(당일 자정) | 통과 | `reportStore.ts:18,22`. 테스트: `store.test.ts:23`. | - |

`tasks.md`는 `constants.ts`, `levels.ts`, `unlocks.ts`, `toAnomaly.ts`를 체크 완료로 적었다. 이 파일들은 없다. 하단 "구현 위치 보정"이 통합 사실을 밝히지만 `design.md:20-24`는 아직 없는 파일을 나열한다(구조 규칙: 위치 변경 시 `design.md` 갱신).

### data-and-evaluation

| 요구사항 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 1.1~1.2 소스별 검증 기록 | 통과(문서) | `data/SOURCES.md`에 7종 중 호출 결과가 있다. `tasks.md` 1.1·1.2는 `[ ] 남음`으로 남아 있다. | 체크 상태를 갱신한다. |
| 1.3 파업·집회는 제보로 대체 | 통과 | `data/SOURCES.md` 마지막 문단. | - |
| 1.4 검증 통과분만 실데이터 | **불일치** | `src/data/sources.json`과 `evaluation.json`의 소스 7종이 전부 `synthetic / unverified / collectedAt: null`이다. `SOURCES.md`와 `README.md`는 도시데이터·지하철 도착·TOPIS의 실제 응답을 확인했다고 적는다. | 아래 문제 목록 2번. |
| 1.5 검증 자치구 3곳 | 통과 | `src/data/regions.json`에 강남·마포·영등포구. | - |
| 2.1~2.3 사전 수집 번들과 메타 | 부분 | 공공 파일 번들은 `provenance.json`에 해시·행수가 있다. 수집기는 `.ts`가 아닌 `scripts/collect/import_public_data.py`이다. `tasks.md` 3번은 미체크이다. | 작업 목록을 현재 구조로 고친다. |
| 2.2 런타임에 외부 API 미호출 | **스펙과 코드 불일치** | 앱은 `/api/live`, `/api/places`, ODsay Web 직접 호출을 한다. 2026-11-14 범위 변경이 이 요구사항에 반영되지 않았다. | 요구사항을 갱신한다. |
| 2.4 키는 `.env`에서만 | 통과 | 5절 참고. | - |
| 3.1 `source: 'synthetic'` 표시 | 통과 | `scripts/eval/scenarios.ts`와 엔진 `Anomaly.source`. | - |
| 3.2 샘플 모드 기본 | 부분 | 설계의 `VITE_DATA_MODE=real` 스위치는 코드에 없다(`grep` 결과 `design.md`에만 있음). 모드 구분 자체가 없고 합성이 기본이다. | 스펙을 고치거나 스위치를 구현한다. |
| 3.3 결과 화면·README에 소스별 실/합성과 수집 시각 | **실패** | `src/pages/Eval.tsx:7-8`은 지표 4개만 그린다. 소스별 표가 없다. 커밋 `57197fc`("remove evaluation method and data sections")가 제거했다. README 7절 표는 소스별 여부를 적지만 소스별 수집 시각은 도시데이터 한 건뿐이다. | 문제 목록 1번. |
| 3.4 자치구별 신호 목록 | 통과 | `regions.json`, `Routes.tsx:40`. | - |
| 4.1 평범한 날 알림 0 | 통과 | `evaluation.json: ordinaryDayNotices = 0`. 테스트 `engine.test.ts:25`. | 단 변별력이 낮다(문제 목록 3번). |
| 4.2 탐지율 ≥ 80% | 통과 | 10/10 = 100%. | 같음. |
| 4.3 고정 임계값 대비 감소 ≥ 50% | 통과 | 40→10, 75%. | 같음. |
| 4.4 도움됨 비율 | 통과(미측정으로 표기) | `helpfulRatio: null`, `Eval.tsx:7`. | - |
| 4.5 `runDay` 단일 판정 | 통과 | `scripts/eval/run.ts:8`이 `runDay`를 호출한다. 비교군만 `computeImpact(...).z >= 1`(`run.ts:13`)을 쓴다. 스펙이 정한 비교군이다. | - |
| 4.6 "합성 시나리오 기준" 문구 | 통과 | `evaluation.json: basis`, `Eval.tsx:8`, `README.md` 4절. | - |

### app-ui-kiro

| 요구사항 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 1~6(화면, 키로, 꾸미기) | 부분 통과 | `App.test.tsx` 4개(홈 0건/이상, 제보 흐름, 경로 저장 복구, 해금 안내), `KiroAvatar.test.ts` 23개 통과. | - |
| 1.3 다크 고정, 1.5 터치 44px, 8.1 "~해요"체 | **미검증** | 이 항목을 확인하는 테스트를 찾지 못했다. 화면도 보지 않았다. | `tasks.md` 11번이 미체크이다. |
| 7.1~7.2 평가 결과 지표 | 통과 | `Eval.tsx:7`. | - |
| 7.3 소스별 실/합성과 수집 시각 | **실패** | 위 3.3과 같은 원인. | - |
| 8.3 색 하드코딩 금지 | **실패(1곳)** | `src/components/KakaoMap.tsx:78`에 `strokeColor: '#8B4DFF'`. 다른 `src/pages`, `components`, `features`, `state`, `hooks`의 `.ts/.tsx`에서는 찾지 못했다. | 렌더 시점에 CSS 변수를 읽어 넘긴다. |
| 9.1~9.5 실제 길찾기 | 부분 | `RoutePlanner.test.tsx` 5개, `client.test.ts` 7개 통과(모의 응답). 실제 호출 성공은 `BUILD_REPORT.md`의 주장이며 이번에 재확인하지 않았다. | **미검증** |

## 2. 테스트 실행

| 명령 | 결과 | 근거 |
|---|---|---|
| `npm test` | **통과** | 파일 7개 통과, 테스트 66개 통과, 실패 0. `engine`(9), `store`(8), `publicBaseline`(7), `client`(7), `RoutePlanner`(5), `KiroAvatar`(23), `App`(7). 소요 7.04s. |
| `node --test server/*.test.mjs` | **통과** | 13개 통과, 실패 0. 소요 233ms. |
| `npm run evaluate` | **미실행** | 0절 참고. |
| 빌드, verify:build, lint, Python 테스트 | **미검증** | 0절 참고. |

`BUILD_REPORT.md`가 적은 "앱 테스트 66개, 서버 테스트 13개 통과"와 이번 결과가 같다.

## 3. 지표

| 지표 | 목표 | `evaluation.json` | README 4절 | 재계산 | 결과 |
|---|---|---|---|---|---|
| 시나리오 수 | - | 24 | 24 | `engine.test.ts:25`가 `evaluate()`와 파일의 완전 일치를 통과 | 일치 |
| 평범한 날 알림 | 0 | 0 | 0건 | 같음 | 통과 |
| 탐지율 | ≥ 80% | 10/10 (1.0) | 10/10 | 같음 | 통과 |
| 고정 임계값 대비 감소 | ≥ 50% | 40→10 (0.75) | 40→10, 75% | 같음 | 통과 |
| 도움됨 비율 | 참고 | null | 미측정 | 같음 | 일치 |

재계산은 `evaluate()` 반환값이 저장 파일과 같음을 확인한 것이다. 숫자를 따로 출력하지는 못했다(0절). `evaluation.json`의 `method` 문구("평범한 날 14건 · 관련 이상 10건 · 무관 신호 30건")는 `scenarios.ts`의 구성(페르소나 2종×7일, 이벤트 5종×2)과 맞는다.

## 4. 불변식

| 불변식 | 결과 | 근거 | 권고 |
|---|---|---|---|
| (a) 영향도 < T이면 0건 | 통과 | `engine.test.ts:14`, `:19`(T+0.01에서 0건). | - |
| (b) 영향도 = T이면 생성 | 통과 | `engine.test.ts:19`. 구현은 `decide.ts:6`의 `>=`. | - |
| (c) 표준편차 0이면 0으로 나누지 않음 | **테스트 없음** | 코드는 `impact.ts:25`에서 막는다. | std 0 테스트 추가. |
| (d) NaN 입력은 오류 없이 건너뜀 | 통과 | `engine.test.ts:21`이 `NaN`, `Infinity`, `-10`, 잘못된 시각, 빈 지역을 확인한다. 경로 `stops`에 NaN·undefined를 넣는 경우는 단언이 없다. 코드는 `impact.ts:15`에서 막는다. | 경로 쪽 단언 추가를 권고한다. |
| (e) 예정형 전날 밤, 돌발형 15~20분 전 | 부분 | 예정형은 `'전날 22:00'` 단언이 있다. 돌발형은 자정 넘김 경우의 `'23:48'`(17분 전)만 단언한다. | 일반 시각 단언 추가. |
| (f) 제보자 제외 서로 다른 2명일 때만 확인됨 | 통과 | `store.test.ts:20`(본인, 다른 경로, 중복 제외 후 2명째에 전이). | - |
| (g) '도움됨'과 확인의 중복은 한 번만 | 통과 | `store.test.ts:20`(확인 중복), `:21`(도움됨을 복원 후 반복해도 +5 한 번). 피드백 +1도 중복 방지된다. | - |

## 5. 비밀 정보

| 항목 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 코드·JSON·문서에 실제 키 값 | **통과(발견 없음)** | 키 형태 패턴과 32자 이상 문자열을 `src`, `api`, `server`, `scripts`, `.kiro`, `docs`, `data`에서 검색했다. 걸린 것은 가짜 값뿐이다. `server/transit.test.mjs:47,93,94`의 `'private-token'`, `'uri-public'` 등. 나머지는 해시, 경로, XML 네임스페이스 URL이다. | - |
| `.env` 추적 여부 | **미검증** | `git ls-files` 필터 명령이 도구 오류로 실행되지 않았다. 대신 `git status`에 `.env` 계열이 없고 `.gitignore`가 `.env`, `.env.*`, `*.pem`, `*.key`를 막는다(예외 `.env.example`). 추적 이력 전체는 보지 않았다. | `git ls-files \| grep -E '\.env'`로 확인한다. |
| 로그·응답으로 키 노출 | 통과 | 6절 7(a). | - |

## 6. 문서와 코드 불일치

| 위치 | 문서가 말하는 것 | 실제 | 권고 |
|---|---|---|---|
| `README.md` 상단 | "`main`의 `3f1ffaf` 배포 완료" | 점검 커밋은 `8fd02c2`이다. 이후 커밋(`57197fc`가 평가 화면을 바꿈)의 배포 검증은 없다. | 배포 기준 커밋을 갱신하거나 "이후 UI 변경 미검증"을 적는다. |
| `README.md` Kiro 활용 | "Hooks 2개", "에이전트 설정 4개" | `.kiro/hooks`에 3개(`guard-pretool.json` 추가), `.kiro/agents`에 5개(`qa-engine.json`은 추적 안 됨). | 숫자를 갱신한다. |
| `README.md` 7절, `SOURCES.md` vs `sources.json`, `evaluation.json` | 도시데이터·지하철 도착·TOPIS는 2026-11-14 실제 응답 확인 | 번들 메타는 전부 합성, 미검증, 수집 시각 null | 문제 목록 2번. |
| `tech.md` 코드 규칙 | 색 하드코딩 금지 | `KakaoMap.tsx:78` | 위 1절. |
| `.kiro/specs/data-and-evaluation/requirements.md` 2.2 | 런타임 외부 API 호출 없음 | `/api/live`, `/api/places`, ODsay Web 호출 | 요구사항을 갱신한다. |
| `.kiro/specs/*/tasks.md` | 상태 표시 | `citizen-report-points`는 없는 파일명을 체크 완료로 기록한다. `data-and-evaluation`은 수집 스크립트를 `.ts`로 적었으나 `.py`이다. 같은 스펙의 1.1·1.2·3번은 미체크인데 `SOURCES.md`에 결과가 있다. | 현재 구조에 맞게 고친다. |
| `anomaly-engine/requirements.md` 미확정표 | T 초기값 3.15~3.45 | 1.5 | 위 1절. |
| `tech.md` 명령, `AGENTS.md` 검증 목록 | `npm ci --prefix src`, `npm run dev/build/test`, `verify:build` | 루트 `package.json`과 `src/package.json`에 모두 있다. | 이상 없음(실행은 `npm test`만). |
| `structure.md` 경로 | `server/`, `api/`, `scripts/eval/`, `data/SOURCES.md` 등 | 모두 존재한다. `src/features/live`, `src/features/routes`는 구조 문서에 없는 추가 폴더이다. | 구조 문서에 추가를 권고한다. |

## 7. 서버 함수

| 항목 | 결과 | 근거 | 권고 |
|---|---|---|---|
| (a) 키는 `process.env`에서만, 응답·로그로 내보내지 않음 | 통과 | 키는 `server/transit.mjs:10,64,80`, `server/live.mjs:61`에서 환경변수로만 읽는다. 업스트림 오류는 고정 문구로 바꾼다(`transit.mjs:40-45`, `live.mjs`의 catch). 테스트: `raw network errors with secret URLs are replaced`, `provider denial ... never returns original secret-containing body`. `console` 로그 호출은 서버 파일에서 찾지 못했다(검색은 하지 않았고 읽은 파일에서 확인). | 서버 외 `src/features/transit/odsayWeb.ts`(브라우저 직접 호출)의 오류 마스킹은 읽지 않았다. **미검증**. |
| (b) 서버 전용 키가 `VITE_`로 노출되지 않음 | 통과 | `VITE_` 이름은 `VITE_KAKAO_JS_KEY`, `VITE_ODSAY_WEB_KEY` 둘뿐이고 둘 다 공개 키로 정한 값이다. `mapConfig`(`transit.mjs:83-85`)는 이 둘만 반환한다. `src/vite.config.ts:8-9`는 비공개 변수를 Node 미들웨어에만 읽고 `define`/`envPrefix`로 내보내지 않는다. 테스트: `only public JS key can leave map configuration`. | `NEXT_PUBLIC_KAKAO_REST_API_KEY`를 REST 키 대체 이름으로 읽는다(`transit.mjs:64`). 현재 Vite `envPrefix` 기본값으로는 번들에 들어가지 않는다. 이름 때문에 설정 실수를 부를 수 있다. |
| (c) 실패·키 없음 시 앱이 멈추지 않음 | 통과 | 키 없음은 503과 안내 문구(`transit.mjs:11`), 시간 초과는 504, 업스트림 오류는 502/429/422로 변환한다. 합성 응답으로 위장하지 않는다(정책과 일치). 테스트: `handler rejects unsupported area and masks missing credentials`, `provider denial is actionable`. | 클라이언트가 이 오류를 실제로 어떻게 보여 주는지는 `client.test.ts`(모의)만 통과했다. |
| (d) 쿼리 입력 검증 | 통과 | 장소 검색어 2~80자와 제어문자 거부(`transit.mjs:63`), 좌표 숫자·한국 범위 검사(`odsay.mjs:9-13`), 같은 위치 거부, 중복 파라미터 거부(`transit.mjs:94`), GET만 허용, `live`는 `AREAS` 허용 목록(`live.mjs:1`). 테스트: `coordinates reject ...`, `invalid input and method fail before upstream call`. | `/api/live`는 중복 파라미터 검사가 없다(영향은 낮음). |
| (e) `server/*.test.mjs` 존재·통과 | 통과 | `live.test.mjs` 3개, `transit.test.mjs` 10개, 모두 통과. | `live` 성공 경로(fetch 모의, 5분 캐시, 동시 요청 합치기)와 HTTP 오류 응답 테스트는 없다. |
| 기타 | 관찰 | `server/live.mjs:67`은 `http://openapi.seoul.go.kr:8088/<키>/…`로 키를 URL 경로에 평문으로 보낸다. 서울 열린데이터 광장 API가 https를 지원하는지는 확인하지 못했다(추측). | 지원하면 https로 바꾼다. 지원하지 않으면 SOURCES.md에 한계로 적는다. |

## 문제 목록 (심각도 순)

**높음**

1. **평가 결과 화면에 소스별 실데이터/합성 표기와 수집 시각이 없다.** `src/pages/Eval.tsx:7-8`. 커밋 `57197fc`가 제거했다. 요구사항 `app-ui-kiro` 7.3, `data-and-evaluation` 3.3, `product.md`의 표기 의무에 어긋난다. 해당 UI 테스트도 없다.
2. **데이터 출처 상태가 서로 모순된다.** `src/data/sources.json`, `src/data/evaluation.json`은 7개 소스를 전부 `synthetic / unverified / null`로 적지만, `data/SOURCES.md`와 `README.md`는 서울 도시데이터·지하철 도착·TOPIS의 실제 응답을 확인했다고 적는다. 반대로 공공 파일 기반 기준선은 이 소스 목록에 없다. 둘 중 하나가 틀렸다. 심사자가 읽는 두 곳이 다른 말을 한다.

**중간**

3. **합성 평가가 임계값 판정을 거의 시험하지 못한다(추측: 설계 의도가 아니라 구성 결과).** 평범한 날의 값은 55~61이다. 기준선 평균은 강남 65, 신촌 58이어서 편차가 0 또는 0.3 정도이다(`scenarios.ts:12`, `baseline.ts:4,6`). 이상 날의 값은 100~120이어서 편차가 약 3~4 이상으로 T=1.5보다 훨씬 크다. 임계값 근처 사례가 없다. 감소율 75%는 이벤트마다 무관한 신호 3개를 붙인 구성에서 나온 값이다(4신호 중 1개가 관련). 지표 단언이 통과해도 "T 근처에서 맞게 판정한다"는 근거는 되지 않는다. README는 "합성 시나리오 기준"을 적었으나 이 한계는 적지 않았다.
4. **공휴일 달력이 `runDay`에 연결되지 않았다.** `impact.ts:24`, `index.ts:8`, `utils.ts:7`. 요구사항 3.2의 "공휴일 다음 날 패턴 변화"는 동작하지 않는다.
5. **테스트 없는 불변식과 경계.** 표준편차 0, 돌발형 일반 시각의 15~20분 전, T 상향 일반 경로, `classifyTiming` 단독, 필수 입력 중 시각 외 필드.
6. **오늘 평범도가 알림이 생긴 경우만 반영한다.** `ordinariness.ts:4-6`. 임계값 미만의 이상만 있는 날도 100이다. 스펙 가정과 다르다.
7. **확인된 제보가 알림이 되지 않을 수 있다.** 장소가 경로 정류장과 완전히 같아야 겹침이 생긴다(`impact.ts:14-17`, `reportStore.ts:23`, `Report.tsx:29`는 자유 입력 허용). 코드로 확인한 가능성이며 실제 화면에서는 재현하지 않았다.
8. **스펙·작업 목록이 현재 코드와 어긋난다.** T 초기값(스펙 3.15~3.45 대 코드 1.5, 상한 3.0과도 모순), 데이터 요구사항 2.2(런타임 외부 호출 금지), 없는 파일명(`constants.ts` 등)이 체크된 작업, 소스 검증·수집 작업의 미체크 상태. AGENTS.md는 사용자가 변경한 범위를 문서와 함께 갱신하라고 한다.
9. **한정판이 마라톤 하나뿐이다.** `store.ts:58`. 요구사항 5.2는 이상별 한정판을 말한다.

**낮음**

10. 색 하드코딩: `src/components/KakaoMap.tsx:78`.
11. README의 배포 기준 커밋(`3f1ffaf`), Hooks 수(2→3), 에이전트 수(4→5)가 오래됐다.
12. `server/live.mjs:67`이 서울 API 키를 평문 http로 보낸다(https 지원 여부 미확인). `live` 성공 경로 테스트도 없다.
13. `NEXT_PUBLIC_KAKAO_REST_API_KEY`라는 이름이 REST 키 대체 입력으로 남아 있다(`transit.mjs:64`). 현재 노출은 없다.
14. `src/features/live`, `src/features/routes`가 `structure.md`에 없다.
15. `design/` 렌더러의 `cap`, `mug`, `bikehelmet`, `halo`, `flower`, `party`는 앱에서 얻을 수 없다(정보).

**미검증으로 남은 것:** 빌드, `verify:build`, 린트, Python 수집기 테스트, 모바일 화면(390px, 터치 44px, 다크 고정), 문구 톤, 실제 외부 API 응답, `odsayWeb.ts`의 오류 마스킹, `.env` 추적 이력 전체, `evaluate()` 값의 별도 출력.
