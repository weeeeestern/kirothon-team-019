# 평소 디자인 시스템

"평소"는 평소와 다른 날에만 알려 주는 출퇴근 이상 알림 서비스예요. 이 문서는 `design/` 폴더의 화면 시안과 키로 캐릭터 시안을 하나의 규칙으로 정리한 거예요. UI는 Ant Design의 모바일 라이브러리인 [antd-mobile](https://mobile.ant.design/)을 기반으로 만들고, CSS 변수와 일부 컴포넌트를 우리 서비스에 맞게 바꿔서 써요.

Kiro에서는 [`.kiro/steering/design-system.md`](../.kiro/steering/design-system.md)가 이 문서를 자동으로 불러와요. 사용법은 [11장](#11-kiro에서-쓰는-법)에 있어요.

## 0. design 폴더 구성

| 경로 | 내용 |
|---|---|
| `DESIGN.md` | 이 문서. UI 규칙의 기준 |
| `images/scene1.png` | 홈, 평범한 날 (알림 없음, 평범도 92%) |
| `images/scene2.png` | 홈, 이상 감지 (공사, 평범도 61%, 상단 푸시 배너) |
| `images/scene3.png` | 알림 상세, 파업 (혼잡 비교, 따릉이 대안 경로) |
| `images/01 · 평소 — 조용한 오늘.png` | 홈, 평범한 날 (레벨 카드 포함 버전) |
| `images/02 · 알림 — 행동과 피드백.png` | 알림 상세, 혼잡 (비교 막대, 행동 제안, 피드백) |
| `images/03 · 제보 — 동네를 돕는 미션.png` | 동네 제보 입력 |
| `images/04 · 키로의 방 — 성장과 꾸미기.png` | 키로의 방, 레벨과 옷장 |
| `animation/NOTES.md` | 키로 표정, 애니메이션 트리거·길이·이징 |
| `animation/kiro-avatar-soft.js`, `.css` | 키로 렌더러 (`KiroAvatar.render`, `KiroAvatar.mount`) |
| `animation/outfits.html`, `outfits_soft.png` | 상황별 모습, 기본 옷장, 한정판 |
| `animation/expressions.html`, `expressions.png` | 표정 12종 |
| `animation/anim.html`, `anim_soft.mp4` | 애니메이션 데모 |

시안은 두 묶음이에요. `scene*`은 홈과 알림의 흐름을, `01`~`04`는 4개 탭 전체를 보여 줘요. 둘이 다른 부분은 [10장](#10-팀이-정해야-할-것)에 모아 뒀어요.

## 1. 디자인 원칙

1. **조용한 게 기본이에요.** 평범한 날은 어둡고 차분한 화면에 보라색 키로가 졸고 있어요.
2. **다른 날에만 색이 바뀌어요.** 이상이 생기면 키로의 원, 평범도 숫자, 상태 점, 태그가 그 상황의 색으로 바뀌어요. 공사는 호박색, 파업은 빨강처럼요.
3. **알림 한 건에는 할 일이 꼭 들어가요.** "무엇이 / 평소 대비 얼마나 / 무엇을 할지" 순서로 보여 줘요.
4. **숫자로 말해요.** "혼잡해요" 대신 "평소 52% → 오늘 95%, 약 1.8배"처럼 비교 수치를 보여 줘요.
5. **근거와 데이터 출처를 숨기지 않아요.** 판단 근거, 샘플 데이터 여부, 기준 시각을 작은 글씨로 항상 표시해요.

## 2. 색상

### 기본 팔레트

| 이름 | 값 | 쓰는 곳 |
|---|---|---|
| `bg` | `#0B0A10` | 앱 바탕 |
| `surface` | `#1A1921` | 기본 카드, 입력창, 선택 칩, 헤더 원형 버튼 |
| `surfaceBrand` | `#221D33` | 보라 기운 카드(레벨, 피드백, 안내, 대안 경로), 포인트 배지, 하단 탭 활성 배경 |
| `surfaceBrandStrong` | `#33254D` | 선택된 아이템 카드 |
| `surfaceMuted` | `#352C45` | 보조 버튼("필요 없었어요") |
| `primary` | `#8B4DFF` | 주요 버튼, 진행 막대, 선택 칩, 선택 테두리, 평범한 날 키로 원 |
| `primaryText` | `#C9B1FF` | 포인트, 레벨, 링크성 텍스트("변경", "‹ 홈으로"), 활성 탭 |
| `success` | `#9BE08C` | "특이사항 없음" 같은 정상 상태 문구 |
| `badge` | `#F0455A` | 안 읽은 알림 개수 배지, 헤더 종 아이콘의 빨간 점 |
| `text` | `#FFFFFF` | 제목, 본문 |
| `textSecondary` | `#A09DAA` | 부제목, 설명 |
| `textTertiary` | `#6E6B78` | 주석, 데이터 출처, 비활성 탭 |
| `track` | `#2E2A3A` | 진행 막대의 빈 부분 |
| `neutralBar` | `#5E5A6E` | 비교 막대의 "평소" 값 |
| `border` | `#2A2833` | 카드 테두리(scene 시안의 얇은 외곽선) |
| `divider` | `#1F1E26` | 하단 탭 위 구분선 |

### 상황 색

이상 종류마다 색이 하나씩 있어요. 키로 렌더러의 `SITUATIONS`에 정의된 타일 색을 기준으로 하고, UI용 강조색과 배경색을 짝지어 써요.

| 상황 | `state` | 키로 타일 (렌더러) | UI 강조 (숫자, 점, 태그 글자) | UI 배경 (태그, 아이콘 칸) |
|---|---|---|---|---|
| 평범 | `ordinary` | `#A57BFF` | `primaryText` `#C9B1FF` | `surfaceBrand` `#221D33` |
| 공사 | `construction` | `#F3C98A` | `#F2C46B` | `#33291A` |
| 비 | `rain` | `#6BA3C9` | `#8CC4EA` | `#17283A` |
| 미세먼지 | `dust` | `#C4A574` | `#D9BE8E` | `#2E2619` |
| 마라톤 | `marathon` | `#F090A8` | `#F5A3B8` | `#3A1E27` |
| 파업·집회 | `strike` | `#E8928A` | `#FF6B6B` | `#3A1A1E` |
| 혼잡 | `congestion` | `#C97A9A` | `#F2C46B` | `#33291A` |

- 혼잡은 가장 흔한 이상이라 공사와 같은 호박색을 UI 강조로 써요. `02 · 알림 — 행동과 피드백.png`의 비교 막대와 행동 제안 박스가 이 색이에요.
- 비, 미세먼지, 마라톤의 UI 강조색과 배경색은 시안에 없어서 타일 색에서 뽑은 제안값이에요. 화면을 만들 때 확인해요.
- 상황 색은 그 상황을 알릴 때만 써요. 장식이나 일반 버튼에는 쓰지 않아요.
- 행동 버튼("이 길로 가기", "제보하고 +10 P 받기")은 상황과 상관없이 항상 `primary`예요.

### 대비

- 흰 글자와 `primary` 버튼의 대비는 약 4.6:1로 WCAG AA를 만족해요.
- `textTertiary`는 바탕 대비가 4.5:1보다 낮아요. 13px 이하의 주석에만 쓰고, 중요한 정보에는 쓰지 않아요.

## 3. 타이포그래피

글꼴은 [Pretendard](https://github.com/orioncactus/pretendard)를 쓰고, 없으면 시스템 한글 글꼴로 대체해요.

```
'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif
```

| 단계 | 크기 / 굵기 | 예시 |
|---|---|---|
| Score | 72px / 800 | 홈 가운데 평범도 "92", "61" |
| Display | 44px / 800 | 알림 화면의 큰 숫자 |
| Title | 26px / 800 | 화면 제목 "평소", "내 경로 알림" |
| Hero | 24px / 800 | 화면 메시지 "오늘은 평소와 같아요", "출근길에 공사가 생겼어요" |
| Heading | 18px / 700 | 카드 제목 "따릉이로 바꾸면 12분 빨라요" |
| Body | 15px / 400~600 | 설명, 입력값 |
| Caption | 13px / 400 | 부제목, 판단 근거, 데이터 출처, 섹션 라벨("권장 행동", "대안") |
| Micro | 11px / 400 | 정책 안내, 노선 다이어그램 라벨 |

숫자 비교(52%, 95%, 240 / 300 P)는 `font-variant-numeric: tabular-nums`로 자리를 맞춰요.

## 4. 간격, 모서리, 크기

시안 `01`~`04`는 2배율(800px 폭 = 기기 400px)이라 시안 픽셀을 2로 나눠 1배율(px)로 정리했어요. `scene*`은 휴대폰 프레임이 포함된 이미지라 비율만 참고했어요. 측정값은 4px 단위로 반올림했어요.

### 간격 단계

모든 간격은 아래 단계 중 하나만 써요. 단계에 없는 값(10px, 18px 등)은 쓰지 않아요.

| 토큰 | 값 | 주로 쓰는 곳 |
|---|---|---|
| `--pyeongso-space-1` | 4px | 제목과 부제목 사이, 아이콘과 라벨 사이 |
| `--pyeongso-space-2` | 8px | 칩 사이, 버튼 두 개 사이, 태그 안 좌우 여백 |
| `--pyeongso-space-3` | 12px | 카드 안 줄 사이, 섹션 라벨과 입력창 사이 |
| `--pyeongso-space-4` | 16px | 카드 안쪽 여백, 카드 사이 |
| `--pyeongso-space-5` | 20px | 큰 카드(알림, 대안) 안쪽 여백 |
| `--pyeongso-space-6` | 24px | 화면 좌우 여백, 헤더와 화면 메시지 사이 |
| `--pyeongso-space-8` | 32px | 섹션 사이(제보 화면의 입력 묶음 사이, 키로 위아래) |
| `--pyeongso-space-10` | 40px | 화면 메시지와 키로 사이 |

### 화면 뼈대

| 영역 | 값 |
|---|---|
| 화면 좌우 여백 | 24px (`space-6`) |
| 상태 표시줄 아래 → 화면 제목 | 8px (상태 표시줄 높이는 `SafeArea position="top"`) |
| 화면 제목 → 부제목 | 4px |
| 헤더 → 화면 메시지(Caption 인사말) | 24px |
| 인사말 → Hero 메시지 | 4px |
| Hero 메시지 → 본문 첫 요소 | 32px |
| 본문 마지막 요소 → 하단 탭 | 24px + 하단 탭 높이 |
| 최대 폭 | 480px, 가운데 정렬 |

### 컴포넌트별 크기

| 컴포넌트 | 높이 | 안쪽 여백 | 모서리 | 기타 |
|---|---|---|---|---|
| 기본 카드 (`Card`, `RouteCard`, `QuietCard`) | 내용에 맞춤 | 16px | 20px | 카드 사이 16px |
| 큰 카드 (알림 카드, `AlternativeCard`, `FeedbackCard`) | 내용에 맞춤 | 20px | 20px | 카드 안 블록 사이 16px |
| `ActionBox` | 내용에 맞춤 | 16px | 16px | 제목과 설명 사이 4px |
| 큰 버튼 (CTA) | 50px | 좌우 16px | 12px (`scene*` 대안 카드는 999) | 글자 17px / 700 |
| 기본 버튼 | 40px | 좌우 16px | 12px | 두 개 나란히 놓을 때 사이 8px |
| 입력창 (`Picker` 트리거, 시각) | 50px | 좌우 16px | 12px | 섹션 라벨과 사이 12px |
| `TextArea` | 최소 68px | 16px | 12px | 글자 수는 오른쪽 아래 |
| `Selector` 칩 | 36px | 좌우 12px | 8px | 칩 사이 가로 8px, 세로 8px, 3열 |
| `Tag` | 24px | 좌우 8px | 8px | 글자 13px / 600 |
| `PointBadge` | 32px | 좌우 14px | 999 | 글자 15px / 700 |
| `RoutePill` | 36px | 좌우 16px | 999 | 점 10px, 점과 글자 사이 8px |
| 헤더 원형 버튼 (종) | 44px | – | 999 | 아이콘 22px |
| `ProgressBar` | 8px | – | 999 | 막대와 아래 라벨 사이 12px |
| `ComparisonBar` | 막대 12px | – | 999 | 두 줄 사이 16px, 라벨 폭 48px |
| `WardrobeItem` | 102px | 12px | 16px | 3열, 사이 8px, 썸네일 40px |
| `IncidentCard` 아이콘 칸 | 56px | – | 16px | 아이콘 칸과 글자 사이 16px |
| `PushBanner` | 64px | 좌우 16px | 999 | 앱 아이콘 40px, 모서리 10px |
| `TabBar` | 56px + 하단 안전 영역 | – | – | 활성 탭 배경 64×52px, 모서리 16px, 아이콘 24px, 라벨 12px |
| `KiroHero` | 지름 280px (이상이 있는 날 260px) | – | 999 | 위아래 32px |

### 모서리 단계

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--adm-radius-s` | 8px | 칩, 태그 |
| `--adm-radius-m` | 12px | 버튼, 입력창 |
| `--pyeongso-radius-card-inner` | 16px | `ActionBox`, 옷장 아이템, 아이콘 칸, 활성 탭 배경 |
| `--adm-radius-l` | 20px | 카드 |
| 999px | 완전한 원형 | 배지, 알약, 진행 막대, 원형 버튼 |

### CSS 변수로 쓰기

간격과 모서리도 5장의 `theme.css`에 변수로 넣고, 컴포넌트에서는 숫자 대신 변수를 써요.

```css
html[data-prefers-color-scheme='dark'] {
  --pyeongso-space-1: 4px;
  --pyeongso-space-2: 8px;
  --pyeongso-space-3: 12px;
  --pyeongso-space-4: 16px;
  --pyeongso-space-5: 20px;
  --pyeongso-space-6: 24px;
  --pyeongso-space-8: 32px;
  --pyeongso-space-10: 40px;
  --pyeongso-page-x: var(--pyeongso-space-6);
  --pyeongso-radius-card-inner: 16px;
  --pyeongso-control-height: 40px;
  --pyeongso-control-height-lg: 50px;
  --pyeongso-tabbar-height: 56px;
}

.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 var(--pyeongso-page-x)
    calc(var(--pyeongso-tabbar-height) + var(--pyeongso-space-6) + env(safe-area-inset-bottom));
}
```

antd-mobile 컴포넌트는 컴포넌트 CSS 변수로 맞춰요.

```tsx
<Selector
  columns={3}
  showCheckMark={false}
  style={{
    '--gap': 'var(--pyeongso-space-2)',
    '--padding': '8px 12px',
    '--border-radius': 'var(--adm-radius-s)',
    '--checked-color': 'var(--adm-color-primary)',
    '--checked-text-color': '#FFFFFF',
    '--color': 'var(--pyeongso-surface)',
  } as React.CSSProperties}
  options={situationOptions}
/>

<Button
  block
  color="primary"
  size="large"
  style={{ '--border-radius': 'var(--adm-radius-m)', height: 'var(--pyeongso-control-height-lg)' } as React.CSSProperties}
>
  제보하고 +10 P 받기
</Button>
```

- `Card`는 컴포넌트 CSS 변수가 없어요. `className`으로 배경 `var(--pyeongso-surface)`, 안쪽 여백 `var(--pyeongso-space-4)`, 모서리 `var(--adm-radius-l)`을 줘요.
- 터치 영역은 최소 44×44px이에요. 36px 칩과 24px 태그를 누를 수 있게 만들 때는 위아래 여백으로 44px를 채워요.

## 5. antd-mobile 테마 설정

UI 라이브러리는 [antd-mobile v5](https://mobile.ant.design/)를 써요. 같은 Ant Design 계열이고, 하단 탭바, 상단 바, 칩 선택, 아래에서 올라오는 선택창처럼 이 서비스 화면에 필요한 모바일 컴포넌트가 들어 있어요. 아이콘은 집 모양 아이콘이 있는 `@ant-design/icons`를 써요. 이 패키지는 antd 없이 단독으로 쓸 수 있어요.

```bash
npm install antd-mobile @ant-design/icons
```

antd-mobile은 테마를 CSS 변수로 바꿔요. 다크 테마는 `<html>`에 `data-prefers-color-scheme="dark"`를 붙여서 켜고, 그 위에 우리 색을 덮어써요. 덮어쓰는 선택자는 antd-mobile 다크 테마와 같은 `html[data-prefers-color-scheme='dark']`를 쓰고, antd-mobile CSS보다 나중에 불러와요.

```css
/* src/theme/theme.css */
html[data-prefers-color-scheme='dark'] {
  /* antd-mobile 전역 변수 */
  --adm-color-primary: #8B4DFF;
  --adm-color-success: #9BE08C;
  --adm-color-warning: #F2C46B;
  --adm-color-danger: #FF6B6B;

  --adm-color-text: #FFFFFF;
  --adm-color-text-secondary: #A09DAA;
  --adm-color-weak: #6E6B78;
  --adm-color-light: #5E5A6E;
  --adm-color-border: #2A2833;
  --adm-border-color: #2A2833;
  --adm-color-box: #1A1921;
  --adm-color-background: #1A1921;
  --adm-color-background-body: #0B0A10;
  --adm-color-fill-content: #1A1921;

  --adm-radius-s: 8px;
  --adm-radius-m: 12px;
  --adm-radius-l: 20px;

  --adm-font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
    'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  --adm-font-size-main: 15px;

  /* 우리 서비스 전용 변수 (2장 팔레트) */
  --pyeongso-bg: #0B0A10;
  --pyeongso-surface: #1A1921;
  --pyeongso-surface-brand: #221D33;
  --pyeongso-surface-brand-strong: #33254D;
  --pyeongso-surface-muted: #352C45;
  --pyeongso-primary-text: #C9B1FF;
  --pyeongso-track: #2E2A3A;
  --pyeongso-neutral-bar: #5E5A6E;
  --pyeongso-divider: #1F1E26;
  --pyeongso-badge: #F0455A;
}

body {
  background: var(--pyeongso-bg);
  color: var(--adm-color-text);
  font-family: var(--adm-font-family);
}
```

```ts
// src/theme/situation.ts — 상황 색 (2장 표). 컴포넌트에서는 이 객체만 참조해요.
export const situationColor = {
  ordinary: { accent: '#C9B1FF', bg: '#221D33' },
  construction: { accent: '#F2C46B', bg: '#33291A' },
  rain: { accent: '#8CC4EA', bg: '#17283A' },
  dust: { accent: '#D9BE8E', bg: '#2E2619' },
  marathon: { accent: '#F5A3B8', bg: '#3A1E27' },
  strike: { accent: '#FF6B6B', bg: '#3A1A1E' },
  congestion: { accent: '#F2C46B', bg: '#33291A' },
} as const;

export type Situation = keyof typeof situationColor;
```

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd-mobile';
import koKR from 'antd-mobile/es/locales/ko-KR';
import './theme/theme.css';
import App from './App';

document.documentElement.setAttribute('data-prefers-color-scheme', 'dark');

createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={koKR}>
    <App />
  </ConfigProvider>,
);
```

- 앱은 항상 다크 테마예요. 시스템 설정에 따라 밝은 테마로 바뀌지 않게 `data-prefers-color-scheme`을 코드에서 고정해요.
- 컴포넌트 하나의 모양만 바꿀 때는 그 컴포넌트의 CSS 변수를 `style`이나 클래스로 넘겨요. 예: `<ProgressBar style={{ '--fill-color': '...', '--track-color': '...' }} />`
- 색이 필요하면 하드코딩하지 말고 CSS 변수(`var(--adm-*)`, `var(--pyeongso-*)`)나 `situationColor`를 써요.
- `Toast`, `Dialog`는 정적 메서드(`Toast.show`)로 띄워도 CSS 변수 테마가 적용돼요.

## 6. 컴포넌트

### antd-mobile 컴포넌트를 그대로 쓰는 것

| 시안의 요소 | antd-mobile 컴포넌트 | 설정 |
|---|---|---|
| "키로 보기", "이 길로 가기", "제보하고 +10 P 받기" | `Button` | `color="primary"`, CTA는 `size="large" block`, 높이와 모서리는 4장 표 |
| "필요 없었어요" | `Button` | `fill="solid"`, `--background-color: var(--pyeongso-surface-muted)` |
| "경로 관리 ›", "변경" | `Button` | `fill="none"`, 글자 `--pyeongso-primary-text` |
| 알림 상세 상단 "‹ 홈으로" | `NavBar` | `back="홈으로"`, `onBack`, 배경 투명 |
| 하단 탭 | `TabBar` + `SafeArea` | `safeArea`, 각 탭에 `badge` |
| 헤더 종 버튼의 빨간 점, 탭 알림 개수 | `Badge` | 점은 `content={Badge.dot}`, 개수는 `content={n}`, `color="var(--pyeongso-badge)"` |
| 경로·비교·입력·대안 카드 | `Card` | 배경 `--pyeongso-surface`, 모서리 `--adm-radius-l` |
| 레벨 진행 막대 | `ProgressBar` | `percent`, `--fill-color: var(--adm-color-primary)`, `--track-color: var(--pyeongso-track)`, `--track-width: 8px` |
| 상황 유형(공사, 지연·혼잡 …) | `Selector` | `columns={3}`, `--checked-color: var(--adm-color-primary)`, `--checked-text-color: #FFFFFF`, `showCheckMark={false}` |
| "어디인가요?" | `Picker` 또는 `Popup` + `SearchBar` + `List` | 아래에서 올라오는 역 목록 |
| "언제 확인했나요?" | `DatePicker` | `precision="minute"`, 기본값은 지금 시각 |
| "한 줄 설명" | `TextArea` | `maxLength={100}`, `showCount` |
| 제보 입력 묶음 | `Form` | `layout="vertical"`, 라벨은 시안의 섹션 제목 |
| 옷장 탭(소품, 의상, 한정판) | `Tabs` | `--active-line-color: var(--adm-color-primary)`, `--active-title-color: var(--pyeongso-primary-text)` |
| "샘플 데이터", "파업", "재배치 보너스 +30" | `Tag` | `color`에 상황 강조색, 아래 "상태 태그" 규칙 |
| 제보 완료, 포인트 적립 | `Toast` | `Toast.show({ content: '+10 P 적립됐어요' })` |
| 옷 착용 확인, 레벨 해금 | `Dialog` 또는 `CenterPopup` | 키로를 크게 보여 주는 축하 화면 |
| 위치·화면 아래 여백 | `SafeArea` | `position="top"`, `position="bottom"` |

### 직접 만드는 컴포넌트

antd-mobile에 없어서 직접 만드는 컴포넌트예요. 내부는 CSS 변수와 `situationColor`를 써요.

**`PageHeader`**
화면 제목(Title), 선택 부제목(Caption), 오른쪽 액션으로 구성돼요. 오른쪽 액션은 `PointBadge` 또는 종 버튼이에요([10장](#10-팀이-정해야-할-것) 참고).

**`PointBadge`**
"P 240" 알약 모양 배지예요. 배경 `surfaceBrand`, 글자 `primaryText`, 굵기 700이에요.

**`PushBanner`**
`scene2`, `scene3` 위쪽의 푸시 알림 배너예요. 앱 아이콘(보라 사각형 안 흰 키로) + "평소" + 알림 제목 + "지금"으로 구성돼요. 배경 `surfaceBrand`, 모서리 999, 테두리 `border`예요. 데모에서 실제 푸시 대신 화면 안에서 보여 줄 때 써요. 3초 뒤 위로 사라지고, 누르면 알림 상세로 가요.

**`KiroHero`**
홈 가운데의 큰 키로예요. `KiroAvatar`(아래)를 원형 타일과 함께 그리고, 원 바깥에 그 상황 색으로 은은한 빛(glow)을 둬요. 지름은 평범한 날 280px, 이상이 있는 날 260px이에요.

**`TodayScore`**
"오늘 평범도" 라벨, 큰 숫자(Score), "%", 한 줄 상태 문구로 구성돼요.
- 평범한 날: 숫자는 흰색, 문구 "출근길 · 이상 없음"
- 이상이 있는 날: 숫자는 상황 강조색, 문구 "출근길 · 행동이 필요해요"
- 100에 가까울수록 평소와 같아요.

**`RoutePill`**
"● 2호선 강남 → 선릉 · 08:10 출발" 알약 모양 표시예요. 점 색은 상황 강조색이고, 이상이 있는 날은 출발 시각 대신 "10분 일찍" 같은 행동을 써요.

**`RouteCard`**
노선 배지(원형, 공식 노선색. 2호선은 `#23784A`) + 경로명 + 출발 시각 + 오늘 상태예요. 오늘 상태는 정상이면 `success`, 이상이면 상황 강조색이에요.

**`QuietCard`**
알림이 없는 날 홈 아래의 "알림을 쉬고 있어요" 카드예요. 가운데 정렬, 제목 Heading, 설명 Body `textSecondary`예요.

**`IncidentCard`**
홈의 이상 요약 카드예요. 왼쪽에 상황 아이콘 칸(상황 배경색, 모서리 16), 오른쪽에 "공사 · 지금"(상황 강조색 Caption), 제목, "출근길과 겹쳐요 · 10분 일찍 출발"이 들어가요. 누르면 알림 상세로 가요.

**`ComparisonBar`**
"평소 60% / 오늘 95%" 비교 막대예요. "평소"는 `neutralBar`, "오늘"은 상황 강조색이에요. 두 막대는 같은 축(0~100%)을 써요.

**`ActionBox`**
"07:50에 출발하세요 / 등록한 출발 시각보다 10분 일찍" 같은 행동 제안 박스예요. 배경은 상황 배경색, 제목은 상황 강조색 Heading이에요. 알림 상세에는 반드시 하나 들어가요.

**`AlternativeCard`**
`scene3`의 대안 경로 카드예요. "대안" 라벨, 제목("따릉이로 12분"), 경로 설명, 오른쪽 보너스 태그("재배치 보너스 +30", 배경 `primary`), 아래 CTA "이 길로 가기"로 구성돼요. 배경 `surfaceBrand`, 테두리 1.5px `primary` 40% 투명도예요.

**`LineDiagram`**
`scene3`의 "2호선 · 운행 축소 / 강남 대여소 → 역삼 대여소" 그림이에요. 위 줄은 영향받는 노선(상황 강조색 40% 투명도, 끊긴 곳은 ×), 아래 줄은 대안 경로(초록 `#3DDC97`, 양 끝 점과 라벨)예요. SVG로 그려요.

**`EvidenceNote`**
"판단 근거 내 구간 · 출발 시간대 혼잡 증가", "샘플 데이터 · 혼잡도 07:40 기준" 같은 근거와 출처 표시예요. Caption, `textTertiary`예요.

**`FeedbackCard`**
"이번 알림, 어땠나요?" 카드예요. 배경 `surfaceBrand`, 버튼 두 개("도움이 됐어요" primary, "필요 없었어요" default)를 1:1로 나란히 둬요. 어느 쪽을 눌러도 +1 P가 적립된다는 안내를 붙여요.

**`WardrobeItem`**
옷장 아이템 카드예요. 3열 그리드이고, 썸네일은 `KiroAvatar`에 `outfit`을 넣어 그려요.
- 착용 중: 배경 `surfaceBrandStrong`, 테두리 1.5px `primary`, 글자 `primaryText`
- 보유: 배경 `surface`, 글자 `text`
- 잠김: 배경 `surface`, 썸네일 40% 투명도, 글자 `textTertiary`, "LV. 4 해금"
- 한정판: 이름 아래 노란 "LIMITED" 태그(`#F5D06B` 배경, 검은 글자)

**`BottomTabBar`**
홈, 알림, 제보, (키로의 방 또는 옷장) 4개 탭이에요. 아이콘은 `@ant-design/icons`의 `HomeOutlined`, `BellOutlined`, `PlusCircleOutlined`, 4번째는 `StarOutlined` 또는 `ShoppingOutlined`예요. 활성 탭은 아이콘과 글자가 `primaryText`, 굵기 700이고, `01`~`04` 스타일에서는 `surfaceBrand` 둥근 배경을 깔아요. 알림 탭에는 안 읽은 개수 `Badge`를 붙여요. 위에 `divider` 1px 선, 아래에 `env(safe-area-inset-bottom)` 여백을 둬요.

### `KiroAvatar` (키로 캐릭터)

키로 그림, 표정, 움직임은 [`animation/`](animation/NOTES.md)의 키로 소프트 시안을 그대로 쓰고 새로 그리지 않아요. React에서는 `KiroAvatar.render(opts)`가 돌려주는 SVG 문자열을 감싸는 컴포넌트 하나만 만들어요.

```tsx
// src/components/KiroAvatar.tsx (예시)
import Kiro from '../../design/animation/kiro-avatar-soft.js';
import '../../design/animation/kiro-avatar-soft.css';
import type { Situation } from '../theme/situation';

type Props = {
  state?: Situation;   // ordinary, construction, rain, dust, marathon, strike, congestion
  expression?: string; // sleepy, joy, wink, heart, sparkle, surprise, worry, yawn, proud, sulk, cheer, sleep
  outfit?: string;     // base, hardhat, raincoat, mask, bandana, beanie, cap, phones, glasses, mug, crown, marathon26, bikehelmet, halo, flower, party
  motion?: string;     // idle, float, blink, hat, hop, nudge, sleepin, stretch, unlock, yawn
  size?: number;
  showTile?: boolean;  // 원형 타일 표시 (기본 true)
};

export function KiroAvatar(props: Props) {
  return <div dangerouslySetInnerHTML={{ __html: Kiro.render(props) }} />;
}
```

`render`에 넣는 값은 화면 상황에 따라 이렇게 정해요. `state`만 넣으면 그 상황의 기본 표정, 소품, 타일, 움직임이 함께 정해져요.

| 화면 상황 | 옵션 |
|---|---|
| 홈, 평범한 날 (`scene1`) | `{ state: 'ordinary' }` (졸음 + Zzz + float) |
| 홈, 이상 감지 (`scene2`) | `{ state: 'construction' }` 등 이상 종류 그대로 |
| 알림 상세 (`scene3`) | `{ state: 'strike' }` 등 이상 종류 그대로 |
| 이상이 처음 감지된 순간 | `{ state, expression: 'surprise' }` |
| 알림에 "도움이 됐어요" | `{ expression: 'joy' }` |
| 제보 성공 | `{ expression: 'proud', motion: 'hop' }` |
| 옷 착용·획득 | `{ outfit, expression: 'heart', motion: 'hat' }` |
| 레벨 해금, 한정판 획득 | `{ outfit, expression: 'sparkle', motion: 'unlock' }` |
| 밤 11시 이후 | `{ expression: 'sleep', motion: 'sleepin' }` |
| 옷장 썸네일 | `{ outfit, state: 'ordinary', motion: 'idle', size: 64 }` |

이상 종류는 판정 엔진의 이상 유형과 1:1로 맞춰요. 공사 → `construction`, 우천 → `rain`, 미세먼지 → `dust`, 마라톤 → `marathon`, 파업·집회 → `strike`, 혼잡 → `congestion`이에요. 옷장 아이템 이름은 렌더러의 `OUTFITS` 키를 그대로 쓰고, 화면에 보이는 이름은 `outfits_soft.png`의 한글 이름(기본, 안전모, 우비 …)을 써요.

키로 그림 안의 색(소프트 잉크 `#2A1F3D`, 브랜드 보라 `#A57BFF`, 파스텔 타일)은 키로 그림에서만 써요. 버튼, 카드, 태그 같은 UI에는 2장의 팔레트와 상황 색만 써요.

### 상태 태그 규칙

| 종류 | 배경 | 글자 | 예시 |
|---|---|---|---|
| 정보 | `surfaceBrand` | `textSecondary` | 샘플 데이터 |
| 상황 | 상황 배경색 | 상황 강조색 | 파업, 공사 · 지금, 혼잡 · 돌발, 새 알림 1 |
| 레벨 | `surfaceBrand` | `primaryText` | LV. 3 동네 지킴이 |
| 보상 | `primary` | `#FFFFFF` | 재배치 보너스 +30 |
| 한정판 | `#F5D06B` | `#1A1300` | LIMITED |

## 7. 화면 구성

모든 화면은 `PageHeader` → 화면 메시지(Caption 인사말 + Hero) → 본문 → `BottomTabBar` 순서예요.

### 홈 — 평범한 날 (`scene1.png`, `01 · 평소 — 조용한 오늘.png`)
- "좋은 아침이에요" + "오늘은 평소와 같아요"
- `KiroHero` (`ordinary`, 보라 원, 졸음)
- `TodayScore` 92%, "출근길 · 이상 없음"
- `RoutePill` "2호선 강남 → 선릉 · 08:10 출발"
- `QuietCard` "알림을 쉬고 있어요"
- (`01` 버전) 레벨 카드: 레벨명, `Progress`, 누적 포인트, "키로 보기"

### 홈 — 이상 감지 (`scene2.png`)
- `PushBanner` "출근길에 공사가 생겼어요"
- 헤더 종 버튼에 빨간 점
- "조금 다른 아침이에요" + 이상 제목
- `KiroHero` (이상 종류, 상황 색 원)
- `TodayScore` 61%(상황 강조색), "출근길 · 행동이 필요해요"
- `RoutePill` "2호선 강남 → 선릉 · 10분 일찍"
- `IncidentCard` "공사 · 지금 / 역삼로 일부 구간 통제"
- 하단 알림 탭에 개수 배지

### 알림 상세 (`scene3.png`, `02 · 알림 — 행동과 피드백.png`)
- "‹ 홈으로", 상황 태그 + 시각
- `KiroAvatar` (이상 종류, 중간 크기)
- 제목 "2호선 운행이 크게 줄었어요" + 비교 문장 "평소 혼잡도 52%인데 오늘은 95%예요. 평소의 약 1.8배라서 알려요."
- 권장 행동 카드: `ActionBox` 또는 제목 + `LineDiagram`, 수치 비교가 중심이면 `ComparisonBar`
- `AlternativeCard` (대안이 있을 때만)
- `EvidenceNote`
- `FeedbackCard`

### 제보 (`03 · 제보 — 동네를 돕는 미션.png`)
- 안내 카드(`surfaceBrand`): 제보 보상 설명
- "어떤 일이 있었나요?"
- 상황 유형(`Selector`), 장소(`Picker`), 시각(`DatePicker`), 한 줄 설명(`TextArea`)를 `Form`으로 묶어요
- "같은 경로의 2~3명이 확인하면 신뢰도가 올라가요."
- CTA "제보하고 +10 P 받기"와 포인트 정책 안내(Micro)

### 키로의 방 / 옷장 (`04 · 키로의 방 — 성장과 꾸미기.png`, `animation/outfits_soft.png`)
- "오늘도 한 뼘 자랐어요." + 레벨 태그
- 키로 카드: `KiroAvatar`(착용 중인 `outfit`), 착용 아이템 이름
- 다음 레벨 카드: 남은 포인트, `Progress`, 다음 해금 아이템
- 포인트 획득 방법 카드(제보 +10, 도움됨 +5, 피드백 +1)
- 옷장: 보유 개수, `Tabs`(기본 옷장, 한정판), `WardrobeItem` 3열 그리드

## 8. 글쓰기 규칙

- 존댓말 "~해요" 체를 써요. "~합니다", "~습니다"는 쓰지 않아요. (`scene1`의 "키로도 한숨 자고 있습니다."는 "자고 있어요."로 고쳐요.)
- 겁주지 않아요. "위험", "경고" 대신 "평소보다 혼잡해요"처럼 사실을 말해요.
- 알림 제목은 무엇이 바뀌었는지와 할 일을 함께 써요. 예: "2호선 파업, 따릉이가 12분 빨라요"
- 비교 문장은 "평소 ○○인데 오늘은 ○○예요. 평소의 약 ○배라서 알려요." 형식으로 써요.
- 포인트는 "+10 P"처럼 숫자 앞에 부호, 뒤에 공백과 P를 붙여요.
- 시각은 24시간제 "07:50"으로 써요.
- 경로는 "강남 → 선릉"처럼 화살표로 써요.
- 샘플·합성 데이터를 쓰는 화면에는 "샘플 데이터"를 꼭 표시해요.

## 9. 모바일 웹 규칙

- 기준 폭은 390px이고, 최대 폭 480px로 가운데 정렬해요. 데스크톱에서도 휴대폰 화면처럼 보여요.
- `viewport-fit=cover`와 `env(safe-area-inset-*)`로 노치와 홈 인디케이터 영역을 피해요.
- 터치 영역은 최소 44×44px이에요.
- 하단 탭은 화면 아래에 고정하고, 본문 아래에 탭 높이만큼 여백을 둬요.
- 키로 애니메이션의 트리거, 길이, 이징은 [`animation/NOTES.md`](animation/NOTES.md)를 따라요. UI 요소(카드, 버튼, 탭)는 antd-mobile 기본 모션만 쓰고 따로 애니메이션을 넣지 않아요. 예외는 `PushBanner`의 내려오기·올라가기예요.
- `prefers-reduced-motion`이면 키로의 반복 움직임(둥실, Zzz)을 꺼요.

## 10. 팀이 정해야 할 것

`scene*` 시안과 `01`~`04` 시안이 다른 부분이에요. 정해지면 이 표를 지우고 위 규칙에 반영해요.

| 항목 | `scene*` | `01`~`04` | 제안 |
|---|---|---|---|
| 4번째 탭 | 옷장 (가방 아이콘) | 키로의 방 (별 아이콘) | 레벨과 옷장을 함께 보여 주므로 "키로의 방" |
| 헤더 오른쪽 | 종 버튼 | 포인트 배지 | 홈은 종 버튼(이상 알림 진입), 나머지 탭은 포인트 배지 |
| 키로 원 색 | 진한 단색(보라, 호박, 빨강) | 보라 그라데이션 | 렌더러의 상황별 파스텔 타일 + 상황 색 glow |
| 하단 탭 활성 표시 | 아이콘·글자 색만 | 둥근 배경 추가 | 둥근 배경 추가(터치 영역이 잘 보임) |
| 홈 레벨 카드 | 없음 | 있음 | 평범한 날만 표시, 이상이 있는 날은 `IncidentCard`가 대신함 |
| 카드 테두리 | 얇은 테두리 | 없음 | 테두리 없음, 대안 카드만 보라 테두리 |

## 11. Kiro에서 쓰는 법

이 문서는 Kiro steering으로 연결돼 있어요. [`.kiro/steering/design-system.md`](../.kiro/steering/design-system.md)는 `inclusion: auto`라서, 화면이나 컴포넌트, 스타일, 키로 캐릭터 작업을 요청하면 Kiro가 이 문서와 [`animation/NOTES.md`](animation/NOTES.md)를 자동으로 불러와요. 그래서 Kiro에게 화면을 만들어 달라고 하면 이 규칙대로 만들어요.

- 화면을 요청할 때는 장과 시안 파일 이름을 같이 말해요. 예: "design/DESIGN.md 7장 알림 상세를 scene3.png대로 만들어줘"
- 시안 이미지를 채팅에 같이 붙이면 더 정확해요.
- 자동으로 안 불러온 것 같으면 채팅에서 `#design-system`으로 직접 불러와요.
- 규칙을 바꿀 때는 이 문서를 먼저 고치고 커밋해요. steering 파일은 이 문서를 참조만 하므로 고칠 필요가 없어요.
- 키로 그림을 바꿀 때는 `animation/`을 고치고, 이 문서의 `KiroAvatar` 표와 상황 색 표만 맞춰요.
- Kiro로 만든 결과는 `BUILD_REPORT.md`에 단계별로 기록해요.

## 12. 참고

- 서비스 기획: [`docs/PLANNING.md`](../docs/PLANNING.md), [`docs/PRD.md`](../docs/PRD.md)
- 키로 표정과 애니메이션: [`animation/NOTES.md`](animation/NOTES.md)
- antd-mobile 컴포넌트 목록: https://mobile.ant.design/components/
- antd-mobile 테마 설정: https://mobile.ant.design/guide/theming
- 아이콘: https://ant.design/components/icon/ (`@ant-design/icons`)
