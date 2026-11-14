---
inclusion: always
---

# 폴더 구조

스펙 4개의 설계에서 정한 경로다. 새 파일은 아래 위치에 둔다. 위치를 바꿀 때는 해당 스펙의 `design.md`도 함께 고친다.

```
.kiro/
  specs/            기능별 requirements, design, tasks
  steering/         product, tech, structure (always), design-system, infra (fileMatch), deploy-checklist (manual)
  hooks/, scripts/  저장 후 점검, PreToolUse 차단 훅과 스크립트
  evidence/         훅 차단 실행 기록
  agents/           data, transit, docs, lead 역할 설정
api/                Vercel API 핸들러
server/             서버 전용 외부 API 중계
design/             화면 시안, DESIGN.md, 키로 렌더러(animation/)
docs/               PLANNING.md, PRD.md, 기능명세서.xlsx
data/SOURCES.md     데이터 소스 검증 기록
scripts/
  collect/          소스별 수집 스크립트 (개발 시점에만 실행)
  eval/             합성 시나리오 생성과 평가
src/
  main.tsx, App.tsx
  theme/            theme.css, situation.ts
  engine/           판정 엔진 (순수 TypeScript)
  features/
    transit/        장소·길찾기 계약과 화면
    baseline/       실제 공공데이터 기준선 조회
    reports/        제보 저장, 신뢰도 검증, Anomaly 변환
    points/         ledger, 레벨, 해금
  data/             번들 JSON, public/, synthetic/, evaluation.json
  pages/            Home, NoticeDetail, Report, KiroRoom, Routes, Eval
  components/       KiroAvatar 등 직접 만드는 컴포넌트
  state/            AppState (Context + localStorage)
  hooks/            useDay 등
README.md, BUILD_REPORT.md, SUBMISSION_GUIDE.md
PRESENTATION.pdf    레포 최상단, 제출 필수
```

## 모듈 경계

| 모듈 | 의존해도 되는 것 | 의존하면 안 되는 것 |
|---|---|---|
| `src/engine/` | `src/data/` 타입 | React, `pages/`, `components/` |
| `src/features/` | `src/engine/` 타입 | `pages/`, `components/` |
| `src/pages/` | `components/`, `state/`, `hooks/`, `engine/`, `features/` | `scripts/` |
| `scripts/` | `src/engine/` | `src/pages/`, React |

## 파일 규칙

- 영문 소문자 또는 PascalCase(컴포넌트) 파일명을 쓴다. 한글과 공백, 특수문자(·, —)가 들어간 파일명은 새로 만들지 않는다.
- 데모 영상 파일은 레포에 올리지 않고 README의 Demo 줄에 링크로 적는다.
- Kiro로 만든 산출물은 `BUILD_REPORT.md`의 해당 단계 행에 위치를 기록한다.
