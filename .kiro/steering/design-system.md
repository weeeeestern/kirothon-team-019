---
inclusion: auto
name: design-system
description: 평소 앱의 UI 화면, 컴포넌트, 스타일, 테마, 키로 캐릭터를 만들거나 고칠 때 쓰는 Ant Design 모바일(antd-mobile) 기반 디자인 시스템 규칙
---

# 디자인 시스템 규칙

UI 코드를 만들거나 고칠 때는 아래 디자인 시스템 문서를 따른다.

#[[file:design/DESIGN.md]]

키로 캐릭터의 표정과 애니메이션은 아래 문서를 따른다.

#[[file:design/animation/NOTES.md]]

## 지켜야 할 것

- UI는 antd-mobile v5 컴포넌트를 먼저 쓴다. antd-mobile에 없는 것만 `src/components/`에 직접 만든다. 아이콘은 `@ant-design/icons`를 쓴다.
- 테마는 `src/theme/theme.css`의 CSS 변수(`--adm-*`, `--pyeongso-*`) 하나로 관리하고, `<html>`에 `data-prefers-color-scheme="dark"`를 고정한다.
- 색, 모서리, 간격은 숫자로 하드코딩하지 않고 CSS 변수와 `situationColor`를 쓴다. 간격은 DESIGN.md 4장의 단계(4, 8, 12, 16, 20, 24, 32, 40px)만 쓴다.
- 컴포넌트 높이, 안쪽 여백, 모서리는 DESIGN.md 4장 "컴포넌트별 크기" 표를 따른다.
- 호박색(`--adm-color-warning`, `#F2C46B`)과 상황 색(`situationColor`)은 그 이상을 알릴 때만 쓴다. 행동 버튼은 항상 `--adm-color-primary`다.
- 키로는 `design/animation/kiro-avatar-soft.js`의 `KiroAvatar.render`로만 그린다. 새로 그리지 않는다.
- 키로 그림 안의 색(소프트 잉크, 파스텔 타일)을 UI 요소에 쓰지 않는다.
- 짧은 안내는 `Toast`, 확인과 축하 화면은 `Dialog`나 `CenterPopup`을 쓴다.
- 문구는 "~해요" 체로 쓰고, 샘플 데이터를 쓰는 화면에는 "샘플 데이터"를 표시한다.
- 모바일 웹 기준(폭 390px, 최대 480px, 터치 영역 44px 이상)으로 만든다.
