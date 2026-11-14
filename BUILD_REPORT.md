# BUILD REPORT

<!-- Kiro를 개발 과정의 어느 단계에서, 어떤 기능으로, 무엇을 했는지 기록해 주세요.
     1차 AI 심사는 이 문서와 .kiro/ 폴더를 보고 Kiro 활용을 평가해요. -->

> 마지막 갱신: 2026-11-14. 로컬 시연 구현과 자동 테스트를 완료했다. 아래에서 Kiro 기획·설계와 Codex 후속 작업을 구분한다.

## Kiro 활용 내역

| 단계 | 사용한 Kiro 기능 | 무엇을 했는지 | 결과물 위치 |
|---|---|---|---|
| 기획 | Kiro CLI 대화 | 기획서(`PLANNING.md`)를 바탕으로 PRD와 기능명세서(10개 영역, 하위 기능, 정책 5종)를 작성 | `docs/PRD.md`, `docs/기능명세서.xlsx`, `docs/PLANNING.md` |
| 설계 | Spec (requirements, design, tasks) | PRD 영역을 팀 분업(A 판정 엔진 / B 앱 UI·키로 / C 포인트·제보 / D 데이터)에 맞춰 스펙 4개로 나눠 작성. 요구사항은 "~해야 한다" 형식의 번호 항목, 설계는 모듈 경로·데이터 모델·오류 처리·테스트 전략, 작업은 요구사항 번호와 연결 | `.kiro/specs/anomaly-engine/`, `.kiro/specs/app-ui-kiro/`, `.kiro/specs/citizen-report-points/`, `.kiro/specs/data-and-evaluation/` |
| 설계 | Steering (always) | 프로젝트 전반 규칙을 3개로 나눠 `inclusion: always`로 둠. `product.md`는 제품 규칙(판정식, 알림 0건 원칙, 위치 추적 금지, 범위 밖, 표기 의무)과 스펙 4개 목록, `tech.md`는 스택·데이터 원칙·보안·명령, `structure.md`는 폴더 구조와 모듈 경계. 어떤 작업을 요청해도 Kiro가 항상 이 규칙을 먼저 읽는다 | `.kiro/steering/product.md`, `.kiro/steering/tech.md`, `.kiro/steering/structure.md` |
| 설계 | Steering (auto) | antd-mobile 기반 디자인 시스템 규칙을 `inclusion: auto` steering으로 두고, 디자인 문서와 키로 애니메이션 문서를 `#[[file:...]]`로 참조하게 구성. UI 작업 때 Kiro가 자동으로 규칙을 불러온다 | `.kiro/steering/design-system.md`, `design/DESIGN.md`, `design/animation/NOTES.md` |
| 설계 | Hooks (PostFileSave) | 파일 저장 때 자동으로 도는 점검 2개. 스펙의 `requirements.md`를 저장하면 같은 스펙의 `design.md`·`tasks.md`가 어긋나지 않는지 확인하고, `src/`·`scripts/`·`data/`의 파일을 저장하면 API 키 같은 비밀 정보가 코드에 들어가지 않았는지 확인한다(제출 안내가 커밋 금지로 정한 항목) | `.kiro/hooks/spec-sync-on-save.json`, `.kiro/hooks/secret-check-on-save.json` |
| 구현 | Kiro 산출물 기반 Codex 후속 작업 | 누락 소스 복구, Vite 진입점 연결, 6개 화면, 순수 판정 엔진, localStorage, 제보 검증, 포인트·해금, 경유지 편집, React 19 호환 수정 | `src/`, `scripts/eval/`, `vercel.json` |
| 검증 | Codex 후속 검증 | 엔진·저장소 단위 테스트와 화면 통합 테스트: 경유지 저장·복구, 제보 2명 확인, 중복 적립 방지, 레벨 해금·착용, 빈 경로 안내. 동일 엔진으로 합성 평가를 재생성 | `src/engine/engine.test.ts`, `src/state/store.test.ts`, `src/App.test.tsx`, `src/data/evaluation.json` |
| 검증 | 커스텀 에이전트 (`qa-engine`, 읽기 전용) | 코드 수정 권한 없이 테스트와 평가만 실행하는 QA 에이전트로 스펙 대비 검증. 요구사항 번호와 코드·테스트 대응, 지표 재계산, 불변식 7개, 비밀 정보, 문서와 코드 불일치를 점검. 결과: 테스트 23개 통과, 지표가 README와 일치. 문제로 평가 시나리오 구성에 따라 지표가 정해지는 점, 표준편차 0 테스트 없음, 공휴일 달력 미연결, `tasks.md` 체크박스 불일치를 찾음. 빌드·타입 검사는 권한 허용 목록 밖이라 미검증. 실행: `kiro-cli chat --v3 --agent qa-engine --trust-workspace` | `.kiro/agents/qa-engine.json`, `docs/QA_REPORT.md` |

## 개발 과정에서 바뀐 점

- **UI 스택:** 기획서(`PLANNING.md`)는 Tailwind를 적었고, 첫 디자인 시스템은 Ant Design v6이었다. 모바일 웹 기준으로 다시 정리하면서 antd-mobile v5로 바뀌었다. steering(`design-system.md`)도 이 기준으로 갱신되었고, 스펙의 `Situation` 타입 경로도 `src/theme/situation.ts`로 맞췄다.
- **키로 상태:** PRD는 5종(평범, 공사, 비, 미세먼지, 행사 통제)이었지만 디자인 문서에는 7종(`ordinary`, `construction`, `rain`, `dust`, `marathon`, `strike`, `congestion`)이 있다. 판정 엔진의 이상 유형을 7종 기준으로 맞췄다.
- **스펙 범위:** PRD 10개 영역을 팀 분업에 맞춰 스펙 4개로 묶었다. 디자인 시스템이 수정되는 동안 UI 스펙은 미뤄 두고, 디자인과 무관한 스펙부터 작성한 뒤 수정본이 나오면 UI 스펙을 썼다. 디자인 시안에 있지만 기획서가 제외 범위로 정한 따릉이 대안 경로는 UI 스펙의 범위 밖으로 표시했다.

## 어려웠던 점과 해결 방법

- **미확정 수치:** 포인트 획득량, 레벨 구간, 임계값 T의 초기값과 조정 폭이 정해지지 않았다. 각 스펙의 "미확정 사항" 표에 가정과 함께 적고, 합성 시나리오 튜닝 단계에서 확정하기로 했다.
- **데이터 소스 전부 미검증:** 공공데이터 7종이 아직 검증되지 않았다. 샘플(합성) 데이터 모드를 기본으로 두고, 검증을 통과한 소스만 실데이터로 바꾸는 구조로 설계했다.
- **디자인 시스템 변경:** 작업 중에 스택이 바뀌었다. 스펙에서 디자인 관련 참조를 `Situation` 타입 한 곳으로 좁혀 두어, 바뀌었을 때 고칠 곳이 적었다.
- **커스텀 에이전트가 실행되지 않음:** 에이전트 파일의 `permissions` 필드는 V3 엔진 전용인데, CLI가 기본으로 V2 엔진을 써서 "Mode not found" 오류가 났다. 빈 임시 폴더에서 설정 필드를 하나씩 빼 보며 원인을 `permissions`로 좁혔고, `--v3` 옵션으로 실행해 해결했다.

## 남은 작업

공공 API 수집·스키마 검증·단위별 기준선·공휴일 달력은 미완료다. 실제 다중 사용자와 서버 푸시는 이번 로컬 시연 범위 밖이다. 실제 배포 URL·발표 자료·데모 영상은 별도 확인이 필요하다. 합성 평가 수치는 실제 서비스 성능이 아니다.

후속 UI 검증: 테스트 23개 통과, 390px 경로 편집·한정판 해금 팝업 확인, 960px 화면에서 앱 폭 480px 유지 확인. antd-mobile 기본 다크 테마가 브랜드 색을 덮던 CSS 우선순위를 수정했다.
