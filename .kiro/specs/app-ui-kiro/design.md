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

홈에서 `state`와 `outfit`은 함께 합성한다. 이상 상태의 머리·손 소품이 같은 부위의 코스튬보다 우선하고, 나머지 코스튬 장식과 상황 효과는 중복 없이 함께 그린다. 후드가 포함된 우비와 자전거 헬멧은 머리, 우산과 안내판은 손 소품으로 취급한다. `expression`은 표정과 축하·수면 효과를 바꾸되 이상 상태의 장식과 타일 색을 유지한다. 코스튬 선택값은 변경하지 않으므로 평범한 날로 돌아오면 원래 착용 모습이 복원된다. 옷장 미리보기는 기존처럼 선택 코스튬만 보여 준다.

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

## 2026-11-14 통합 변경

- `src/features/transit/`는 장소 선택, 경로 후보, 텍스트 구간과 지도 상태를 담당한다.
- 카카오 장소 검색은 `api/` 서버 모듈이 REST 키를 비공개로 유지하며 중계한다. ODsay는 `VITE_ODSAY_WEB_KEY`가 있으면 브라우저에서 Web/URI 도메인 인증으로 직접 호출하고, 없으면 `/api/transit`을 사용한다.
- `/api/map-config`는 카카오 지도 JS 키와 명시적으로 설정된 ODsay Web 키(`odsayWebKey`)만 반환한다. `ODSAY_API_KEY`는 Server 키로 계속 비공개이며 Web 키의 대체 공개값으로 사용하지 않는다.
- 선택 경로의 실제 좌표와 구간 정보를 저장한다. 지도 로딩·인증 실패에도 수동 등록과 텍스트 안내는 유지한다.
- `src/features/baseline/`는 과거 공공데이터를 조회한다. 현재 지역 신호와 합성 엔진 결과는 별도 카드·출처로 구분한다.
- 실제 현재 열차 혼잡도 미확보 시 과거 평균과 임의 현재값을 연결해 실제 편차를 계산하지 않는다.

## 경로 카드와 평소 통계 표시

- 저장한 경로는 출발·도착을 제목으로, 경유지와 출발 시각을 별도 줄로 표시한다. 접근성 이름에는 전체 경유 순서를 유지한다.
- 평소 통계는 접어서 시작하며 평일·토요일·일요일 버튼으로 비교한다. 선택 상태를 보조 기술에도 전달한다.
- 내선·외선 등 방향별 혼잡도를 두 열의 숫자 카드로 보여 주며 이동 방향을 임의로 추정하지 않는다.
- 역 이용 인원은 별도 펼침 영역으로 분리한다. 출처·집계 기간·단위와 실시간이 아닌 과거 평균이라는 설명을 유지한다.
- 자료 로딩·실패·자료 없음 상태를 구분하고 실패 시 재시도할 수 있다.

## 지도 표시와 기존 경로 연결

- 이름만 저장한 기존 경로에는 지도 연결 버튼을 표시한다. 출발·도착 검색어를 채우되 좌표는 사용자가 검색 결과를 선택해야 확정한다.
- 장소 선택 후에는 ODsay 조회 성공 전에도 카카오 지도를 표시한다. 길찾기 실패 시에도 선택 장소의 지도를 유지하고 이동 경로를 만들어 표시하지 않는다.
- 경로 연결 저장은 기존 경로 ID와 알림 시각을 유지하며 선택한 이동 구간으로 갱신한다.
- 로컬 지도는 카카오 플랫폼 키의 JavaScript SDK 도메인에 정확한 origin 등록이 필요하다. 2026-11-14 확인 시 배포 origin은 SDK 200, `http://127.0.0.1:5173` 및 `http://localhost:5173`은 domain mismatched 401이었다.

## 이상 신호를 반영한 길찾기

- `features/transit/recommendation.ts`가 ODsay의 실제 후보(최대 5개)에 대해 확인된 제보와 정류장·시간 겹침을 계산한다. 새로운 길찾기 경로를 만들어 내지는 않는다.
- 제보는 오늘 작성, 작성자 외 고유 사용자 2명 이상 확인, 제보 시각부터 1시간 및 서울 자정 이전 조건을 만족해야 한다. 만료·미확인·미래 작성 시각은 제외한다. 공식 운행장애와 실시간 열차 혼잡은 미연동 상태를 표시한다.
- 이름은 공백·마지막 ‘역’만 정규화해 정확히 비교한다. 구간별 누적 소요시간에 앞뒤 5분을 더한 예상 통과 범위를 사용하며 역별 정밀 도착 시각으로 표시하지 않는다. 출발·도착 공통 신호도 비교한다.
- 첫 번째 후보보다 겹치는 신호 건수가 적고, 경유 정류장 목록이 제공된 후보 중 최단 경로 대비 추가시간 제한을 만족하는 대안을 추천한다. 기본 제한은 15분, 선택지는 0/15/30/60분이다. 동률은 소요시간·환승 순으로 정한다. 과거 혼잡도(%)나 제보의 임의 수치를 서로 비교하지 않는다.
- 추천 후보를 자동 선택해 지도·구간·저장에 연결한다. 사용자가 다른 후보를 선택할 수 있고, 출발 시각·제보·추가시간 조건이 바뀌면 재계산한다. 제보 없음, 부분 영향 잔존, 대안 없음, 경유 정보 부족을 구분한다.
- 합성 혼잡 시연은 별도 체크박스를 사용자가 켠 경우에만 적용하고 모든 관련 표시에서 시연임을 밝힌다. 실제 경로 조회 실패를 합성 경로로 대체하지 않는다.
- 제보 데이터는 현재 앱의 로컬 저장소 범위이며 사용자 간 서버 공유·실시간 수집 기능을 의미하지 않는다.
