# 설계: 앱 화면과 키로 (app-ui-kiro)

## 개요

React + TypeScript + Vite 위에 antd-mobile v5로 모바일 웹을 만든다. 화면은 엔진 결과를 읽어 보여 주기만 하고 판정 로직을 갖지 않는다. 색, 간격, 컴포넌트 규칙은 `design/DESIGN.md`가 기준이며 여기서는 반복하지 않는다. Kiro steering `design-system`이 UI 작업 때 자동으로 그 문서를 불러온다.

```
번들 JSON + 등록 경로 + 제보 상태
        │
        ▼
 useDay()  ──▶ anomaly-engine.runDay ──▶ { notices, ordinariness, situation }
        │
        ▼
 Home / NoticeDetail / Report / KiroRoom / Eval
        │
        └──▶ KiroAvatar (design/animation/kiro-avatar-soft.js)
```

## 경로와 폴더

| 경로 | 책임 |
|---|---|
| `src/main.tsx` | `ConfigProvider(koKR)`, `data-prefers-color-scheme="dark"` 고정 |
| `src/theme/theme.css`, `src/theme/situation.ts` | `DESIGN.md` 5장 그대로 |
| `src/App.tsx` | 라우터, 하단 탭 레이아웃, `SafeArea` |
| `src/pages/Home.tsx` | 홈 (평범한 날 / 이상 감지) |
| `src/pages/NoticeDetail.tsx` | 알림 상세, 피드백 |
| `src/pages/Report.tsx` | 제보 입력 |
| `src/pages/KiroRoom.tsx` | 레벨, 옷장 |
| `src/pages/Routes.tsx` | 경로 목록, 등록, 수정 |
| `src/pages/Eval.tsx` | 평가 결과, 데이터 소스 표기 |
| `src/components/` | `KiroAvatar`, `KiroHero`, `TodayScore`, `RoutePill`, `RouteCard`, `QuietCard`, `IncidentCard`, `ComparisonBar`, `ActionBox`, `EvidenceNote`, `FeedbackCard`, `WardrobeItem`, `PointBadge`, `PushBanner`, `PageHeader`, `BottomTabBar` |
| `src/state/AppState.tsx` | 등록 경로, 알림 읽음·피드백, 착용 아이템을 Context + `localStorage`로 보관 |
| `src/hooks/useDay.ts` | 엔진 호출과 결과 메모이제이션 |

경로는 `/`(홈), `/notice/:id`, `/report`, `/room`, `/routes`, `/eval`이다.

## 엔진과 화면의 계약

```ts
// src/engine/index.ts 가 내보내는 값 (anomaly-engine 스펙)
interface DayResult {
  notices: Notice[];          // 비어 있으면 알림 0건
  ordinariness: number;       // 0~100
  situation: Situation;       // 오늘 가장 영향도가 큰 이상, 없으면 'ordinary'
}
```

- 홈은 `notices.length === 0`이면 평범한 날 구성, 아니면 이상 구성을 그린다. 분기는 이 한 곳에서만 한다.
- 알림 상세는 `Notice`의 `what / delta / action / reason / learning`을 그대로 `제목 / ComparisonBar / ActionBox / EvidenceNote`에 매핑한다. 화면이 문구를 새로 만들지 않는다.
- `KiroAvatar`의 `state`에는 `DayResult.situation`을 그대로 넘긴다. 이상 유형과 `state`가 1:1이라 변환 표가 필요 없다.

## 키로 표정·움직임

| 상황 | 옵션 (`DESIGN.md` 6장 표 기준) |
|---|---|
| 평범한 날 | `{ state: 'ordinary' }` |
| 이상 감지 | `{ state }` 후 처음 한 번 `expression: 'surprise'` |
| 피드백 '도움이 됐어요' | `{ expression: 'joy' }` |
| 제보 성공 | `{ expression: 'proud', motion: 'hop' }` |
| 착용 | `{ outfit, expression: 'heart', motion: 'hat' }` |
| 해금 | `{ outfit, expression: 'sparkle', motion: 'unlock' }` |
| 23:00 이후 | `{ expression: 'sleep', motion: 'sleepin' }` |

시각은 `new Date()`로 읽고, 시연용으로 `?now=HH:mm` 쿼리로 덮어쓸 수 있게 한다.

## 화면별 구성 요약

- **홈:** `PageHeader` → 인사말과 Hero 문구 → `KiroHero` → `TodayScore` → `RoutePill` → `QuietCard` 또는 `IncidentCard` → (평범한 날) 레벨 카드.
- **알림 상세:** `NavBar` → 상황 `Tag` + 시각 → `KiroAvatar` → 제목·비교 문장 → `ComparisonBar` → `ActionBox` → `EvidenceNote`(근거, 학습 상태, 출처, 기준 시각) → `FeedbackCard`.
- **제보:** 안내 카드 → `Form`(`Selector`, `Picker`, `DatePicker`, `TextArea`) → CTA. 완료 시 `Toast` + 키로 표정 변경.
- **키로의 방:** 키로 카드 → 다음 레벨 카드(`ProgressBar`) → 포인트 획득 방법 → `Tabs`(기본 옷장 / 한정판) + `WardrobeItem` 그리드.
- **경로:** 경로 `RouteCard` 목록 → "경로 추가"(`Popup` 안에 자치구, 역/정류장, 출발 시각) → 선택 자치구의 사용 가능 신호 `Tag` 목록.
- **평가:** 지표 4개 카드(목표 대비 통과 여부) → "합성 시나리오 기준" 문구 → 소스별 `Tag`(실데이터 / 합성)와 수집 시각.

## 오류 처리

- 엔진이 알림 0건을 돌려주는 것은 정상이다. 빈 화면 대신 평범한 날 구성을 보여 준다.
- `localStorage`가 깨졌으면 페르소나 시드로 초기화하고 사용자에게는 알리지 않는다.
- `KiroAvatar.render`가 알 수 없는 옵션을 받으면 `ordinary`로 대체한다.
- 번들 JSON의 수집 시각이 없으면 "수집 시각 미상"으로 표시한다.

## 접근성과 성능

- 터치 영역 44px: 36px 칩과 24px 태그는 위아래 여백으로 채운다.
- 키로 SVG는 `aria-label`(예: "졸고 있는 키로")을 붙인다. 장식이므로 문구는 화면 텍스트와 중복되지 않게 한다.
- `prefers-reduced-motion` 때 키로 반복 움직임을 끈다.

## 테스트 전략

- 컴포넌트 테스트(`vitest` + `@testing-library/react`): 홈의 평범한 날/이상 분기, 알림 상세의 3요소 표시, 피드백 1회 제한, 제보 필수값 검사, 잠긴 아이템 착용 불가.
- 수동 확인: 390px 폭, 480px 초과 폭 가운데 정렬, 하단 탭 안전 영역.
- 시안 대조: `design/images/scene1~3.png`, `01`~`04`와 나란히 놓고 확인한다(시각 회귀 도구는 쓰지 않는다).

## 구현 반영 (2026-11-14)

실제 내비게이션은 hash 기반 `#home/#notices/#report/#kiro/#routes/#eval`이다. 엔진 메모이제이션은 별도 useDay 대신 AppState에 통합했다. 작은 표시 요소는 페이지 내부 JSX로 구성하고 `BottomNav`, `KiroAvatar`, `LevelCard`, `PageHeader`, `UnlockDialog`를 공유한다.

경로 검증은 `src/features/routes/route.ts`에서 공통 처리한다. 경유지는 배열의 출발·도착 사이에 추가·삭제하고 같은 지점 중복을 차단한다. 경로가 없으면 홈 점수를 대시로 표시하고 제보 화면에서 경로 등록으로 안내한다. UnlockDialog는 이전 저장 상태와 현재 해금 상태를 비교해 신규 획득만 표시한다. 착용은 store.outfit을 홈과 옷장에서 함께 읽는다. 출처 표기는 `src/data/provenance.ts`와 sources.json을 공유한다.
