# 데이터 구조와 키값 구현 가이드

기준일: 2026-11-14. 다른 구현자가 데이터 생산, 판정 엔진, 화면을 연결할 수 있도록 **현재 소스 코드의 계약**을 정리했다. `설계만 있음`과 `제안`은 현재 동작과 구분한다. 모든 파일 경로는 저장소 루트 기준이다.

## 1. 먼저 확인할 현재 상태

| 영역 | 현재 상태 | 기준 파일 |
|---|---|---|
| 경로·이상 입력 | 합성 JSON 2개를 정적 import | `src/data/synthetic/routes.json`, `anomalies.json` |
| 기준선 | TypeScript 내부 상수, 수집 데이터가 아님 | `src/engine/baseline.ts` |
| 엔진 타입 | 구현되어 있음 | `src/engine/types.ts` |
| 판정 결과·피드백 | React Context 메모리 상태 | `src/state/AppState.tsx` |
| 제보 | 화면 내 임시 배열, 확인·엔진 연결 없음 | `src/pages/Report.tsx` |
| 포인트·옷장 | 피드백 횟수에서 계산, 선택은 화면 상태 | `src/pages/KiroRoom.tsx` |
| 서버 API·DB·localStorage | 구현 없음. 저장 키와 HTTP endpoint도 없음 | 설계는 `.kiro/specs/` 참고 |
| 지도 | 카카오 JS SDK 로더 코드 있음 | `src/components/KakaoMap.tsx` |

**앱 연결 주의:** `src/package.json`이 있는 디렉터리가 Vite 프로젝트 루트다. 현재 `src/index.html`은 `src/src/main.tsx`의 기본 템플릿을 실행하고, `@` alias와 TypeScript 검사 대상도 `src/src/`를 가리킨다. 이 문서에서 설명하는 서비스 코드는 `src/main.tsx`, `src/App.tsx`, `src/engine/` 등에 별도로 있다. 서비스 화면을 실행하려면 진입점·alias·타입 검사 대상을 먼저 맞춰야 한다. 기본 템플릿의 빌드 성공은 서비스 연결 완료를 의미하지 않는다.

## 2. 데이터 흐름과 담당 경계

```text
routes.json.items ───────────┐
anomalies.json.items ────────┼─> runDay(routes, anomalies, state, date)
baseline.ts의 기준선 ───────┤       └─> { notices, ordinariness, situation }
threshold + feedbackCounts ┘                    └─> 화면
피드백 ─> updateThreshold + 횟수 증가 ─> 다시 판정
```

| 담당 | 전달할 데이터 | 연결 지점 |
|---|---|---|
| 데이터 수집 | `BundleFile<Anomaly>`와 같은 단위의 기준선 | 현재는 합성 JSON import. 수집기·실데이터 전환은 미구현 |
| 엔진 | `Route[]`, `Anomaly[]`, `EngineState`, `Date`를 받아 `EngineResult` 반환 | `src/engine/index.ts`의 `runDay` |
| 화면 | 결과를 표시하고 `helpful` / `notNeeded` 피드백 전달 | `useApp()` |
| 제보·보상 | 검증된 제보를 `Anomaly`로 변환하고 적립 기록 관리 | 설계만 있음. 8절 참고 |

## 3. 공통 코드값과 형식

문자열은 대소문자를 포함해 그대로 사용한다. 한글 표시명은 저장 키로 사용하지 않는다.

| 키/타입 | 허용값 | 의미 |
|---|---|---|
| `DayType` | `weekday`, `weekend`, `holiday`, `afterHoliday` | 평일, 주말, 공휴일, 공휴일 다음 평일 |
| `Timing` | `scheduled`, `sudden` | 예정형, 돌발형 |
| `Anomaly.source` | `official`, `synthetic`, `report` | 공공 API, 합성 데이터, 시민 제보 |
| `DataMeta.mode` | `real`, `synthetic` | 번들의 실데이터/합성 구분. 타입은 설계에 있으며 현재 파일은 모두 `synthetic` |
| 피드백 | `helpful`, `notNeeded` | 도움이 됐어요, 필요 없었어요 |
| 제보 상태 | `pending`, `confirmed` | 검증 대기, 확인됨. 현재 UI는 `pending`만 생성 |
| 탭 | `home`, `notices`, `report`, `kiro` | 홈, 알림, 제보, 키로의 방. URL 경로가 아닌 화면 상태 키 |

| `Situation` | 표시명 | 현재 분류 | 제보 입력 가능 |
|---|---|---|---|
| `ordinary` | 평범 | 이상 입력 불가. 결과·캐릭터용 | 아니오 |
| `construction` | 공사 | `scheduled` | 예 |
| `rain` | 폭우 | `sudden` | 아니오 |
| `dust` | 미세먼지 | `sudden` | 아니오 |
| `marathon` | 마라톤 | `scheduled` | 예 |
| `strike` | 파업·집회 | `scheduled` | 예 |
| `congestion` | 혼잡 | `sudden` | 예 |

- 시각 필드는 `HH:mm` 24시간 표기로 전달한다. 현재 타입은 `string`이며 형식 검증기는 없다.
- `createdAt`, `collectedAt`은 ISO 8601 문자열이다. 기존 데이터는 UTC `Z` 표기다.
- 날짜를 포함하지 않는 `startsAt` / `endsAt`은 현재 하루 안의 구간만 처리한다. 자정을 넘는 구간은 지원하지 않는다.
- 구현 시 시간대는 `Asia/Seoul`로 통일하는 것을 권장한다. 현재 `getDayType`은 UTC 날짜 문자열과 실행 환경의 로컬 요일을 함께 쓰므로 서울 시간대 계약이 보장되지는 않는다.
- ID는 문자열이다. 현재 시드의 `r1`, `a1`은 예시일 뿐 형식 제약이 아니다. 연결할 데이터 집합 안에서는 중복되지 않아야 한다.

## 4. 파일 포맷과 입력 데이터

### 4.1 번들 공통 구조

설계의 `BundleFile<T>` 형태를 두 합성 파일이 사용한다. 타입 선언 자체는 아직 공용 소스에 없다.

```ts
interface DataMeta {
  source: string;
  collectedAt: string;
  mode: 'real' | 'synthetic';
  note?: string;
}
interface BundleFile<T> {
  meta: DataMeta;
  items: T[];
}
```

| 필드 | 필수 | 설명 / 예시 |
|---|---|---|
| `meta.source` | 예 | 소스 이름. 현재 `synthetic`. 항목의 `source` enum과는 다른 자유 문자열 |
| `meta.collectedAt` | 예 | 수집/생성 시각. 현재 `2026-11-14T00:00:00Z` |
| `meta.mode` | 예 | 현재 `synthetic`. 단순히 `real`로 바꿔도 실제 API 수집이 실행되지 않음 |
| `meta.note` | 아니오 | 예: `API 미승인 대체 합성 데이터` |
| `items` | 예 | `Route[]` 또는 `Anomaly[]` |

현재 샘플 배지는 `anomaliesRaw.meta.mode === 'synthetic'` 하나로 결정한다. 소스별 배지나 수집 시각 표시는 아직 없다. 입력은 `as Route[]` / `as Anomaly[]`로 단언하므로 런타임 스키마 검증을 하지 않는다.

### 4.2 경로 `Route`

아래 필드는 모두 필수다.

| 필드 | 타입 | 의미 / 현재 처리 |
|---|---|---|
| `id` | `string` | 경로 ID → `Notice.routeId` |
| `district` | `string` | 자치구명. 예: `강남구`. 판정에서는 미사용 |
| `stops` | `string[]` | 역·정류장명. 예: `["신논현", "강남", "역삼", "선릉"]` |
| `departAt` | `string` | 출발 시각. 예: `08:00` |
| `days` | `DayType[]` | 이용 요일 유형. **현재 엔진은 이 필드로 경로를 필터링하지 않음** |

```json
{
  "id": "r1",
  "district": "강남구",
  "stops": ["신논현", "강남", "역삼", "선릉"],
  "departAt": "08:00",
  "days": ["weekday"]
}
```

### 4.3 이상 신호 `Anomaly`

아래 필드는 모두 필수다. 이는 외부 기관의 원본 응답 스키마가 아니라 앱 내부 입력 계약이다.

| 필드 | 타입 | 의미 / 현재 처리 |
|---|---|---|
| `id` | `string` | 이상 ID → `Notice.anomalyId` |
| `situation` | `Situation`에서 `ordinary` 제외 | 상황 종류 |
| `timing` | `Timing` | 데이터에 존재하지만 알림 생성은 `situation`으로 다시 분류 |
| `area` | `string` | 기준선 조회와 경로 매칭에 쓰는 지역/역 이름 |
| `value` | `number` | 기준선과 비교할 관측값. 유한 숫자, 기준선과 같은 단위로 제공해야 함 |
| `startsAt` | `string` | 시작 시각. **기준선 slot도 이 시각으로 결정** |
| `endsAt` | `string` | 종료 시각. 같은 날 `startsAt < endsAt`으로 제공 |
| `source` | `official` / `synthetic` / `report` | 알림의 출처 문구 |

```json
{
  "id": "demo-congestion",
  "situation": "congestion",
  "timing": "sudden",
  "area": "강남",
  "value": 95,
  "startsAt": "08:00",
  "endsAt": "08:30",
  "source": "synthetic"
}
```

위 예시는 알림 생성 확인용이며 기존 `a1`의 시간대와 다르다. 기존 시드는 `a1` 혼잡, `a2` 파업, `a3` 폭우, `a4` 마라톤, `a5` 공사이며 `dust` 시드는 없다.

**실데이터 연결 전 결정할 것:** 현재 기준선 키에 신호 종류·단위가 없고, 모든 `delta` 문구가 `%`로 출력된다. 강수량, 미세먼지 농도, 혼잡도 원자료를 그대로 섞어 넣으면 안 된다. 수집기가 비교 가능한 지표로 정규화하거나 `metric` / `unit`을 타입·기준선 키에 추가해야 한다. 어느 방식도 아직 구현되지 않았다. 파업처럼 값이 낮아지는 현상도 현재 양의 편차 계산만으로는 탐지하지 못하므로 방향 변환 규칙이 필요하다.

### 4.4 기준선 `BaselineKey` / `Baseline`

| 필드 | 타입 | 의미 |
|---|---|---|
| `dayType` | `DayType` | 판정 날짜의 요일 유형 |
| `slot` | `number` | 0~47 정수. `floor((시 × 60 + 분) / 30)` |
| `area` | `string` | `Anomaly.area`와 동일한 문자열 |
| `mean` | `number` | 같은 지표·단위의 평균 |
| `std` | `number` | 같은 지표·단위의 표준편차. 0이면 편차를 0으로 처리 |
| `learning` | `boolean` | 대체 기준선 사용 등 학습 중 표시 |

저장 키는 **`${dayType}-${slot}-${area}`**다. 예: `weekday-16-강남`은 평일 08:00~08:29다. 단순 자치구명 `강남구`로 바꾸면 같은 키로 조회되지 않는다.

현재 상수 전체:

| 키 | `mean` | `std` | `learning` |
|---|---:|---:|---|
| `weekday-16-강남` | 65 | 12 | false |
| `weekday-17-강남` | 72 | 15 | false |
| `weekday-16-신촌` | 58 | 10 | false |
| `weekday-17-홍대입구` | 61 | 11 | false |
| `weekday-33-여의도` | 55 | 13 | false |
| `weekday-34-여의도` | 60 | 14 | false |
| `weekday-16-광화문` | 50 | 10 | false |
| `weekday-default` | 55 | 15 | true |
| `weekend-default` | 42 | 12 | true |
| `holiday-default` | 35 | 10 | true |
| `afterHoliday-default` | 68 | 18 | true |

조회 순서는 정확한 키 → 같은 지역·요일의 `slot-1`, `slot+1`, `slot-2`, `slot+2` → 해당 요일의 `default`다. 인접 시간대 사용 시 `learning: true`로 바꾼다. 요일 기본값까지 없으면 `{ mean: 50, std: 15, learning: true }`를 사용한다.

## 5. 판정 규칙과 결과

### 5.1 입력 상태와 공식

```ts
interface EngineState {
  threshold: number;
  feedbackCounts: { helpful: number; notNeeded: number };
}
```

초기 상태는 `{ threshold: 1.5, feedbackCounts: { helpful: 0, notNeeded: 0 } }`다. `runDay`는 `threshold`만 판정에 사용한다.

1. `z = std === 0 ? 0 : max(0, (value - mean) / std)`.
2. 경로 겹침: `s.includes(area) || area.includes(s)`인 정류장 수를 `matched`라 할 때 `min(1, matched / stops.length * 3)`. 빈 경로는 0. 역 코드·위경도 기반 매칭이 아니다.
3. 시간 겹침: 이상 구간과 `departAt ± 30분`의 교집합 분 수를 **이상 구간 전체 길이**로 나누고 최대 1로 제한한다. 겹치지 않거나 이상 구간 길이가 0 이하면 0.
4. `impact = z * routeOverlap * timeOverlap`.
5. `impact >= threshold`인 **경로 × 이상 쌍마다** 알림을 만든다. 일일 한 건으로 병합하거나 전송 이력을 중복 제거하지 않는다.
6. 알림이 없으면 `ordinariness = 100`, `situation = 'ordinary'`. 있으면 `ordinariness = max(0, round(100 - min(100, maxImpact * 10)))`, `situation`은 영향도가 가장 큰 알림의 상황이다.

입력 `NaN`과 표준편차 0에 대한 처리는 있지만 모든 필수값·범위의 검증은 없다. 데이터 수집/입력 경계에서 빈 지역명, 잘못된 시각, 음수 표준편차, 비유한 수, 중복 ID를 검증해야 한다.

### 5.2 알림 `Notice`

모든 필드가 필수이며 엔진이 생성한다. 별도 `id`, `area`, `source`, `date`, `readAt` 필드는 없다.

| 필드 | 타입 | 의미 |
|---|---|---|
| `anomalyId` | `string` | 원본 `Anomaly.id` |
| `routeId` | `string` | 대상 `Route.id` |
| `situation` | `Situation` | 상황·색·캐릭터 공통 키 |
| `what` | `string` | 무엇이 달라졌는지. `${area} ${상황 표시명}` |
| `delta` | `string` | 평소/오늘 수치·배율을 포함한 표시용 문장 |
| `action` | `string` | 상황별 권장 행동 |
| `reason` | `string` | 편차 σ와 출처를 포함한 표시용 문장 |
| `learning` | `boolean` | 기준선의 학습 중 여부 |
| `deliverAt` | `string` | `전날 22:00` 또는 출발 17분 전 `HH:mm`. 실제 예약 timestamp가 아님 |
| `impact` | `number` | 편차 × 경로 겹침 × 시간 겹침 |

`deliverAt`은 표시만 하며 푸시/예약 발송은 구현되어 있지 않다. 00:00~00:16 출발의 전날 시각 처리도 보완해야 한다.

**연결 키 제안:** 한 번의 판정 내 알림 식별은 `(routeId, anomalyId)`를 사용한다. 여러 날짜의 저장·피드백에는 판정 날짜 또는 별도 `noticeId`도 필요하다. 현재 화면은 `anomalyId`만 React key로 사용하고 `submitFeedback`도 ID를 저장하지 않는다.

### 5.3 결과 `EngineResult`와 재현 예시

4절의 경로와 `demo-congestion` 한 건, 초기 상태, `new Date('2026-11-17T12:00:00+09:00')`를 `runDay`에 전달한다. 실행 시간대는 `Asia/Seoul`로 둔다.

- 기준선: `weekday-16-강남`, 평균 65 / 표준편차 12.
- `z = 2.5`, 경로 겹침 `0.75`, 시간 겹침 `1`, 영향도 `1.875`.
- 임계값 1.5 이상이므로 아래 결과를 반환한다.

```json
{
  "notices": [{
    "anomalyId": "demo-congestion",
    "routeId": "r1",
    "situation": "congestion",
    "what": "강남 혼잡",
    "delta": "평소 65% → 오늘 95% (약 1.5배)",
    "action": "혼잡이 예상돼요. 5~10분 일찍 출발하세요",
    "reason": "기준선 대비 편차 2.5σ · 출처: 합성 데이터",
    "learning": false,
    "deliverAt": "07:43",
    "impact": 1.875
  }],
  "ordinariness": 81,
  "situation": "congestion"
}
```

빈 이상 배열의 결과는 `{ "notices": [], "ordinariness": 100, "situation": "ordinary" }`다. 기존 시드에 이상 항목이 있다고 항상 알림이 나오는 것은 아니다. 날짜, 겹침 비율, 임계값에 따라 0건일 수 있다.

## 6. 피드백·포인트·꾸미기 키

### 6.1 현재 피드백 동작

| 입력 | 임계값 변경 | 횟수 키 | 현재 방 화면의 포인트 기여 |
|---|---|---|---:|
| `helpful` | -0.1 | `feedbackCounts.helpful` | 1회당 5P |
| `notNeeded` | +0.1 | `feedbackCounts.notNeeded` | 1회당 1P |

임계값은 0.5~3.0으로 제한하고 소수점 둘째 자리까지 정리한다. 현재 포인트는 `helpful * 5 + notNeeded`이며 ledger는 없다. 피드백 직후 재판정하므로 임계값 변화로 알림이 사라질 수도 있다. 화면의 1회 클릭 방지만 있고 탭 재진입·새로고침을 통한 중복은 영속적으로 막지 않는다.

### 6.2 레벨과 옷장

| 레벨 | 표시명 | 최소 누적 포인트 |
|---|---|---:|
| 1 | 새싹 이웃 | 0 |
| 2 | 동네 탐험가 | 50 |
| 3 | 경로 수호자 | 150 |
| 4 | 지킴이 | 300 |
| 5 | 우리동네 영웅 | 500 |

옷장 항목의 필드는 `id: string`, `label: string`, `situation: Situation`, `unlockAt: number`, `emoji: string`이다. 현재는 포인트 도달로 선택 가능해지며 구매 차감은 없다.

| `id` | 표시명 | `situation` | `unlockAt` |
|---|---|---|---:|
| `default` | 기본 | `ordinary` | 0 |
| `rain` | 우비 | `rain` | 50 |
| `construction` | 안전모 | `construction` | 100 |
| `marathon` | 머리띠 | `marathon` | 150 |
| `dust` | 마스크 | `dust` | 200 |
| `strike` | 집회 복장 | `strike` | 300 |

기본 옷의 ID는 `ordinary`가 아니라 **`default`**다. `congestion` 옷은 없다. `KiroAvatar`는 현재 `situation`과 선택적 `size`(기본 120)를 받고 이모지를 렌더링한다. 디자인용 애니메이션 렌더러와는 아직 연결되지 않았다.

## 7. 화면·지도에서 사용하는 데이터

`useApp()`은 `result`, `routes`, `threshold`, `feedbackCounts`, `submitFeedback(anomalyId, feedback)`, `isSample`을 제공한다. 새로고침하면 임계값과 횟수가 초기화된다. 제보 목록·옷 선택은 해당 화면을 떠날 때도 초기화된다.

- 테마 조회: `situationColor(situation)` → `{ accent, bg, tile, label }`. 각 색상 값의 기준은 `src/theme/situation.ts`다.
- 지도 props: `lat?: number`, `lng?: number`, `markers?: { lat: number; lng: number; label?: string }[]`, `height?: number`(픽셀). 기본 중심은 강남, 기본 높이는 180이다.
- 알림 화면의 지도 좌표는 `what.split(' ')[0]`로 찾는다. `what`은 표시 문장이므로 향후에는 `area` 또는 좌표를 별도 구조화 필드로 전달하는 편이 안전하다.

| 지역 키 | `lat` | `lng` |
|---|---:|---:|
| 강남 | 37.4979 | 127.0276 |
| 신촌 | 37.5553 | 126.9365 |
| 여의도 | 37.5215 | 126.9246 |
| 광화문 | 37.5759 | 126.9769 |
| 홍대입구 | 37.5572 | 126.9249 |

현재 알림 비교 막대의 평소 값은 60으로 고정되고 오늘 값은 영향도로 계산된다. `delta`의 실제 기준선·관측값과 일치하는 데이터 시각화가 아니다. 홈의 경로 요약도 하드코딩되어 있다. 새 화면에서는 `routes` 및 구조화된 기준선·관측값을 연결해야 한다.

## 8. 설계만 있는 데이터 계약

아래 항목은 구현 완료된 타입/저장소/API가 아니다. 원문은 [제보 설계](../.kiro/specs/citizen-report-points/design.md), [데이터 설계](../.kiro/specs/data-and-evaluation/design.md)를 참고한다.

### 8.1 제보와 적립 내역

현재 `ReportItem`은 `id`, `situation`, `place`, `note`, `status`, `createdAt`만 가진다. 장소는 trim 후 필수, 메모는 선택이며 **trim 전 JS 문자열 길이 80 이하**로 검사한다. ID는 `r_${Date.now()}`이고 항상 `pending`으로 생성된다. `+10P`는 안내 문구만 있으며 실제 적립되지 않는다.

설계의 확장 계약:

```ts
interface Report {
  id: string;
  reporterId: string;
  situation: 'construction' | 'strike' | 'marathon' | 'congestion';
  place: string;
  occurredAt: string;
  note: string;
  status: 'pending' | 'confirmed';
  confirmedBy: string[];
  helpedBy: string[];
  createdAt: string;
}
interface LedgerEntry {
  id: string;
  userId: string;
  at: string;
  kind: 'report' | 'helpful' | 'feedback';
  points: number;
  refId: string;
}
interface UserState {
  userId: string;
  level: number;
  unlocked: string[];
  limitedToday: string[];
}
```

- `reporterId` / `userId`는 사용자 연결 키, `confirmedBy` / `helpedBy`는 사용자 ID 목록, `refId`는 적립 원인인 제보/알림의 연결 키다. 실제 사용자 식별·공유 저장 방식은 미구현이다.
- 설계는 같은 경로의 제보자 외 서로 다른 사용자 2명 확인 후 `confirmed`로 바꾸고 엔진에 전달한다. `place`를 `area`에 매핑하는 규칙과 시간 구간 생성 규칙은 추가로 정해야 한다.
- 고정 편차 `z = 3.0`은 설계값이다. **`Anomaly.value = 3`을 의미하지 않는다.** 현재 엔진은 원시 관측값으로 z를 계산하므로 변환기 또는 별도 편차 입력 계약이 필요하다.
- 설계의 포인트는 제보자에게 제보 +10, 도움됨 +5, 피드백 응답자에게 +1이다. 현재 화면의 `helpful` 응답자 +5 계산과 다르다. 중복 방지 키와 적립 대상부터 맞춰야 한다.
- 설계의 메모 제한은 100자, 현재 UI는 80자다. 통합 시 하나로 확정해야 한다.
- `limitedToday: string[]` 타입과 설계의 날짜별 키 설명이 일치하지 않는다. 날짜→아이템 매핑 및 만료 규칙은 확정이 필요하다. localStorage 키 이름도 아직 정해져 있지 않다.

### 8.2 실데이터·평가 산출물

| 예정 파일/설정 | 용도 | 현재 상태 |
|---|---|---|
| `src/data/baselines.json` | 수집 기준선 | 없음. `baseline.ts` 상수만 있음 |
| `src/data/signals.json` | 오늘 신호 | 없음. 합성 `anomalies.json`만 있음 |
| `src/data/regions.json` | 자치구별 사용 가능 신호 | 없음. 필드 계약도 추가 정의 필요 |
| `src/data/evaluation.json` | 평가 결과 | 없음 |
| `data/SOURCES.md` | API 검증 기록 | 없음 |
| `scripts/collect/`, `scripts/eval/` | 수집·합성 평가 실행 | 없음 |
| `VITE_DATA_MODE` | `real` / `synthetic` 모드 선택 | 설계만 있음. 현재 앱은 읽지 않음 |

설계의 평가 결과 필드:

| 필드 | 타입 | 의미/목표 |
|---|---|---|
| `basis` | 문자열 리터럴 `합성 시나리오 기준` | 측정 근거 표시 |
| `ordinaryDayNotices` | `number` | 평범한 날 알림 수, 목표 0 |
| `detectionRate` | `number` | 주입 이상 중 탐지 비율, 목표 0.8 이상 |
| `reductionVsFixed` | `number` | `1 - engine / fixed`, 목표 0.5 이상 |
| `helpfulRatio` | `number \| null` | 도움됨 비율, 참고값 |
| `sources` | `{ name: string; mode: 'real' \| 'synthetic' }[]` | 사용 소스와 모드 |

비율은 0~1 단위로 표시 변환한다. 단, `reductionVsFixed`는 엔진 알림이 비교군보다 많으면 음수가 될 수 있다. 비교군은 설계상 `z >= 1.0`이며, 분모가 0일 때의 처리와 탐지 중복 집계 기준은 평가 구현 시 명시해야 한다. 위 목표는 측정 완료된 성과가 아니다.

## 9. 환경변수와 API 키

실제 키 값은 공유 문서에 넣지 않는다. [환경변수 예시](../src/.env.example)는 빈 값만 제공하며, 기존 `.env`는 그대로 유지한다. 아래 기존 이름은 `.env`에서 **이름만 확인한 목록**이며 발급 유효성·API 승인 여부는 검증하지 않았다.

| 변수 이름 | 용도 | 현재 코드 연결 / 취급 |
|---|---|---|
| `VITE_KAKAO_JS_KEY` | 브라우저 카카오맵 JavaScript 키 | `KakaoMap.tsx`가 실제로 읽는 이름. 현재 `.env`에는 이 이름이 없음 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 기존 카카오 JS 키 이름 | `.env`에 있으나 현재 코드가 읽지 않음. Vite에서는 위 이름에 같은 종류의 키를 설정해야 함 |
| `NEXT_PUBLIC_KAKAO_REST_API_KEY` | 카카오 REST 키 | `.env`에만 있음. 서버/수집기 전용으로 취급. 공개용 변수명으로 옮기지 않음 |
| `PUBLIC_DATA_API_KEY` | 공공데이터포털 | 수집용 설정. 소비 코드 없음 |
| `SEOUL_DATA_API_KEY` | 서울 열린데이터광장 | 수집용 설정. 소비 코드 없음 |
| `SEOUL_SUBWAY_REALTIME_API_KEY` | 서울 지하철 실시간 도착 | 수집용 별도 키. 소비 코드 없음 |
| `ODSAY_API_KEY` | ODsay 대중교통 API | 설정만 존재. 경로/정보 연동 없음 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 설정만 존재. 클라이언트/DB 연동 없음 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 | 설정만 존재. 현재 코드가 읽지 않음 |
| `DATABASE_URL` | DB 연결 문자열 | 서버/수집기 전용. DB 연결 코드 없음 |

현재 프로젝트는 Next.js가 아니라 Vite다. `NEXT_PUBLIC_*` 이름이 있다고 현재 코드에 자동 연결되지는 않는다. 지도 연결에 필요한 이름은 `VITE_KAKAO_JS_KEY` 하나이며, 다른 비밀키를 일괄 `VITE_*`로 변경해 브라우저에 전달해서는 안 된다. 향후 서버용 카카오 REST 변수 이름은 `KAKAO_REST_API_KEY`처럼 공개 접두사 없이 정리하는 것을 권장하지만, 현재 적용된 이름은 아니다.

설정 절차:

1. 새 개발 환경에서 `src/.env.example`을 참고해 `src/.env`를 만든다. 기존 파일이 있으면 덮어쓰지 않고 필요한 키만 추가한다.
2. 지도 구현을 연결할 때 `VITE_KAKAO_JS_KEY`에 JavaScript 키를 넣는다. REST 키와 혼용하지 않는다.
3. 환경변수를 수정한 뒤 개발 서버를 재시작한다. 서비스 화면 연결은 1절의 진입점 정리가 선행되어야 한다.
4. 수집기 작성 시 루트 `.env` 또는 `src/.env` 중 읽을 위치를 명시한다. 현재 두 파일을 동기화하거나 수집기에 로드하는 코드는 없다.

현재 교통·기상 데이터는 정적 합성 데이터다. 지도 로더는 외부 SDK를 요청하므로, 기존 문서의 “런타임 외부 API 없음” 설명은 지도 코드까지 포함하면 맞지 않는다.

## 10. 다른 구현자가 작업을 시작하는 순서

1. 서비스 진입점·alias·TypeScript 검사 대상을 연결한다.
2. 3~5절의 타입과 예시로 엔진 입출력을 맞춘다. 원본 타입은 `src/engine/types.ts`를 가져다 쓴다.
3. `area`/역 이름 정규화, 지표 단위, 날짜·시간대, `days` 필터를 확정한다.
4. UI는 결과와 등록 경로를 읽도록 연결하고 하드코딩된 경로·비교 막대를 교체한다.
5. 제보 확인·포인트 ledger·영속 저장은 8절의 미구현 항목을 기준으로 별도 구현한다.
6. API 키를 설정한 사실과 실데이터 검증 성공을 구분한다. 검증된 수집 결과만 `mode: 'real'`로 표시한다.

확인에 사용할 최소 사례는 알림 0건, 5.3절의 알림 1건, `impact === threshold`, 경로/시간 겹침 0, 피드백 임계값 상·하한이다. 현재 `src/package.json`에는 `test` 스크립트가 없으므로 기존 README의 `npm test`를 검증 완료 절차로 간주하지 않는다.
