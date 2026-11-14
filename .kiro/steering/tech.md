---
inclusion: always
---

# 기술 스택과 개발 규칙

## 스택

| 영역 | 선택 |
|---|---|
| 프론트엔드 | React + TypeScript + Vite |
| UI | antd-mobile v5, 아이콘은 `@ant-design/icons` (세부 규칙은 `design-system` steering) |
| 테스트 | `vitest`, 컴포넌트는 `@testing-library/react` |
| 상태 저장 | React Context + `localStorage` |
| 배포 | Vercel (링크 공유) |
| 백엔드 | Vercel Functions의 외부 API 중계, Vite 개발 서버의 동일 경로 미들웨어. 시민 제보·확인·도움됨·포인트는 Supabase(경계는 `api-contract` steering) |

`docs/PLANNING.md`는 Tailwind를 적었지만 UI 라이브러리는 `design/DESIGN.md`를 따른다. Tailwind는 쓰지 않는다.

## 데이터 원칙

- 과거 공공데이터 기준선은 사전 정제한 JSON을 읽는다. 장소 검색은 동일 출처 `/api/`를 통해 서버에서 호출한다. ODsay 길찾기는 Web/URI 키가 있으면 브라우저에서 도메인 인증으로 직접 호출하고, 없으면 기존 서버 경로를 사용한다.
- 시민 제보·확인·도움됨·포인트의 서버 저장은 `src/api/`를 통한 Supabase만 쓴다. Supabase 환경변수가 없으면 `localStorage`로 동작한다.
- 각 JSON에는 소스 이름과 수집 시각(`meta`)을 넣는다.
- 합성 시나리오는 명시적인 샘플 모드로 분리한다. 실제 조회 실패를 합성 응답으로 위장하지 않고 재시도 또는 수동 등록을 안내한다.
- 수집 스크립트는 `scripts/collect/`에 두고 개발 시점에만 실행한다.

## 보안

- API 키와 비밀번호의 실제 값은 로컬 `.env` 계열 파일과 Vercel 환경변수에만 둔다. 브라우저 공개용 키와 서버 비밀 키를 구분한다. `.env`와 `*.key`, `*.pem`은 `.gitignore`에 있고 커밋하지 않는다.
- 스크립트 로그에 키나 요청 URL의 쿼리 문자열을 출력하지 않는다.
- 위치 권한을 요청하지 않는다. 개인 식별 정보를 저장하지 않는다.

## 코드 규칙

- 엔진(`src/engine/`)은 UI와 분리된 순수 TypeScript로 쓴다. React를 가져오지 않는다. 평가 스크립트가 같은 함수를 호출한다.
- 평가용 별도 판정 로직을 만들지 않는다. 판정은 `runDay` 하나만 쓴다.
- 입력이 비었거나 NaN이면 오류를 던지지 않고 해당 항목을 건너뛴다. 앱이 멈추면 안 된다.
- 색, 간격, 모서리는 하드코딩하지 않고 CSS 변수나 `situationColor`를 쓴다.
- 문구는 "~해요" 체로 쓴다.

## 명령 (프로젝트 생성 후 기준)

```bash
npm ci --prefix src  # 의존성 설치
npm run dev          # 개발 서버
npm run build        # 빌드
npm test             # vitest (합성 시나리오 지표 단언 포함)
```

지표 단언(`scripts/eval/run.ts`)이 목표(알림 0건, 탐지율 80% 이상, 알림 50% 이상 감소) 아래로 떨어지면 테스트가 실패해야 한다.
