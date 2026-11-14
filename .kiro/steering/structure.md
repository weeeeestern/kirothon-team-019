---
inclusion: always
---

# 폴더 구조

스펙 4개의 설계에서 정한 경로다. 새 파일은 아래 위치에 둔다. 위치를 바꿀 때는 해당 스펙의 `design.md`도 함께 고친다.

```
.kiro/
  specs/            기능별 requirements, design, tasks
  steering/         product, tech, structure, api-contract, decisions (always), design-system, infra, backend, frontend (fileMatch), deploy-checklist (manual)
  agents/           lead 1개 + 담당 8개 (목록과 쓰기 경로는 AGENTS.md)
  hooks/, scripts/  guard-pretool(PreToolUse 차단), compaction(압축 전후), 저장 후 점검과 스크립트
  evidence/         훅 차단 실행 기록
  settings/         cli.json (자동 압축 40%)
api/                Vercel API 핸들러 (jamjam-transit)
server/             서버 전용 외부 API 중계 (jamjam-transit)
design/             화면 시안, DESIGN.md, 키로 렌더러(animation/)
docs/               PLANNING.md, PRD.md, DECISIONS.md, 기능명세서.xlsx
data/SOURCES.md     데이터 소스 검증 기록
supabase/           migrations/, functions/, tests/ (backend-dev)
qa/                 scenarios.md, reports/ (qa)
AGENTS.md           에이전트 목록과 명령
scripts/
  collect/          공공데이터 수집·정제 (jamjam-data)
  eval/             합성 시나리오 생성과 평가
src/
  main.tsx, App.tsx
  api/              Supabase 계약과 구현 (backend-dev 소유, 나머지는 읽기만)
  theme/            theme.css, situation.ts
  engine/           판정 엔진 (순수 TypeScript)
  features/
    transit/        장소·길찾기 계약과 화면 (jamjam-transit)
    routes/         경로 모델 (jamjam-transit)
    baseline/       실제 공공데이터 기준선 조회 (jamjam-data)
    live/           현재 지역 신호 (ui-dev)
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
| `src/api/` | `src/engine/` 타입, `features/` 타입 | `pages/`, `components/`, `state/` |
| `src/pages/` | `components/`, `state/`, `hooks/`, `engine/`, `features/`, `api/` | `scripts/`, `@supabase/supabase-js` 직접 사용 |
| `scripts/` | `src/engine/` | `src/pages/`, React |

## 파일 규칙

- 영문 소문자 또는 PascalCase(컴포넌트) 파일명을 쓴다. 한글과 공백, 특수문자(·, —)가 들어간 파일명은 새로 만들지 않는다.
- 데모 영상 파일은 레포에 올리지 않고 README의 Demo 줄에 링크로 적는다.
- Kiro로 만든 산출물은 `BUILD_REPORT.md`의 해당 단계 행에 위치를 기록한다.
