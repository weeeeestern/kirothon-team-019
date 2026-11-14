# 설계: 이상 판정 엔진 (anomaly-engine)

## 개요

백엔드 없이 브라우저에서 도는 순수 TypeScript 모듈이다. 입력은 번들된 JSON(기준선, 오늘 신호)과 사용자 상태이고, 출력은 알림 목록과 오늘 평범도다. UI와 분리해 평가 스크립트(`data-and-evaluation` 스펙)가 같은 함수를 재사용한다.

```
번들 JSON ──▶ baseline.lookup ─┐
오늘 신호 ───▶ detect ─────────┼─▶ impact ─▶ decide(T) ─▶ buildNotice ─▶ schedule
등록 경로 ───▶ overlap ────────┘                │
피드백 ─────▶ threshold.update ◀────────────────┘
```

## 모듈과 경로

| 경로 | 책임 |
|---|---|
| `src/engine/types.ts` | 공용 타입 (아래) |
| `src/engine/baseline.ts` | 키 조회, 이력 부족 시 평년값 대체, 학습 상태 |
| `src/engine/impact.ts` | 편차, 경로 겹침, 시간 겹침, 영향도 |
| `src/engine/classify.ts` | 예정형/돌발형 분류, 상황 이름 매핑 |
| `src/engine/decide.ts` | T 비교, 알림 생성 여부 |
| `src/engine/notice.ts` | 3요소 문구, 판단 근거 한 줄, 전달 시점 |
| `src/engine/threshold.ts` | 피드백으로 T 조정 |
| `src/engine/ordinariness.ts` | 오늘 평범도 |

## 데이터 모델

```ts
type DayType = 'weekday' | 'weekend' | 'holiday' | 'afterHoliday';
type Situation = 'ordinary' | 'construction' | 'rain' | 'dust' | 'marathon' | 'strike' | 'congestion'; // src/theme/situation.ts와 동일
type Timing = 'scheduled' | 'sudden';

interface BaselineKey { dayType: DayType; slot: number /* 0~47 */; area: string }
interface Baseline { mean: number; std: number; learning: boolean }

interface Route { id: string; district: string; stops: string[]; departAt: string /* HH:mm */; days: DayType[] }

interface Anomaly {
  id: string; situation: Exclude<Situation, 'ordinary'>; timing: Timing;
  area: string; value: number; startsAt: string; endsAt: string;
  source: 'official' | 'synthetic' | 'report';
}

interface Notice {
  anomalyId: string; routeId: string; situation: Situation;
  what: string; delta: string; action: string;   // 3요소
  reason: string; learning: boolean;              // 판단 근거, 학습 상태
  deliverAt: string; impact: number;
}
```

## 핵심 규칙

- 편차 `z = std === 0 ? 0 : (value - mean) / std`. 영향도는 `z × routeOverlap × timeOverlap`로 계산하고 음수 편차는 0으로 자른다.
- `routeOverlap`: 이상 구간과 등록 구간(정류장 목록)의 교집합 비율.
- `timeOverlap`: 이상 시간대와 `departAt ± 30분` 윈도우의 겹침 비율.
- `decide`는 `impact >= T`일 때만 `Notice`를 만든다. 아니면 빈 배열이다.
- 전달 시점: 예정형은 전날 22:00, 돌발형은 `departAt - 17분`(15~20분의 가운데).
- 제보 기반 이상(`source: 'report'`)은 신뢰도 통과분만 입력으로 들어온다. 편차 값이 없으므로 `citizen-report-points` 스펙에서 정한 고정 편차를 쓴다.
- 문구는 "~해요" 체. 샘플 데이터면 알림에 표시용 플래그를 붙인다.

## 오류 처리

- 기준선 키가 없으면 같은 `dayType`의 인접 시간대, 그다음 서울 평균값 순으로 대체하고 `learning: true`로 둔다.
- 입력 값이 NaN이거나 누락이면 해당 이상을 건너뛰고 알림을 만들지 않는다. 오류를 던지지 않는다.

## 테스트 전략

- 단위 테스트(`vitest`): 영향도 경계값(T와 같을 때 알림 생성), std=0, 겹침 0, 예정형/돌발형 시점, T 상·하한 클램프.
- 속성 테스트 대신 합성 시나리오 3종(평범한 날, 이상 주입일, 고정 임계값 비교)으로 지표를 확인한다. 시나리오는 `data-and-evaluation`에서 정의한다.

## 설계만 있는 항목 (구현 제외)

- **출발 시각 보정**: 앱 사용 시각 로그의 중앙값으로 `departAt`을 이동한다. 개인 이력 수집 원칙과 충돌하므로 기기 내 저장만 허용하는 방향으로 설계한다.
- **구간 기준선 정밀화**: 자주 쓰는 구간의 개인 관측값을 지역 기준선에 가중 평균한다.
