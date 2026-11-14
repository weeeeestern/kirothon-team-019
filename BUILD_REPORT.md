# BUILD REPORT

<!-- Kiro를 개발 과정의 어느 단계에서, 어떤 기능으로, 무엇을 했는지 기록해 주세요.
     1차 AI 심사는 이 문서와 .kiro/ 폴더를 보고 Kiro 활용을 평가해요. -->

> 마지막 갱신: 2026-11-14. 구현·검증 단계는 아직 시작 전이라 비워 두었고, 진행하면서 채운다.

## Kiro 활용 내역

| 단계 | 사용한 Kiro 기능 | 무엇을 했는지 | 결과물 위치 |
|---|---|---|---|
| 기획 | Kiro CLI 대화 | 기획서(`PLANNING.md`)를 바탕으로 PRD와 기능명세서(10개 영역, 하위 기능, 정책 5종)를 작성 | `docs/PRD.md`, `docs/기능명세서.xlsx`, `docs/PLANNING.md` |
| 설계 | Spec (requirements, design, tasks) | PRD 영역을 팀 분업(A 판정 엔진 / C 포인트·제보 / D 데이터)에 맞춰 스펙 3개로 나눠 작성. 요구사항은 "~해야 한다" 형식의 번호 항목, 설계는 모듈 경로·데이터 모델·오류 처리·테스트 전략, 작업은 요구사항 번호와 연결 | `.kiro/specs/anomaly-engine/`, `.kiro/specs/citizen-report-points/`, `.kiro/specs/data-and-evaluation/` |
| 설계 | Steering | Ant Design 기반 디자인 시스템 규칙을 `inclusion: auto` steering으로 두고, 디자인 문서와 키로 애니메이션 문서를 `#[[file:...]]`로 참조하게 구성. UI 작업 때 Kiro가 자동으로 규칙을 불러온다 | `.kiro/steering/design-system.md`, `design/DESIGN.md`, `design/animation/NOTES.md` |
| 구현 | | 시작 전 | |
| 검증 | | 시작 전. 합성 시나리오 지표(알림 0건, 탐지율 80% 이상, 알림 50% 이상 감소)를 `vitest` 단언으로 확인할 계획 | `.kiro/specs/data-and-evaluation/tasks.md` 5.3 |
