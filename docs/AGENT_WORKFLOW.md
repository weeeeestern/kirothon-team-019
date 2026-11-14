# Kiro 작업 역할과 압축 복귀

이 설정은 현재 앱에 맞춰 PR #5에서 지침만 분리한 것이다. 단순 변경은 기존 단일 에이전트로 진행할 수 있다. 역할별 Kiro 작업을 시작하려면 저장소 루트에서 `kiro-cli chat --v3 --agent lead`를 사용한다.

## 역할과 파일 소유권

| 역할 | 담당 | 제외·조정 |
|---|---|---|
| lead | 요구사항·계약·파일 배정과 검토 조정 | 직접 쓰기·셸 실행 없음 |
| engine-dev | `src/engine/`, 합성 데이터, 평가 스크립트 | 공공 원본 제외 |
| ui-dev | 경로 외 화면, 상태, 제보·포인트·현재 신호, 공용 의존성·빌드 설정 | Routes·지도·교통 CSS 제외 |
| jamjam-data | 수집·정제, 공공 번들, 기준선 기능 | 다운로드 원본 보존 |
| jamjam-transit | `api/`, `server/`, 교통·경로 기능, Routes·지도·교통 CSS | 의존성 변경은 ui-dev 요청 |
| jamjam-docs | 제출 문서, steering·스펙, 에이전트·훅·설정 | 앱 코드·xlsx 원본·tasks.md 제외 |
| qa | 테스트 파일·헬퍼, 빌드 smoke, `tasks.md`, `qa/` | 기능 코드는 담당자에게 수정 요청 |
| security | 보안 검토, `qa/reports/` | 기능 코드 수정 없음 |

테스트 파일은 구현 폴더 안에 있어도 QA 소유다. `src/engine/types.ts`는 engine/transit 중 작업별 소유자 한 명만 수정한다. QA와 security는 보고서 파일명을 나눠 쓴다. 설정의 허용 경로는 최대 범위이며 실제 작업은 lead가 배정한 파일로 좁힌다.

계약 확정 → 독립 파일 구현 → QA → 확정 결과 문서 반영 순으로 진행한다. QA는 `PASS`/`NEEDS_CHANGES`, security는 `SECURE`/`BLOCK`과 근거·미확인을 보고한다. 푸시를 요청받은 경우 최상위 실행 담당이 보안 검토 후 수행하며 역할 에이전트들은 Git 이력을 변경하지 않는다.

셸 명령 허용은 검증 중심으로 제한했다. 파일 도구 권한은 OS 샌드박스가 아니며 허용된 프로그램의 내부 접근까지 격리하지 않는다. 필요한 수집·설치 명령은 실행 담당이 기존 사용자 승인과 작업 범위를 확인해 수행한다. `.env` 읽기나 셸을 통한 제한 우회는 하지 않는다.

## 검증

앱 변경은 루트 `AGENTS.md`의 네 가지 명령으로 확인한다. 새 화면만 모바일 확인을 추가한다. 에이전트 설정은 각 JSON에 `kiro-cli agent validate --path <파일>`을 실행하고, 훅은 `node --test qa/compaction.test.mjs`로 확인한다. 로컬 스크립트 통과와 실제 Kiro 이벤트 호출은 별도 검증이다.

## 압축 훅

`.kiro/hooks/compaction.json`은 PreCompact/PostCompact에서 스크립트를 실행한다. `timeout`은 hook 항목에 둔다. Python 3와 Git을 사용하고 오류가 나도 압축 자체는 막지 않는다. 저장 실패는 짧은 안내로 표시한다.

압축 임계값은 워크스페이스의 `compaction.autoCompactionThreshold: 40`이다. [Kiro 공식 변경 내역](https://kiro.dev/changelog/cli/3-3/) 기준 CLI 3.3+에서 이 설정을 지원하며, [압축 훅](https://kiro.dev/docs/hooks/types/)은 CLI 3.1+의 V3 세션에서 지원한다.

`.kiro/compaction/`에는 시각·단계·현재 커밋·변경 파일 수만 저장한다. 커밋 메시지·diff·대화 요약·환경변수는 저장하지 않으며 `summary_path`를 열지 않는다. 각 단계의 최근 20개 스냅샷을 유지한다. 압축 후 `AGENTS.md`, `docs/DECISIONS.md`, 실제 `git status`를 다시 확인한다. 이 디렉터리는 Git에 올리지 않는다.
