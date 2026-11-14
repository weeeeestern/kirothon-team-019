# 잠잠 데이터 계약

기준일: 2026-11-14. 아래는 현재 실행되는 코드의 계약이다. 앱 진입점은 `src/index.html` → `src/main.tsx` → `src/App.tsx`이며, Vite의 루트는 `src/`다. 저장소 루트의 npm 명령은 이 앱으로 전달된다.

## 데이터 흐름

```text
정적 합성 번들 + 저장한 경로 + 개인 임계값 → runDay → 홈·알림
시민 제보 → 서로 다른 이웃 2명 확인 → toAnomaly → runDay
사용자 반응 → reducer → 포인트·해금·임계값 → localStorage
```

엔진과 합성 평가는 같은 `runDay(routes, anomalies, state, date)`를 사용한다. 앱 실행 중 외부 교통 API는 호출하지 않는다. 지도·위치 추적·서버·DB·실제 푸시는 없다.

## 경로와 판정

정의: `src/engine/types.ts`, 검증: `src/features/routes/route.ts`.

| 필드 | 형식 |
|---|---|
| `Route.id` | 고유 문자열 |
| `district` | 자치구 표시명 |
| `stops` | 출발·경유·도착 순서, 2~12개, 공백 제거 후 각 1~40자 |
| `departAt` | `HH:mm`, 00:00~23:59 |
| `days` | `weekday`, `weekend`, `holiday`, `afterHoliday` 중 1개 이상 |

역 이름은 비교할 때 양끝 공백과 끝의 `역`을 제거한다. 부분 문자열로 매칭하지 않으며 같은 지점을 중복 등록할 수 없다. 수동 경로의 경유지는 직접 입력한다. ODsay 검색 경로는 응답의 정류장·구간과 좌표를 저장하며, 수동 입력과 검색 경로를 구분한다. 경로 수정은 목록 순서를 유지한다. 삭제 후에도 과거 제보·포인트 기록은 남지만 해당 경로의 제보 확인 버튼은 비활성화된다.

`Anomaly`: `id`, `situation`, `timing`, `area`, `value`, `startsAt`, `endsAt`, `source`.
- situation: construction / rain / dust / marathon / strike / congestion. ordinary는 결과 상태에만 사용한다.
- timing: scheduled / sudden. 명시된 값을 사용한다.
- source: synthetic / report / official. 현재 official 입력은 없다.
- 시간은 HH:mm, 종료가 시작보다 이르면 자정을 지나는 구간으로 해석한다.

영향도는 양수 편차 × 경로 겹침 × 시간 겹침이다. 경로 겹침은 `min(1, 일치 지점 수 / 등록 지점 수 × 3)`, 시간 겹침은 출발 ±30분과 이상의 교집합 / 이상 지속시간이다. 현재 기준선은 `baseline.ts`의 합성 상수다. 같은 요일 유형의 인접 시간대 또는 기본값으로 대체하면 학습 중으로 표시한다. 초기 T는 1.5, 피드백마다 ±0.1, 범위는 0.5~3이다.

요일 계산은 서울 날짜를 기준으로 한다. `getDayType`은 공휴일 배열을 받지만 `runDay`에 검증된 공휴일 번들을 연결하는 작업은 미완료다. 실제 공휴일 판정을 완료했다고 해석하면 안 된다.

## 알림

`Notice`는 제목(`what`), 비교(`delta`, `baselineValue`, `currentValue`, `unit`), 권고(`action`), 근거(`reason`), 학습 여부(`learning`), 전달 예정 시각(`deliverAt`), 영향도(`impact`)를 포함한다.

알림 ID는 `서울 날짜:경로 ID:이상 ID`다. 같은 입력은 중복 제거한다. 예정형은 전날 22:00, 돌발형은 출발 -17분으로 표시한다. 이것은 앱 내 시연이며 스케줄러가 실제로 메시지를 보내지 않는다. 제보의 value=120은 시연용 대체 지수이며 실측 혼잡도 %로 표시하지 않는다.

홈 샘플은 2026-11-16 평일에 고정된다. 시민 제보의 유효 기간은 실제 서울 날짜를 사용하며 당일 자정까지다. 홈 시나리오 선택은 새로고침하면 평범한 날로 돌아온다.

## 저장소와 보상

정의: `src/state/store.ts`, 키: `jamjam.v1`, 스키마 version=1.

| 필드 | 내용 |
|---|---|
| routes | 등록 경로 배열, 빈 배열도 유효 |
| threshold | 개인 임계값 |
| feedback | 알림 ID → helpful / notNeeded |
| reports | 제보 원본과 확인자·도움됨 사용자 배열 |
| ledger | 중복되지 않는 id, amount(1/5/10), reason |
| read | 읽은 알림 ID 배열 |
| outfit | 착용한 OUTFITS 키 |
| unlocked | 획득한 한정판 키 배열 |

파싱·구조 검증에 실패하면 초기 시드로 복구한다. 저장소 쓰기가 불가능하면 메모리로 계속 동작하고 화면에 저장 불가 안내를 표시한다. 브라우저 간 동기화는 없다.

`CitizenReport`는 id, author, routeId, situation, place, time, note(최대100자), createdAt(ISO), confirmations, helpfulUsers를 가진다. 같은 경로의 서로 다른 비작성자 2명 확인으로 confirmed를 계산한다. pending/confirmed 문자열 자체는 저장하지 않는다. 이웃 A/B는 실제 계정이 아닌 로컬 시연 값이다.

적립 ID는 report:제보ID(+10), helpful:제보ID:사용자(+5), feedback:알림ID(+1)다. 같은 ID는 중복 적립하지 않는다. Lv1~5 경계는 0/20/50/100/200 P다. 레벨별 기본 아이템과 당일 마라톤 한정판 `marathon26`은 `OUTFITS`에서 관리한다. 해금 안내는 새로 얻은 순간에만 보이며 새로고침 후 재생하지 않는다. 착용은 해금 검사를 거치고 홈에도 적용된다.

## 번들 출처와 평가

공통 타입은 `src/data/types.ts`의 `DataMeta`, `BundleFile<T>`, `SourceRecord`다. `meta.mode`는 real/synthetic, `collectedAt`은 실제 수집 시각 또는 null, `generatedAt`은 합성 생성 기준 시각이다. 현재 모든 번들은 합성이고 API 수집은 null이다. 소스 목록은 `src/data/sources.json`, 기록은 `data/SOURCES.md`가 기준이다.

`npm run evaluate`는 `scripts/eval/run.ts`로 지표를 계산해 `src/data/evaluation.json`을 쓴다. 24개 통제된 시나리오에서 평범한 날 0건, 관련 이상10/10, 알림10건/비교군40건(75%감소)을 확인했다. 도움됨 비율은 null이다. 비교군은 경로·시간을 고려하지 않은 z≥1이며 실제 경쟁 앱의 결과가 아니다. 모든 수치는 **합성 시나리오 기준**이다.

실데이터 전환에는 수집기와 정규화 fixture, 신호별 단위가 맞는 기준선, 수집 메타데이터, 공휴일 번들 연결이 필요하다.
