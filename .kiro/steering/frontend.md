---
inclusion: fileMatch
fileMatchPattern: ['src/pages/**', 'src/components/**', 'src/state/**', 'src/theme/**', 'src/features/**', 'src/App.tsx', 'src/main.tsx']
---

# 현재 프론트엔드 규칙

- 상태·제보·포인트는 현재 `localStorage` 구조를 따른다. 별도 백엔드 도입은 기능 요구사항과 함께 다룬다.
- 교통·현재 신호 통신은 기존 `src/features/transit/`, `src/features/live/` 호출 계층을 사용한다. 서버 비밀 키는 `api/`, `server/`에 둔다.
- 브라우저 판정(`runDay`)과 외부 길찾기 조회를 구분한다. 필요한 출발·도착 좌표 조회를 개인 경로·출발 시각의 별도 수집으로 확대하지 않는다.
- 키로는 `KiroAvatar`로 렌더링한다. 홈과 키로의 방에서는 `preferOutfit`으로 선택한 옷을 유지한다. 상황 효과와 선택 의상을 구분한다(요구사항 6.10).
- 과거 통계·현재 관측·합성 신호와 각 단위를 명시한다. 실제 조회 실패를 샘플 성공으로 바꾸지 않는다.
- 화면 규칙은 `design-system` steering을 따른다. 새 화면은 모바일 폭에서 확인한다.
