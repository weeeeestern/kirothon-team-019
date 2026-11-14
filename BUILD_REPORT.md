# BUILD REPORT

<!-- Kiro를 개발 과정의 어느 단계에서, 어떤 기능으로, 무엇을 했는지 기록해 주세요.
     1차 AI 심사는 이 문서와 .kiro/ 폴더를 보고 Kiro 활용을 평가해요. -->

> 마지막 갱신: 2026-11-14. 구현·검증 단계는 아직 시작 전이라 비워 두었고, 진행하면서 채운다.

## Kiro 활용 내역

| 단계 | 사용한 Kiro 기능 | 무엇을 했는지 | 결과물 위치 |
|---|---|---|---|
| 기획 | Kiro CLI 대화 | 기획서(`PLANNING.md`)를 바탕으로 PRD와 기능명세서(10개 영역, 하위 기능, 정책 5종)를 작성 | `docs/PRD.md`, `docs/기능명세서.xlsx`, `docs/PLANNING.md` |
| 설계 | Spec (requirements, design, tasks) | PRD 영역을 팀 분업(A 판정 엔진 / B 앱 UI·키로 / C 포인트·제보 / D 데이터)에 맞춰 스펙 4개로 나눠 작성. 요구사항은 "~해야 한다" 형식의 번호 항목, 설계는 모듈 경로·데이터 모델·오류 처리·테스트 전략, 작업은 요구사항 번호와 연결 | `.kiro/specs/anomaly-engine/`, `.kiro/specs/app-ui-kiro/`, `.kiro/specs/citizen-report-points/`, `.kiro/specs/data-and-evaluation/` |
| 설계 | Steering (always) | 프로젝트 전반 규칙을 3개로 나눠 `inclusion: always`로 둠. `product.md`는 제품 규칙(판정식, 알림 0건 원칙, 위치 추적 금지, 범위 밖, 표기 의무)과 스펙 4개 목록, `tech.md`는 스택·데이터 원칙·보안·명령, `structure.md`는 폴더 구조와 모듈 경계. 어떤 작업을 요청해도 Kiro가 항상 이 규칙을 먼저 읽는다 | `.kiro/steering/product.md`, `.kiro/steering/tech.md`, `.kiro/steering/structure.md` |
| 설계 | Steering (auto) | antd-mobile 기반 디자인 시스템 규칙을 `inclusion: auto` steering으로 두고, 디자인 문서와 키로 애니메이션 문서를 `#[[file:...]]`로 참조하게 구성. UI 작업 때 Kiro가 자동으로 규칙을 불러온다 | `.kiro/steering/design-system.md`, `design/DESIGN.md`, `design/animation/NOTES.md` |
| 구현 | | 시작 전 | |
| 검증 | | 시작 전. 합성 시나리오 지표(알림 0건, 탐지율 80% 이상, 알림 50% 이상 감소)를 `vitest` 단언으로 확인할 계획 | `.kiro/specs/data-and-evaluation/tasks.md` 5.3 |

## 개발 과정에서 바뀐 점

- **UI 스택:** 기획서(`PLANNING.md`)는 Tailwind를 적었고, 첫 디자인 시스템은 Ant Design v6이었다. 모바일 웹 기준으로 다시 정리하면서 antd-mobile v5로 바뀌었다. steering(`design-system.md`)도 이 기준으로 갱신되었고, 스펙의 `Situation` 타입 경로도 `src/theme/situation.ts`로 맞췄다.
- **키로 상태:** PRD는 5종(평범, 공사, 비, 미세먼지, 행사 통제)이었지만 디자인 문서에는 7종(`ordinary`, `construction`, `rain`, `dust`, `marathon`, `strike`, `congestion`)이 있다. 판정 엔진의 이상 유형을 7종 기준으로 맞췄다.
- **스펙 범위:** PRD 10개 영역을 팀 분업에 맞춰 스펙 4개로 묶었다. 디자인 시스템이 수정되는 동안 UI 스펙은 미뤄 두고, 디자인과 무관한 스펙부터 작성한 뒤 수정본이 나오면 UI 스펙을 썼다. 디자인 시안에 있지만 기획서가 제외 범위로 정한 따릉이 대안 경로는 UI 스펙의 범위 밖으로 표시했다.

## 어려웠던 점과 해결 방법

- **미확정 수치:** 포인트 획득량, 레벨 구간, 임계값 T의 초기값과 조정 폭이 정해지지 않았다. 각 스펙의 "미확정 사항" 표에 가정과 함께 적고, 합성 시나리오 튜닝 단계에서 확정하기로 했다.
- **데이터 소스 전부 미검증:** 공공데이터 7종이 아직 검증되지 않았다. 샘플(합성) 데이터 모드를 기본으로 두고, 검증을 통과한 소스만 실데이터로 바꾸는 구조로 설계했다.
- **디자인 시스템 변경:** 작업 중에 스택이 바뀌었다. 스펙에서 디자인 관련 참조를 `Situation` 타입 한 곳으로 좁혀 두어, 바뀌었을 때 고칠 곳이 적었다.
