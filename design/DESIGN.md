# 평소 디자인 시스템

"평소"는 평소와 다른 날에만 알려 주는 출퇴근 이상 알림 서비스예요. 이 문서는 화면 시안 4장(홈, 알림, 제보, 키로의 방)을 기준으로 정리한 디자인 규칙이에요. UI는 [Ant Design v6](https://ant.design/components/overview/)을 기반으로 만들고, 우리 서비스에 맞게 테마 토큰과 일부 컴포넌트를 바꿔서 써요.

## 1. 디자인 원칙

1. **조용한 게 기본이에요.** 평범한 날의 화면은 어둡고 차분해요. 보라색 키로가 졸고 있는 모습이 "오늘은 괜찮다"는 신호예요.
2. **다른 날에만 색이 바뀌어요.** 이상이 있는 날에만 호박색(Alert)이 나와요. 호박색은 알림 말고는 쓰지 않아요.
3. **알림 한 건에는 할 일이 꼭 들어가요.** "무엇이 / 평소 대비 얼마나 / 무엇을 할지" 순서로 보여 줘요.
4. **숫자로 말해요.** "혼잡해요" 대신 "평소 60% → 오늘 95%"처럼 비교 수치를 보여 줘요.
5. **근거와 데이터 출처를 숨기지 않아요.** 판단 근거, 샘플 데이터 여부, 기준 시각을 작은 글씨로 항상 표시해요.

## 2. 색상

### 기본 팔레트

| 이름 | 값 | 쓰는 곳 |
|---|---|---|
| `bg` | `#0B0A10` | 앱 바탕 |
| `surface` | `#1A1921` | 기본 카드, 입력창, 선택 칩 |
| `surfaceBrand` | `#221D33` | 보라 기운 카드(레벨, 피드백, 안내), 포인트 배지, 하단 탭 활성 배경 |
| `surfaceBrandStrong` | `#33254D` | 선택된 아이템 카드 |
| `surfaceMuted` | `#352C45` | 보조 버튼("필요 없었어요") |
| `primary` | `#8B4DFF` | 주요 버튼, 진행 막대, 선택된 칩, 선택 테두리 |
| `primaryText` | `#C9B1FF` | 포인트, 레벨, 링크성 텍스트("변경"), 활성 탭 |
| `alert` | `#F2C46B` | 이상 알림 강조(막대, 시각, 태그 글자) |
| `alertBg` | `#33291A` | 이상 알림 태그와 행동 제안 박스 배경 |
| `success` | `#9BE08C` | "특이사항 없음" 같은 정상 상태 |
| `line2` | `#23784A` | 지하철 2호선 배지 (다른 호선은 공식 노선색 사용) |
| `text` | `#FFFFFF` | 제목, 본문 |
| `textSecondary` | `#A09DAA` | 부제목, 설명 |
| `textTertiary` | `#6E6B78` | 주석, 데이터 출처, 비활성 탭 |
| `track` | `#2E2A3A` | 진행 막대의 빈 부분 |
| `neutralBar` | `#5E5A6E` | 비교 막대의 "평소" 값 |
| `divider` | `#1F1E26` | 하단 탭 위 구분선 |

키로 원형 배경은 `#8A55E6`에서 `#5B2DB8`로 가는 방사형 그라데이션이에요.

### 색 사용 규칙

- 보라(`primary`)는 브랜드와 행동(버튼, 진행, 선택)에 써요.
- 호박색(`alert`)은 "평소와 다른 날"에만 써요. 장식으로 쓰지 않아요.
- 초록(`success`)은 정상 상태 문구에만 써요.
- 빨강(error)은 입력 오류에만 쓰고, 알림 화면에는 쓰지 않아요. 불안감을 주지 않기 위해서예요.

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
| Display | 44px / 800 | 오늘 평범도 "92" |
| Title | 26px / 800 | 화면 제목 "평소", "내 경로 알림" |
| Hero | 24px / 800 | 화면 메시지 "오늘도 평소처럼, 안심하고." |
| Heading | 18px / 700 | 카드 제목 "2호선 강남 → 선릉" |
| Body | 15px / 400~600 | 설명, 입력값 |
| Caption | 13px / 400 | 부제목, 판단 근거, 데이터 출처 |
| Micro | 11px / 400 | 정책 안내("포인트는 제안값이며…") |

숫자 비교(60%, 95%, 240 / 300 P)는 `font-variant-numeric: tabular-nums`로 자리를 맞춰요.

## 4. 간격, 모서리, 크기

시안은 2배율(800px 폭)이고, 아래 값은 1배율(px) 기준이에요.

| 항목 | 값 |
|---|---|
| 화면 좌우 여백 | 24 |
| 카드 안쪽 여백 | 16 |
| 카드 사이 간격 | 16 |
| 섹션 사이 간격 | 28 |
| 칩, 작은 태그 모서리 | 8 |
| 버튼, 입력창 모서리 | 12 |
| 카드 모서리 | 20 |
| 배지, 상태 표시 | 완전한 원형(999) |
| 기본 버튼 높이 | 40 |
| 큰 버튼(CTA) 높이 | 50 |
| 하단 탭 높이 | 64 (+ 홈 인디케이터 영역) |

간격은 Ant Design 기본 단위(4px)의 배수로 맞춰요.

## 5. Ant Design 테마 설정

다크 알고리즘을 기본으로 쓰고, 색과 모서리 토큰을 덮어써요. 앱 최상단에서 `ConfigProvider`로 감싸요.

```tsx
// src/theme/antdTheme.ts
import { theme, type ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#8B4DFF',
    colorWarning: '#F2C46B',
    colorSuccess: '#9BE08C',
    colorInfo: '#8B4DFF',
    colorLink: '#C9B1FF',

    colorBgBase: '#0B0A10',
    colorBgLayout: '#0B0A10',
    colorBgContainer: '#1A1921',
    colorBgElevated: '#221D33',
    colorBorder: '#2E2A3A',
    colorBorderSecondary: '#1F1E26',

    colorText: '#FFFFFF',
    colorTextSecondary: '#A09DAA',
    colorTextTertiary: '#6E6B78',

    fontFamily:
      "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    fontSize: 15,

    borderRadius: 12,
    borderRadiusSM: 8,
    borderRadiusLG: 20,

    controlHeight: 40,
    controlHeightLG: 50,
  },
  components: {
    Button: {
      primaryShadow: 'none',
      fontWeight: 700,
      defaultBg: '#352C45',
      defaultBorderColor: 'transparent',
      defaultColor: '#FFFFFF',
    },
    Card: {
      colorBgContainer: '#1A1921',
      colorBorderSecondary: 'transparent',
    },
    Tabs: {
      itemColor: '#A09DAA',
      itemSelectedColor: '#C9B1FF',
      inkBarColor: '#8B4DFF',
    },
    Progress: {
      defaultColor: '#8B4DFF',
      remainingColor: '#2E2A3A',
    },
    Input: {
      colorBgContainer: '#1A1921',
      colorBorder: 'transparent',
    },
    Select: {
      colorBgContainer: '#1A1921',
      colorBorder: 'transparent',
    },
    Tag: {
      borderRadiusSM: 8,
    },
  },
};
```

```tsx
// src/main.tsx
import { ConfigProvider, App as AntApp } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { antdTheme } from './theme/antdTheme';

<ConfigProvider theme={antdTheme} locale={koKR}>
  <AntApp>
    <App />
  </AntApp>
</ConfigProvider>;
```

- `message`, `notification`처럼 정적 메서드로 띄우는 컴포넌트에는 `ConfigProvider` 테마가 적용되지 않아요. `App.useApp()`으로 꺼내서 써요.
- 컴포넌트 안에서 색이 필요하면 하드코딩하지 말고 `theme.useToken()`으로 토큰을 읽어요.
- 컴포넌트 토큰 이름은 antd 버전마다 조금씩 달라요. 타입 오류가 나면 [테마 문서](https://ant.design/docs/react/customize-theme)와 각 컴포넌트 문서의 "Design Token" 항목을 확인해요.

## 6. 컴포넌트

### Ant Design 컴포넌트를 그대로 쓰는 것

| 시안의 요소 | antd 컴포넌트 | 설정 |
|---|---|---|
| "키로 보기", "제보하고 +10 P 받기" | `Button` | `type="primary"`, CTA는 `size="large" block` |
| "필요 없었어요" | `Button` | 기본형(`defaultBg`가 `surfaceMuted`) |
| "경로 관리 ›", "변경" | `Button` | `type="link"` |
| 경로 카드, 비교 카드, 입력 카드 | `Card` | `variant="borderless"` |
| 레벨 진행 막대 | `Progress` | `percent`, `showInfo={false}`, `size` 높이 8 |
| 상황 유형(공사, 지연·혼잡 …) | `Radio.Group` | `optionType="button"`, 3열 그리드로 배치 |
| "어디인가요?" | `Select` | `showSearch`, 역 목록 |
| "언제 확인했나요?" | `TimePicker` | 기본값은 지금 시각 |
| "한 줄 설명" | `Input.TextArea` | `maxLength={100}`, `showCount` |
| 옷장 탭(소품, 의상, 한정판) | `Tabs` | 밑줄 형태 |
| "샘플 데이터", "새 알림 1", "혼잡·돌발" | `Tag` | 아래 "상태 태그" 규칙 사용 |
| 제보 완료, 포인트 적립 | `App.useApp().message` | 하단 근처에 짧게 표시 |

### 직접 만드는 컴포넌트

antd에 없거나 모바일 앱 느낌을 내기 위해 직접 만드는 컴포넌트예요. 내부는 antd 토큰을 써서 테마와 맞춰요.

**`PageHeader`**
화면 제목(Title), 부제목(Caption), 오른쪽 포인트 배지로 구성돼요. 4개 화면 모두 같은 구조예요.

**`PointBadge`**
"P 240"처럼 보유 포인트를 보여 주는 알약 모양 배지예요. 배경 `surfaceBrand`, 글자 `primaryText`, 굵기 700이에요.

**`StatusPill`**
키로 아래의 "● 평온하게 지키는 중" 표시예요. 상태에 따라 점 색이 바뀌어요.
- 평온: `primaryText`
- 이상 감지: `alert`

**`KiroAvatar`**
키로 캐릭터예요. 그림, 표정, 움직임은 [`animation/`](animation/NOTES.md)의 키로 소프트 시안(`kiro-avatar-soft.js`, `kiro-avatar-soft.css`)을 그대로 쓰고 새로 그리지 않아요. React에서는 `KiroAvatar.render(opts)`가 돌려주는 SVG 문자열을 감싸는 컴포넌트 하나만 만들어요. CSS 파일은 앱 시작 시 한 번 불러와요.

```tsx
// src/components/KiroAvatar.tsx (예시)
import Kiro from '../../design/animation/kiro-avatar-soft.js';
import '../../design/animation/kiro-avatar-soft.css';

type Props = {
  state?: 'ordinary' | 'construction' | 'rain' | 'dust' | 'marathon' | 'strike' | 'congestion';
  expression?: string; // sleepy, joy, surprise, worry ... (NOTES.md 표정표)
  outfit?: string;     // base, phones, crown ... (옷장 아이템)
  motion?: string;     // idle, float, hat, hop, nudge, sleepin, stretch, unlock, yawn, blink
  size?: number;
};

export function KiroAvatar(props: Props) {
  return <div dangerouslySetInnerHTML={{ __html: Kiro.render(props) }} />;
}
```

`render`에 넣는 값은 화면 상황에 따라 이렇게 정해요.

| 화면 상황 | `state` | `expression` | `motion` |
|---|---|---|---|
| 홈, 평범한 날 | `ordinary` | `sleepy` | `float` |
| 홈·알림, 이상이 처음 감지됨 | 이상 종류 | `surprise` | 상황 기본값 |
| 혼잡·지연이 큰 날 | `congestion` | `worry` | `nudge` |
| 알림에 "도움이 됐어요" | 이상 종류 | `joy` | 상황 기본값 |
| 제보 성공 | `ordinary` | `proud` | `hop` |
| 옷 착용·획득 | `ordinary` + `outfit` | `heart` | `hat` |
| 레벨 해금 | `ordinary` + `outfit` | `sparkle` | `unlock` |
| 밤 11시 이후 | `ordinary` | `sleep` | `sleepin` |

이상 종류(`state`)는 판정 엔진의 이상 유형과 1:1로 맞춰요. 공사 → `construction`, 우천 → `rain`, 미세먼지 → `dust`, 마라톤 → `marathon`, 파업·집회 → `strike`, 혼잡 → `congestion`이에요.

옷장 아이템 이름은 `OUTFITS` 키를 그대로 써요. 시안의 기본 가방은 `base`, 헤드폰은 `phones`, 왕관은 `crown`이에요.

크기는 홈 220px, 키로의 방 200px, 옷장 썸네일 64px로 써요.

**키로 색과 UI 색은 섞지 않아요.** 키로의 소프트 잉크(`#2A1F3D`), 브랜드 보라(`#A57BFF`), 상황별 파스텔 타일(공사 `#F3C98A`, 비 `#6BA3C9`, 파업 `#E8928A` 등)은 키로 그림 안에서만 써요. 버튼, 카드, 태그 같은 UI에는 이 문서 2장의 팔레트만 써요. 홈의 원형 그라데이션 배경은 `showTile: false`로 키로 타일을 끄고 UI 쪽에서 그려요.

**`TodayScore`**
"오늘 평범도 92%" 큰 숫자와 오른쪽 한 줄 메시지예요. 100에 가까울수록 평소와 같아요.

**`RouteCard`**
노선 배지(원형, 공식 노선색) + 경로명 + 출발 시각 + 오늘 상태예요. 오늘 상태는 정상이면 `success`, 이상이면 `alert`로 표시해요.

**`ComparisonBar`**
알림 화면의 "평소 60% / 오늘 95%" 비교 막대예요. 두 줄로 고정하고, "평소"는 `neutralBar`, "오늘"은 `alert` 색이에요. 막대 길이는 같은 축(0~100%)을 써서 바로 비교되게 해요.

**`ActionBox`**
"07:50에 출발하세요 / 등록한 출발 시각보다 10분 일찍" 같은 행동 제안 박스예요. 배경 `alertBg`, 제목 `alert`색 Heading이에요. 알림 카드에는 반드시 하나 들어가요.

**`EvidenceNote`**
"판단 근거 내 구간 · 출발 시간대 혼잡 증가", "샘플 데이터 · 혼잡도 07:40 기준" 같은 근거와 출처 표시예요. Caption, `textTertiary` 색이에요.

**`FeedbackCard`**
"이번 알림, 어땠나요?" 카드예요. 배경 `surfaceBrand`, 버튼 두 개("도움이 됐어요"는 primary, "필요 없었어요"는 default)를 1:1로 나란히 둬요. 어느 쪽을 눌러도 +1 P가 적립된다는 안내를 붙여요.

**`WardrobeItem`**
옷장 아이템 카드예요. 3열 그리드로 배치해요.
- 착용 중: 배경 `surfaceBrandStrong`, 테두리 1.5px `primary`, 아이콘과 글자 `primaryText`
- 보유: 배경 `surface`, 글자 `text`
- 잠김: 배경 `surface`, 아이콘과 글자 `textTertiary`, "LV. 4 해금" 표시

**`BottomTabBar`**
홈, 알림, 제보, 키로의 방 4개 탭이에요. 아이콘은 `@ant-design/icons`를 써요(`HomeOutlined`, `BellOutlined`, `PlusCircleOutlined`, `StarOutlined` 계열). 활성 탭은 배경 `surfaceBrand`의 둥근 사각형, 아이콘과 글자 `primaryText`, 굵기 700이에요. 위에 `divider` 색 1px 선을 두고, 아래에 `env(safe-area-inset-bottom)` 여백을 둬요.

### 상태 태그 규칙

| 종류 | 배경 | 글자 | 예시 |
|---|---|---|---|
| 정보 | `surfaceBrand` | `textSecondary` | 샘플 데이터 |
| 이상 | `alertBg` | `alert` | 새 알림 1, 혼잡·돌발, 우회·통제 |
| 레벨 | `surfaceBrand` | `primaryText` | LV. 3 동네 지킴이 |

## 7. 화면 구성

모든 화면은 `PageHeader` → 화면 메시지(Hero) → 본문 카드 → `BottomTabBar` 순서예요.

### 01 홈 — 조용한 오늘
- 인사말(Caption)과 Hero 메시지 "오늘도 평소처럼, 안심하고."
- `KiroAvatar`(sleeping)와 `StatusPill`
- `TodayScore`
- `RouteCard`: 등록한 경로와 "특이사항 없음"
- 레벨 카드(`surfaceBrand`): 레벨명, 설명, `Progress`, 누적 포인트, "키로 보기" 버튼

### 02 알림 — 행동과 피드백
- 시각과 "새 알림 1" 태그, Hero 메시지 "오늘은 10분만 일찍 나가볼까요?"
- 알림 카드: 이상 태그 → 경로 → 한 줄 설명 → `ComparisonBar` → `ActionBox` → `EvidenceNote`
- `FeedbackCard`
- 데이터 출처와 "같은 상황의 반복 알림은 보내지 않아요" 안내

### 03 제보 — 동네를 돕는 미션
- 안내 카드(`surfaceBrand`): 제보 보상 설명
- Hero 메시지 "어떤 일이 있었나요?"
- 상황 유형(`Radio.Group`), 장소(`Select`), 시각(`TimePicker`), 한 줄 설명(`TextArea`)
- 신뢰도 안내 "같은 경로의 2~3명이 확인하면 신뢰도가 올라가요."
- CTA "제보하고 +10 P 받기"와 포인트 정책 안내(Micro)

### 04 키로의 방 — 성장과 꾸미기
- Hero 메시지 "오늘도 한 뼘 자랐어요."와 레벨 태그
- 키로 카드: `KiroAvatar`(awake), 반짝이 장식, 착용 아이템 이름
- 다음 레벨 카드: 남은 포인트, `Progress`, 다음 해금 아이템
- 포인트 획득 방법 카드(제보 +10, 도움됨 +5, 피드백 +1)
- 옷장: 보유 개수, `Tabs`, `WardrobeItem` 3열 그리드

## 8. 글쓰기 규칙

- 존댓말 "~해요" 체를 써요. "~합니다", "~하십시오"는 쓰지 않아요.
- 겁주지 않아요. "위험", "경고" 대신 "평소보다 혼잡해요"처럼 사실을 말해요.
- 알림 제목은 행동을 권하는 문장으로 써요. 예: "오늘은 10분만 일찍 나가볼까요?"
- 포인트는 "+10 P"처럼 숫자 앞에 부호, 뒤에 공백과 P를 붙여요.
- 시각은 24시간제 "07:50"으로 써요.
- 경로는 "강남 → 선릉"처럼 화살표로 써요.
- 샘플·합성 데이터를 쓰는 화면에는 "샘플 데이터"를 꼭 표시해요.

## 9. 모바일 웹 규칙

- 기준 폭은 390px이고, 최대 폭 480px로 가운데 정렬해요. 데스크톱에서도 휴대폰 화면처럼 보여요.
- `viewport-fit=cover`와 `env(safe-area-inset-*)`로 노치와 홈 인디케이터 영역을 피해요.
- 터치 영역은 최소 44×44px이에요.
- 하단 탭은 화면 아래에 고정하고, 본문 아래에 탭 높이만큼 여백을 둬요.
- 키로 애니메이션의 트리거, 길이, 이징은 [`animation/NOTES.md`](animation/NOTES.md)를 따라요. UI 요소(카드, 버튼, 탭)는 antd 기본 모션만 쓰고 따로 애니메이션을 넣지 않아요.
- `prefers-reduced-motion`이면 키로의 반복 움직임(둥실, Zzz)을 꺼요.

## 10. Kiro에서 쓰는 법

이 문서는 Kiro steering으로 연결돼 있어요. [`.kiro/steering/design-system.md`](../.kiro/steering/design-system.md)가 `src/` 아래 `.ts`, `.tsx`, `.css` 파일을 열 때 이 문서와 키로 애니메이션 메모를 자동으로 불러와요. 그래서 Kiro에게 화면을 만들어 달라고 하면 이 규칙대로 만들어요.

- 화면을 만들 때는 "design/DESIGN.md의 7장 02 알림 화면을 만들어줘"처럼 장과 화면 이름으로 요청해요.
- 시안 이미지가 있으면 채팅에 같이 붙여요.
- 규칙을 바꿀 때는 이 문서를 먼저 고치고 커밋해요. steering 파일은 이 문서를 참조만 하므로 고칠 필요가 없어요.
- 키로 그림을 바꿀 때는 `design/animation/`을 고치고, 이 문서의 `KiroAvatar` 표만 맞춰요.

## 11. 참고

- 서비스 기획: [`docs/PLANNING.md`](../docs/PLANNING.md), [`docs/PRD.md`](../docs/PRD.md)
- 키로 표정과 애니메이션: [`animation/NOTES.md`](animation/NOTES.md)
- Ant Design 컴포넌트 목록: https://ant.design/components/overview/
- Ant Design 테마 설정: https://ant.design/docs/react/customize-theme
- Ant Design 테마 편집기: https://ant.design/theme-editor
