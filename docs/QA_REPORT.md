# QA 보고서: 잠잠

점검일: 2026-11-14 (환경 시각 기준). 점검자: QA 담당(Kiro). 소스, 스펙, steering, 설정 파일은 수정하지 않았다. 커밋, 푸시, 파일 삭제도 하지 않았다.

결과 표기: 통과 / 실패 / 테스트 없음 / 미검증. 추측은 "(추측)"으로 표시한다. 모든 성과 수치는 합성 시나리오 기준이다.

## 요약

| 구분 | 결과 |
|---|---|
| `npm test` | 통과: 3개 파일, 23개 테스트 통과, 0개 실패 |
| `npm run evaluate` | 통과: 평범한 날 알림 0건, 탐지율 100%(10/10), 감소율 75%(40건 → 10건). README와 `evaluation.json`에 적힌 값과 일치 |
| 불변식 (a)~(g) | (a)(b)(e)(f)(g) 통과, (c) 테스트 없음, (d) 부분 통과 |
| 비밀 정보 | 코드, JSON, 문서에서 값 발견 못 함. git 이력은 미검증 |
| 빌드, 린트, 타입 검사 | 미검증 (셸 명령 실행 권한 요청이 실패해 실행하지 못함) |
| 실데이터 | 0종. 7개 소스 모두 합성 대체, 미검증 |

가장 큰 문제 세 가지는 아래와 같다.

1. 평가 지표(알림 0건, 감소율 75%)가 임계값 T와 상관없이 시나리오 구성만으로 정해진다. 지표가 엔진 품질을 측정한다고 보기 어렵다.
2. 여러 `tasks.md`의 체크박스가 실제 코드와 다르다. 구현된 작업이 미체크이거나, 없는 파일이 체크되어 있다.
3. 지도 API 컴포넌트(`KakaoMap.tsx`)가 범위 밖 규칙과 충돌한다.

---

## 1. 스펙 추적

요구사항 번호마다 코드 위치와 테스트를 대조했다. 테스트 열의 이름은 `engine.test.ts`, `store.test.ts`, `App.test.tsx`의 `it(...)` 제목이다.

### 1.1 anomaly-engine

| 항목 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 1.1 기준선 키(요일 유형, 30분 슬롯, 지역) | 통과 | `baseline.ts` `lookupBaseline`, `utils.ts` `getDayType`. 테스트 "marks fallback baselines as learning...", "uses Seoul dates and accepts an explicit holiday calendar" | 없음 |
| 1.1 공휴일 유형 실제 동작 | 실패 | `runDay`는 `getDayType(date)`를 달력 없이 호출한다(`engine/index.ts`, `decide`/`computeImpact`도 동일). `holiday`, `afterHoliday`는 런타임에 도달하지 못한다. tasks.md 머리말도 미연결이라고 적고 있다 | 검증된 달력을 `runDay`까지 전달하거나 요구사항에서 제외한다 |
| 1.2 개인 데이터 없이 판정 | 통과 | 기준선은 번들 상수. `App.test.tsx` 첫 테스트가 기본 경로로 알림을 낸다 | 없음 |
| 1.3 이력 부족 시 '학습 중' | 통과 | `baseline.ts`의 인접 슬롯, default 대체와 `learning: true`. 테스트 "marks fallback baselines as learning..." | 없음 |
| 2.1 편차 계산 | 통과 | `impact.ts` `computeImpact`. 테스트는 간접(영향도 경계) | 편차 값 자체를 직접 단언하는 테스트 추가 권고 |
| 2.2 경로 겹침 | 통과(주의 있음) | `routeOverlap`. 테스트 "handles overlap boundaries and station suffixes". 산식이 `일치 수 / 지점 수 × 3`을 1로 자른다(`impact.ts:19`). 스펙은 "포함되는 정도(0~1)"만 말하고 계수 3의 근거가 없다 | 계수 3의 근거를 design.md에 기록한다 |
| 2.3 시간 겹침 | 통과 | `timeOverlap`. 테스트 "handles overlap boundaries...", "uses explicit scheduled timing and correct midnight wrap" | 없음 |
| 2.4 영향도 = 편차 × 경로 × 시간 | 통과 | `computeImpact` 반환식. 테스트 "includes exact threshold equality..." | 없음 |
| 2.5 std = 0이면 편차 0 | 테스트 없음 | 코드는 `baseline.std > 0` 조건으로 막는다(`computeImpact`). 모든 기준선 std가 0보다 커서 그 분기에 닿는 테스트가 없다 | `lookupBaseline`을 모킹하거나 std=0 기준선을 주입하는 테스트 추가 |
| 3.1 예정형/돌발형 분류 | 통과(직접 테스트 없음) | `classify.ts` `classifyTiming`. `notice.ts`가 `anomaly.timing ?? classifyTiming(...)`을 쓴다. 테스트는 `timing`을 명시한 경우만 다룬다 | `classifyTiming` 단위 테스트 추가 |
| 3.2 감지 대상 5종 | 실패(부분) | 엔진은 이미 만들어진 `Anomaly[]`를 받는다. 원시 신호에서 이상을 감지하는 코드는 없다. 공휴일 다음 날 패턴은 3.1(공휴일)과 같은 이유로 동작하지 않는다 | 스펙 문구를 "입력된 이상을 판정"으로 고치거나 감지 단계를 추가한다 |
| 3.3 상황 이름 1:1 매핑 | 통과(직접 테스트 없음) | `runDay`의 허용 목록 6종, `notice.ts` ACTIONS 6종, `classify.ts` 라벨 6종 | 매핑 일치 테스트 추가 |
| 4.1 영향도 ≥ T이면 알림 | 통과 | `decide.ts`. 테스트 "includes exact threshold equality..." | 없음 |
| 4.2 영향도 < T이면 알림 없음 | 통과 | 같은 테스트의 `impact + .01` 경우 | 없음 |
| 4.3 알림 0건과 평범도만 | 통과 | 테스트 "keeps an ordinary day silent" (알림 `[]`, 평범도 100) | 없음 |
| 5.1 알림 3요소 | 통과(UI 테스트만) | `notice.ts`의 `what`, `delta`, `action`. `App.test.tsx` 첫 테스트가 화면에서 확인한다. 엔진 단위 테스트는 없다 | 엔진 수준에서 세 필드가 비어 있지 않음을 단언 |
| 5.2 예정형은 전날 밤 | 통과 | 테스트 "uses explicit scheduled timing..." (`전날 22:00`) | 없음 |
| 5.3 돌발형은 출발 15~20분 전 | 통과 | `notice.ts`는 출발 − 17분. 테스트는 자정 경계 한 경우만 단언(`00:05` → `23:48`) | 일반 시각(08:00 → 07:43) 케이스 추가 |
| 5.4 근거 한 줄, 학습 상태 | 통과(부분) | `notice.ts`의 `reason`, `learning`. `learning` 값은 baseline 테스트가 다루고, `reason` 문구는 테스트 없음 | 선택 |
| 5.5 하루 1회 평범도 | 통과(부분) | `ordinariness.ts`. 알림 0건 → 100만 테스트한다. 알림이 있을 때의 점수는 테스트 없음. 산식은 `100 − max영향도/10×100`이며 스펙의 "0~100 정규화"에 정규화 기준값 10이 명시돼 있지 않다 | 기준값 10을 스펙에 기록하고 알림 있는 날의 평범도 테스트 추가 |
| 5.6 피드백 받기 | 통과 | `App.test.tsx` 첫 테스트, `store.test.ts` "prevents duplicate feedback..." | 없음 |
| 6.1 '필요 없었어요'로 T 상향 | 통과(부분) | `threshold.ts`. 상한 클램프만 단언한다(`updateThreshold(3,'notNeeded')`). 상향 한 단계(1.5 → 1.6)는 단언이 없다 | 상향 케이스 추가 |
| 6.2 '도움이 됐어요'로 T 하향 | 통과 | 테스트 "marks fallback baselines..." (1.5 → 1.4), "prevents duplicate feedback..." | 없음 |
| 6.3 상한·하한 | 통과 | `MIN_T 0.5`, `MAX_T 3.0`. 테스트에서 양쪽 확인 | 없음 |
| 6.4 보정·정밀화는 설계만 | 통과 | design.md 마지막 절에만 있고 코드 없음 | 없음 |

### 1.2 citizen-report-points

| 항목 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 1.1 제보 등록 후 '검증 대기' | 통과 | `store.ts` reducer `report`. `App.test.tsx` 두 번째 테스트 | 없음 |
| 1.2 필수값 누락 시 미등록 | 통과(부분) | 테스트 "requires all fields and limits notes..." (시각 누락). 유형, 장소 누락은 단위 테스트가 없다. 화면은 `role=alert`를 띄우며 `App.test.tsx`가 확인한다. 어떤 항목이 비었는지 문구로 알리는지는 확인하지 않았다 | 장소·유형 누락 테스트와 항목명 표시 확인 |
| 1.3 제보 +10 | 통과 | 테스트 "awards a report once..." (합계 10) | 없음 |
| 1.4 설명 100자 제한 | 통과 | `validReportInput`(`note.length <= 100`), `Report.tsx`의 `maxLength={100}`. 테스트 101자 거부 | 없음 |
| 2.1 서로 다른 2명 확인 | 통과 | 테스트 "requires two different same-route non-author confirmations" | 없음 |
| 2.2 같은 사용자 중복 확인은 1회 | 통과 | 같은 테스트(`a` 두 번 → 미확인) | 없음 |
| 2.3 제보자 본인 확인 제외 | 통과 | 같은 테스트(`me` 확인 무시). `isConfirmed`도 작성자를 거른다 | 없음 |
| 2.4 확인 부족 제보는 알림으로 전달되지 않음 | 통과 | `toAnomaly`가 미확인이면 `null`. 같은 테스트에서 `toAnomaly(...)` null 확인 | 없음 |
| 2.5 AI 검증 없음 | 통과 | 코드에서 AI 호출 없음 | 없음 |
| 3.1 확인된 제보를 알림 후보로 전달 | 통과 | `toAnomaly` → `AppState.tsx`의 `runDay` 호출 | 없음 |
| 3.2 '도움됨' +5 | 통과 | 테스트 "prevents duplicate feedback..." (합계 16 = 10 + 5 + 1) | 없음 |
| 3.3 '도움됨' 중복은 1회 | 통과 | 같은 테스트(저장 복구 후 재시도 포함), ledger id `helpful:<id>:<user>` | 없음 |
| 4.1 피드백 +1 | 통과 | `App.test.tsx` 첫 테스트(`amount` 1) | 없음 |
| 4.2 레벨 계산 | 통과 | 테스트 "rejects locked outfits and respects level thresholds" (경계값 0/19/20/49/50/100/200) | 없음 |
| 4.3 포인트 감소 없음 | 통과(직접 테스트 없음) | `ledger.ts` `award`는 `amount <= 0`을 거부한다. 감소 경로가 코드에 없다 | 선택 |
| 5.1 레벨 상승 시 아이템 해금 | 통과 | `canWear`, 테스트 `App.test.tsx` "announces a level unlock once..." | 없음 |
| 5.2 이상을 제보한 날 해당 한정판 | 실패(부분) | 한정판은 `marathon26` 하나뿐이다(`ledger.ts` OUTFITS, `store.ts`의 `situation === 'marathon'`). 스펙은 "해당 이상의 한정판"이라고 적었다. 다른 5종에는 한정판이 없다 | 스펙을 마라톤 한정으로 좁히거나 아이템을 추가한다 |
| 5.3 자정 이후 신규 획득 불가, 보유 유지 | 통과 | 테스트 "awards a report once, grants a same-day limited outfit and preserves it tomorrow" | 없음 |
| 5.4 아이템 이름은 `OUTFITS` 키 | 미검증 | `KiroAvatar` 렌더러의 `OUTFITS` 키와 `ledger.ts`의 id 일치를 대조하지 않았다. `App.test.tsx`는 `hardhat`이 홈 아바타 HTML에 들어가는 것만 확인한다 | 두 목록의 id를 비교하는 테스트 추가 |

### 1.3 data-and-evaluation

| 항목 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 1.1 소스별 검증 기록 | 실패 | `data/SOURCES.md`는 7개 소스 모두 "확인 안 함 / 미검증"이다. 기록 파일은 있지만 검증 결과는 비어 있다 | 키 발급과 샘플 호출을 실행하고 기록한다 |
| 1.2 대상 소스 목록 | 실패(문서) | 스펙 소개는 "8종", 같은 스펙 tasks.md와 `sources.json`은 7종이다 | 개수를 통일한다 |
| 1.3 파업·집회는 제보로 대체한다고 기록 | 통과 | `SOURCES.md` 둘째 문단 | 없음 |
| 1.4 통과 소스만 실데이터, 실패는 합성 | 통과(해당 없음) | 통과 소스가 0개라 전부 합성이다 | 없음 |
| 1.5 검증 자치구 3곳 | 통과 | `regions.json`(강남구, 마포구, 영등포구). 실데이터로 검증한 것은 아니다 | 없음 |
| 2.1 실데이터 사전 수집 | 실패 | `scripts/collect/`가 없다. `data-and-evaluation/tasks.md` 3번이 미착수로 적혀 있다 | 구현 또는 범위 조정 |
| 2.2 런타임 외부 호출 없음 | 실패(부분) | 호출 코드는 `src/components/KakaoMap.tsx:32`에서 외부 스크립트를 동적으로 불러온다. 현재 어느 페이지도 이 컴포넌트를 쓰지 않는다(`KakaoMap` 검색 결과가 파일 자신뿐) | 사용하지 않는다면 제거한다 |
| 2.3 번들 JSON의 meta(소스명, 수집 시각) | 통과(부분) | `sources.json`, `regions.json`, `synthetic/*.json`에는 `meta`가 있다. `evaluation.json`에는 `meta` 객체가 없고 `generatedAt`과 `sources[].collectedAt`이 있다 | 형식을 맞추거나 예외를 문서화한다 |
| 2.4 키는 `.env`에서만 | 통과 | 이번 검색에서 하드코딩 값 없음(5절) | 없음 |
| 3.1 합성 항목에 `source: 'synthetic'` | 통과 | `anomalies.json`, `evaluation.json` | 없음 |
| 3.2 샘플 데이터 모드 기본값 | 통과 | `AppState.tsx`가 합성 이상만 사용한다 | 없음 |
| 3.3 결과 화면과 README에 소스별 표기 | 통과 | `Eval.tsx`의 출처 목록, README "현재 시연과 데이터 출처" 표 | 없음 |
| 3.4 자치구별 사용 가능 신호 | 통과 | `regions.json`의 `signals` | 없음 |
| 4.1 평범한 날 알림 0건 | 통과 | `npm run evaluate` 출력 `ordinaryDayNotices: 0`. 단 3절의 주의 참고 | 없음 |
| 4.2 탐지율 ≥ 80% | 통과 | 10/10 = 100% | 없음 |
| 4.3 고정 임계값 대비 50% 이상 감소 | 통과 | 40건 → 10건 = 75%. 단 3절의 주의 참고 | 없음 |
| 4.4 '도움됨' 비율 계산 | 실패 | `helpfulRatio`가 `null`로 고정이다(`scripts/eval/run.ts`). `Eval.tsx`는 "미측정"으로 표시한다 | 합성 피드백을 생성해 계산하거나 스펙에서 제외한다 |
| 4.5 평가가 `runDay`를 그대로 호출 | 통과 | `run.ts`가 `runDay`를 호출한다. 비교군만 `computeImpact(...).z >= 1`을 쓰며, 판정 로직을 새로 만들지는 않았다 | 없음 |
| 4.6 "합성 시나리오 기준" 문구 | 통과 | `evaluation.json`의 `basis`, `Eval.tsx` 부제목, README | 없음 |

### 1.4 app-ui-kiro (참고)

점검 범위가 엔진, 데이터, 평가, 제보·포인트라서 화면 요구사항은 깊이 보지 않았다. 확인한 것만 적는다.

| 항목 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 2.7 빈 경로면 평범도 100 미표시 | 통과 | `App.test.tsx` "offers route registration without showing a false quiet-day score..." | 없음 |
| 8.1 "위험", "경고" 문구 없음 | 통과(부분) | 소스 검색에서 `src/` 코드와 문구에 해당 단어 없음. 화면 전수 대조는 하지 않았다 | 없음 |
| 8.3 색 하드코딩 금지 | 통과(부분) | `pages/`, `components/`, `state/`, `App.tsx`에서 `#hex`, `rgb()` 없음. CSS 파일은 검색 대상에 넣지 않았다 | CSS 파일도 점검 |
| 그 외 1~7장 | 미검증 | 화면 대조(tasks.md 11.1, 11.2)가 팀 쪽에서도 미완료로 적혀 있다 | 시안 대조 수행 |

### 1.5 tasks.md 체크박스와 실제 코드

| 파일 | 문제 | 근거 |
|---|---|---|
| anomaly-engine/tasks.md | 상위 1, 3, 5, 7번이 `[ ]`인데 하위가 모두 `[x]`다. 4, 6, 8번은 해당 파일이 존재하고 동작하는데 `[ ]`다 | `types.ts`, `classify.ts`, `ordinariness.ts`, `index.ts`가 모두 존재 |
| citizen-report-points/tasks.md | 6.1 `levels.ts`, 6.2 `unlocks.ts`가 `[x]`인데 그 파일이 없다(로직은 `ledger.ts`와 `store.ts`에 있다). 1번의 `types.ts`, `constants.ts`와 4번의 `toAnomaly.ts`도 없다(`toAnomaly`는 `reportStore.ts`에 있다) | `src/features/` 목록에 `ledger.ts`, `reportStore.ts`만 있음 |
| citizen-report-points/tasks.md | 6.3 "한정판 당일/익일" 테스트는 있다. 7번 시드(이웃 A/B)는 UI에 있고 `[ ]` | `App.test.tsx` |
| data-and-evaluation/tasks.md | 5.3 "vitest 단언"이 `[x]`다. 실제로는 `engine.test.ts`의 마지막 테스트가 단언한다(`scripts/eval/`이 아니라 `src/engine/`). tech.md는 `scripts/eval/run.ts`의 단언이라고 적고 있다 | `engine.test.ts` 마지막 `it` |
| app-ui-kiro/tasks.md | 3.2 `KiroHero`는 `[ ]`이고 `components/`에도 없다. 설계가 적은 `useDay.ts`, `TodayScore` 등 여러 컴포넌트가 없다. 팀이 "통합했다"고 머리말에 적었다 | `src/components/` 6개 파일, `src/hooks/` 없음 |
| 모든 스펙의 design.md | 존재하지 않는 경로를 적고 있다: `features/reports/types.ts`, `toAnomaly.ts`, `points/levels.ts`, `unlocks.ts`, `constants.ts`, `hooks/useDay.ts`, `data/baselines.json`, `signals.json`, `scripts/collect/*` | 파일 목록 대조 |

---

## 2. 테스트 실행

| 명령 | 결과 | 출력 |
|---|---|---|
| `npm test` (저장소 루트) | 통과 | `Test Files 3 passed (3)`, `Tests 23 passed (23)`. `state/store.test.ts` 8개, `engine/engine.test.ts` 9개, `App.test.tsx` 6개 |
| `npm run lint` | 미검증 | 셸 명령 권한 요청이 실패해 실행하지 못했다 |
| `npm run build`, `tsc -b` | 미검증 | 같은 이유. 빌드는 `dist/`와 빌드 정보 파일을 만들기 때문에 읽기 전용 점검에서는 일부러 실행하지 않았다 |
| `npm run verify:build` (`scripts/verify-build.mjs`) | 미검증 | 빌드를 전제로 한다 |

테스트 구성에 대한 관찰:

- `features/reports`, `features/points`용 독립 테스트 파일이 없다. 모두 `state/store.test.ts` 경유로 검증된다. 테스트는 통과하지만, 파일 이름만으로는 어느 스펙의 테스트인지 찾기 어렵다.
- `engine.test.ts`가 `scripts/eval/run`을 가져온다. structure.md의 모듈 경계 표는 `src/engine/`이 의존할 대상을 `src/data/` 타입으로 한정한다. 테스트 파일이라 런타임 영향은 없지만 표와 다르다.

---

## 3. 지표 재계산

`npm run evaluate`를 실행했다. 이 스크립트는 `src/data/evaluation.json`을 다시 쓴다. 실행 직후 `git status --short`가 비어 있어서 파일 내용은 바뀌지 않았다.

| 지표 | 목표 | 재계산 | README | `evaluation.json` | 결과 |
|---|---|---|---|---|---|
| 평범한 날 알림 수 | 0건 | 0건 | 0건 | 0 | 통과 |
| 탐지율 | 80% 이상 | 100% (10/10) | 10/10건 | 1 (`detected` 10, `injected` 10) | 통과 |
| 고정 임계값 대비 감소율 | 50% 이상 | 75% (40 → 10) | 75% (40건 → 10건) | 0.75 (`fixedCount` 40, `engineCount` 10) | 통과 |
| 도움됨 비율 | 참고 | 미측정 | 미측정 | null | 실패(4.4와 같음) |
| 시나리오 수 | 24 | 24 | 24개 | 24 | 통과 |

README, `evaluation.json`, 재계산 값이 서로 일치한다. `engine.test.ts`의 마지막 테스트가 `evaluate()` 결과와 `evaluation.json`의 동등성(`toEqual`)을 단언하므로 파일이 낡으면 테스트가 실패한다.

### 지표의 타당성 (코드 읽기 결과)

세 숫자가 통과하는 이유는 엔진 품질보다 시나리오 구성에 있다.

1. **평범한 날 0건은 T와 무관하다.** `scenarios.ts`의 평범한 날 값은 55~61이다. 강남 기준선 평균은 65이므로 편차가 음수가 되어 0으로 잘린다(`computeImpact`의 `Math.max(0, ...)`). 신촌 슬롯은 인접 슬롯 평균 58, 표준편차 10으로 대체되며, 편차가 최대 약 0.3이다. T가 아무리 낮아도 알림이 나오지 않는다. 평범한 날에 "약간 높은 값"이나 "경로에 걸치지만 작은 이상"이 들어가는 경우는 평가되지 않는다.
2. **75% 감소는 구성으로 결정된다.** 이상 주입일 하나당 관련 이상 1건과 무관한 지역·시각 신호 3건을 만든다(`scenarios.ts`). 값은 모두 같은 규모(100~120)라서 비교군(z ≥ 1)은 4건 모두 알림을 낸다. 엔진은 관련 1건만 낸다. 그 결과 10건과 30건이 나오며, 1 − 10/40 = 75%다. 무관 신호를 5개로 늘리면 감소율이 83%가 되는 식이다(산술적 추론).
3. **비교군이 약하다.** 경로·시간을 모두 무시하는 비교군은 사실상 대조군으로서 최약체다. 감소율 50% 목표는 설계상 거의 자동으로 달성된다.
4. **페르소나가 스펙과 다르다.** 스펙과 `routes.json`은 하원길 보호자를 17:30 출발로 정의한다. `scenarios.ts`의 `student`는 08:00 출발, 정류장 `['신촌','이대']`다.
5. **T 값이 평가로 튜닝되지 않았다.** `DEFAULT_THRESHOLD = 1.5`(`threshold.ts:1`)다. 스펙 미확정 표의 "3.15~3.45 구간"은 튜닝 시각(tasks.md 6번의 "3:15~3:45")으로 보이며, 값처럼 읽혀 혼란을 준다(추측). 최종 T 값과 선택 근거는 어느 스펙에도 기록돼 있지 않다.

권고: 평범한 날에 경계값(예: z 0.8~1.4), 경로에 걸치지만 영향도가 T 바로 아래인 이상을 넣고, T를 바꿨을 때 지표가 변하는지 보는 민감도 시나리오를 추가한다.

---

## 4. 불변식

| 불변식 | 결과 | 근거 | 권고 |
|---|---|---|---|
| (a) 영향도 < T이면 알림 0건 | 통과 | `engine.test.ts` "includes exact threshold equality and deduplicates input" (`impact + .01`이면 0건). "keeps an ordinary day silent" | 없음 |
| (b) 영향도 = T이면 알림 생성 | 통과 | 같은 테스트(`threshold: impact`이면 1건). `decide.ts`가 `>=`를 쓴다 | 없음 |
| (c) 표준편차 0이면 0으로 나누지 않음 | 테스트 없음 | 코드는 `baseline.std > 0`일 때만 나눈다(`impact.ts` `computeImpact`). std=0 기준선이 없어서 그 분기를 타는 테스트가 없다 | std=0을 주입하는 테스트 추가 |
| (d) 입력이 NaN이면 오류 없이 건너뜀 | 통과(부분) | "ignores invalid numerical and time input": `value`가 NaN, Infinity, −10이면 알림 0건. 잘못된 시각 문자열, 빈 area는 함수 단위에서 0을 반환한다. `runDay` 수준에서 `startsAt`/`endsAt`/`departAt`이 잘못된 경우, `null` 항목, `stops` 누락은 테스트가 없다 | `runDay`에 잘못된 시각, `null`, 빈 `stops`를 넣는 테스트 추가 |
| (e) 예정형은 전날 밤, 돌발형은 출발 15~20분 전 | 통과 | "uses explicit scheduled timing and correct midnight wrap": 예정형 `전날 22:00`, 돌발형 `00:05` 출발 → `23:48`(17분 전). 일반 시각은 단언하지 않는다 | 일반 시각 케이스 추가 |
| (f) 제보자 제외 서로 다른 2명 확인 시에만 확인됨 | 통과 | `store.test.ts` "requires two different same-route non-author confirmations" (작성자, 중복, 다른 경로, 2명) | 없음 |
| (g) '도움됨'과 확인의 중복은 1회 | 통과 | 확인 중복: 같은 테스트. '도움됨' 중복: "prevents duplicate feedback and duplicate helpful rewards after restoration". 피드백 중복도 포함 | 없음 |

---

## 5. 비밀 정보

| 점검 | 결과 | 근거 | 권고 |
|---|---|---|---|
| 코드, JSON, 문서의 키 형태 문자열 | 통과 | `api_key`, `secret`, `token`, `serviceKey`, `appkey` 등 키워드 대입 패턴, 쿼리 문자열의 `serviceKey=`, `appkey=`, AWS·GitHub·`sk-` 접두 패턴을 검색했고 해당 없음. 32자 이상의 긴 문자열 검색은 `src/package-lock.json`의 `integrity` 해시와 문서의 경로 문자열만 걸렸다(비밀 아님) | 없음 |
| `.env` 파일이 작업 트리에 있는가 | 통과 | 저장소에서 `.env*` 이름의 파일은 `src/.env.example` 하나다. 값이 모두 비어 있다 | 없음 |
| `.gitignore` | 통과 | 루트: `.env`, `.env.*`(예시 파일 제외), `*.pem`, `*.key`. `src/.gitignore`: `.env`, `.env.*` | 없음 |
| `git status --ignored`로 무시된 비밀 파일 | 통과 | 출력 비어 있음(`node_modules` 제외). 작업 트리에 추적 대상 밖 비밀 파일 없음 | 없음 |
| git 이력의 비밀 | 미검증 | `git log`, `git ls-files`는 셸 권한 요청이 실패해 실행하지 못했다 | 이력 검색(`git log -p -S`)을 별도로 수행 |
| `src/.gitignore`의 `.env.*` 규칙 | 통과(주의) | `src/.env.example`까지 무시 대상이 된다. 현재 `git status`에 나타나지 않으므로 이미 추적 중인 것으로 보인다(추측) | `!.env.example`을 `src/.gitignore`에도 추가 |
| 스크립트 로그에 키·쿼리 문자열 출력 | 통과(해당 없음) | 수집 스크립트가 없다 | 수집기 추가 시 재점검 |
| 위치 권한 요청 | 통과 | `src/` 검색에서 `geolocation`, `navigator.` 사용 없음 | 없음 |

값은 보고서에 쓰지 않았고, 발견 사항도 없다.

---

## 6. 문서와 코드의 불일치

| # | 문서 | 문서의 주장 | 실제 | 심각도 |
|---|---|---|---|---|
| 1 | structure.md | `src/main.tsx`, `src/App.tsx`, `src/hooks/` | `src/`가 자체 `package.json`을 가진 npm 패키지이고, 루트 `package.json`이 `npm --prefix src`로 위임한다. `src/hooks/`는 없고(`useDay`는 `AppState.tsx`에 통합), `src/src/`(Vite 기본 템플릿 `App.tsx`, `main.tsx`, `App.css`, `index.css`)가 남아 있다. 이 파일들이 쓰이는지는 확인하지 않았다 | 낮음 |
| 2 | structure.md | `PRESENTATION.pdf`가 레포 최상단에 있어야 하고 제출 필수 | 루트 목록에 없다 | 중간 |
| 3 | structure.md, tech.md | `scripts/collect/`에 수집 스크립트 | 디렉터리가 없다 | 중간(미착수로 문서화됨) |
| 4 | structure.md | `scripts/`는 `src/engine/`만 의존 | `scripts/eval/run.ts`가 `src/data/sources.json`을 읽는다(데이터 의존). `scripts/verify-build.mjs`는 확인하지 않았다 | 낮음 |
| 5 | tech.md | 지표 단언은 `scripts/eval/run.ts`에 있고 미달이면 테스트 실패 | 단언은 `src/engine/engine.test.ts` 마지막 테스트에 있다. `scripts/eval/write.ts`는 미달 시 종료 코드 1을 낸다. 동작은 맞고 위치만 다르다 | 낮음 |
| 6 | tech.md | 앱은 런타임에 외부 API를 호출하지 않는다 | `KakaoMap.tsx`가 외부 스크립트를 로드한다. 현재는 미사용 | 중간 |
| 7 | product.md | 지도 API는 범위 밖 | `KakaoMap.tsx`가 있고 `.env.example`에 `VITE_KAKAO_JS_KEY`가 있다 | 중간 |
| 8 | infra.md vs product.md/tech.md | infra.md는 카카오맵, ODsay 길찾기, 공공 API 키 사용을 안내한다 | product.md는 지도 API와 길찾기를 범위 밖으로, tech.md는 런타임 외부 호출을 금지로 정했다. steering 사이의 충돌이다. infra.md의 환경변수 이름(`NEXT_PUBLIC_KAKAO_JS_KEY`)과 실제 코드의 이름(`VITE_KAKAO_JS_KEY`)도 다르다 | 중간 |
| 9 | README | "steering 문서 4개" | `.kiro/steering/`에 5개(`product`, `tech`, `structure`, `infra`, `design-system`) | 낮음 |
| 10 | BUILD_REPORT.md | steering을 "3개로 나눠 always로" 둠 | always는 `product`, `tech`, `structure`. 다만 `infra.md`는 `inclusion` 헤더가 없어 steering에 포함되는 방식을 확인하지 못했다. `design-system.md`는 `auto` | 낮음 |
| 11 | README, BUILD_REPORT.md | 테스트 23개 | 일치(23개 통과) | 해당 없음 |
| 12 | README | `npm test`가 "합성 시나리오 평가를 실행" | 일치(`engine.test.ts`의 마지막 테스트) | 해당 없음 |
| 13 | README | 코드 위치 `src/pages/Routes.tsx`, `src/engine/*`, `src/features/*`, `scripts/eval/` | 모두 존재 | 해당 없음 |
| 14 | README 사용 시나리오 | "2호선 강남~잠실 구간 혼잡, 평소 60% → 오늘 95%" 예시 | 코드의 기준선과 문구는 `강남` 단일 지점, 평균 65 등 다른 값이다. 예시일 뿐이라고 보이나 실제 알림 문구와 다르다(추측) | 낮음 |
| 15 | README 기대 효과 | 도움됨 비율은 참고 지표 | 미측정이라고 정확히 적고 있음(Eval 화면 포함) | 해당 없음 |
| 16 | data-and-evaluation/requirements.md | 소스 8종 | 7종 | 낮음 |
| 17 | anomaly-engine/requirements.md | T 초기값 "3.15~3.45 구간" | 코드는 1.5. 구간이 시각으로 읽히는 문구라 혼란을 준다 | 낮음 |
| 18 | README | 샘플 데이터 표기: 화면에 "샘플 데이터" 표시 | 이번 점검에서 `NoticeDetail.tsx`의 태그 표시는 읽지 않았다 | 미검증 |

---

## 문제 목록 (심각도 순)

### 높음

1. **평가 지표가 T와 엔진 품질을 측정하지 못한다.** 평범한 날 값이 기준선 평균 이하라 0건이 보장되고, 감소율 75%는 관련 1건당 무관 3건을 만든 구성에서 나온다. 목표 통과가 제품 주장("안 울리는 날의 가치")을 입증한다고 말하기 어렵다. (3절)
2. **실데이터 0종, 검증 0건.** 스펙 data-and-evaluation 1.1과 2.1이 미충족이다. README와 `SOURCES.md`에는 정직하게 적혀 있으므로 표기 의무는 지켰다. (1.3절)
3. **공휴일 달력이 `runDay`에 연결되지 않아** 요구사항 1.1의 공휴일/공휴일 다음 날 유형이 동작하지 않고, 3.2의 "공휴일 다음 날 패턴 변화"도 처리되지 않는다. (1.1절)

### 중간

4. **tasks.md 체크박스가 실제와 다르다.** 구현된 작업이 미체크이고, 없는 파일(`levels.ts`, `unlocks.ts`)이 체크되어 있다. design.md도 없는 파일을 적고 있다. 스펙 동기화 hook이 있는데도 어긋난다. (1.5절)
5. **`KakaoMap.tsx`**가 범위 밖(지도 API)과 런타임 외부 호출 금지에 충돌한다. 미사용이지만 코드와 `.env.example`에 남아 있다. (6절 #6, #7)
6. **steering 사이의 충돌:** infra.md(카카오맵, ODsay)와 product.md/tech.md(범위 밖, 외부 호출 금지). (6절 #8)
7. **2.5 std=0 테스트 없음.** (c)가 비어 있다. (4절)
8. **'도움됨' 비율 미계산**(스펙 4.4). (1.3절)
9. **엔진에 이상 감지 단계가 없다.** 입력된 `Anomaly`만 판정한다. 스펙 3.2의 5종 감지 대상을 처리한다고 말할 수 없다. (1.1절)
10. **한정판이 마라톤 하나뿐이다.** 스펙 5.2는 "해당 이상의 한정판"이라고 적었다. (1.2절)
11. **`PRESENTATION.pdf` 없음**(structure.md가 제출 필수로 규정). (6절 #2)
12. **평범도 산식과 경로 겹침 계수의 근거가 스펙에 없다.** 평범도의 정규화 기준값 10, `routeOverlap`의 ×3. 값이 바뀌면 지표가 바뀐다. (1.1절)
13. **빌드, 린트, 타입 검사, git 이력 비밀 검색을 실행하지 못했다.** 미검증이다. (2절, 5절)

### 낮음

14. NaN 처리 테스트가 함수 단위에 머물러 있고 `runDay` 수준(잘못된 시각, null, 빈 stops)이 없다. (4절 (d))
15. 상향 한 단계, 알림 있는 날의 평범도, 일반 시각의 돌발형 전달 시각, `classifyTiming`, 상황 매핑 일치에 대한 직접 테스트가 없다. (1.1절)
16. `KiroAvatar`의 `OUTFITS` 키와 `ledger.ts`의 id 일치를 확인하는 테스트가 없다(스펙 5.4). (1.2절)
17. `src/.gitignore`가 `.env.example`까지 무시한다. (5절)
18. 평가 페르소나 `student`가 스펙(17:30)과 다르다. (3절)
19. `evaluation.json`에 다른 번들과 달리 `meta` 객체가 없다. (1.3절)
20. 스펙 소스 개수(8종 vs 7종), README의 steering 개수(4개 vs 5개), `src/src/` 템플릿 잔여 파일, `engine.test.ts`가 `scripts/`를 가져오는 구조. (6절)
21. `npm run evaluate`가 `src/data/evaluation.json`을 덮어쓴다. 내용이 같아서 변경은 없었지만, "읽기 전용 점검"과 충돌하는 부작용이다. 점검 시에는 `git status`로 확인하는 것이 좋다.

---

## 점검하지 못한 것

- `npm run build`, `npm run lint`, `tsc -b`, `npm run verify:build`. 셸 명령 권한 요청이 실패한 경우가 반복돼서 실행하지 못했고, 빌드는 산출물을 만들기 때문에 시도하지 않았다.
- git 이력에 비밀이 들어간 적이 있는지.
- 화면 1~7장 요구사항 전체와 시안 대조, 390px/480px 레이아웃, "샘플 데이터" 태그가 알림 상세에 실제로 표시되는지.
- `.kiro/hooks/spec-sync-on-save.json`, `.kiro/agents/*.json`, `docs/PRD.md`, `docs/기능명세서.xlsx`의 내용. PRD·기능명세서와의 대조는 하지 않았다.
