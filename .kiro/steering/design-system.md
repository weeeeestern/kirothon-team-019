---
inclusion: auto
name: design-system
description: 평소 앱의 UI 화면, 컴포넌트, 스타일, 테마, 키로 캐릭터를 만들거나 고칠 때 쓰는 Ant Design 기반 디자인 시스템 규칙
---

# 디자인 시스템 규칙

UI 코드를 만들거나 고칠 때는 아래 디자인 시스템 문서를 따른다.

#[[file:design/DESIGN.md]]

키로 캐릭터의 표정과 애니메이션은 아래 문서를 따른다.

#[[file:design/animation/NOTES.md]]

## 지켜야 할 것

- UI는 Ant Design v6 컴포넌트를 먼저 쓴다. antd에 없는 것만 `src/components/`에 직접 만든다.
- 테마는 `src/theme/antdTheme.ts`의 `ConfigProvider` 설정 하나로 관리한다.
- 색, 모서리, 간격은 하드코딩하지 않고 `theme.useToken()`이나 디자인 토큰을 쓴다.
- 호박색(`colorWarning`, `#F2C46B`)과 상황 색(`situationColor`)은 그 이상을 알릴 때만 쓴다. 행동 버튼은 항상 `colorPrimary`다.
- 키로는 `design/animation/kiro-avatar-soft.js`의 `KiroAvatar.render`로만 그린다. 새로 그리지 않는다.
- 키로 그림 안의 색(소프트 잉크, 파스텔 타일)을 UI 요소에 쓰지 않는다.
- `message`, `notification`은 `App.useApp()`으로 꺼내 쓴다.
- 문구는 "~해요" 체로 쓰고, 샘플 데이터를 쓰는 화면에는 "샘플 데이터"를 표시한다.
- 모바일 웹 기준(폭 390px, 최대 480px, 터치 영역 44px 이상)으로 만든다.
