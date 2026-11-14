# 결정 기록 (DECISIONS)

작업을 이어가기 전에 이 파일을 먼저 읽어요. 새로 정한 것은 맨 아래 해당 절에 한 줄씩 추가해요. 형식: `- [날짜] 결정 — 이유 (근거 파일)`

## 제품
- [11-14] 서비스 이름은 "잠잠" — 팀 합의 (README, docs/PRD.md)
- [11-14] 판정(runDay), 경로, 출발 시각, 임계값은 브라우저에만 둔다 — 개인 이동 정보를 서버로 보내지 않기 위해 (.kiro/steering/api-contract.md)
- [11-14] 제보·확인·도움됨·포인트만 Supabase로 옮긴다 — "서로 다른 사용자 2명 확인"은 localStorage로 불가능, 포인트 조작 방지 (.kiro/specs/supabase-backend/requirements.md)
- [11-14] Supabase 환경변수가 없으면 localStorage 데모 모드로 동작 — 발표 데모 안정성 (api-contract.md)
- [11-14] 사용자 식별은 Supabase 익명 로그인만 — 이메일·전화·위치 미수집 (product.md)
- [11-14] ~~이상이 있는 날 상황 의상 우선, 옷장에서 상황 의상 제거~~ → main 기준으로 대체: 홈·키로의 방은 선택한 코스튬을 유지하고(`preferOutfit`), 겹치지 않는 상황 효과·표정·배경색은 함께 보여 준다 — 사용자 지시 "main 기준" (app-ui-kiro 요구사항 6.10, main a44fb15)

## 디자인
- [11-14] UI는 antd-mobile v5, 아이콘은 @ant-design/icons — 모바일 앱 화면 (design/DESIGN.md)
- [11-14] 간격은 4, 8, 12, 16, 20, 24, 32, 40px 단계만 (DESIGN.md 4장)

## Kiro 운영
- [11-14] 비대화형 실행은 `kiro-cli chat --v3 ...` — V2 엔진은 permissions가 있는 에이전트를 읽지 못함(오류 "Mode not found")
- [11-14] 각 에이전트 쓰기 범위는 `fs_write deny ** exclude <허용 경로>`로 강제 — 실제 시험에서 `--trust-tools=fs_write`보다 deny가 이김 확인
- [11-14] tasks.md 체크박스는 qa만 바꾼다 — 확인 안 된 체크 방지
- [11-14] 컨텍스트 40%에서 자동 압축, 압축 전후 훅이 상태를 저장하고 이 파일을 다시 읽게 함 (.kiro/settings/cli.json, .kiro/hooks/compaction.json)

- [11-14] main 기준으로 에이전트 통합: lead 1개 + backend-dev, engine-dev, ui-dev, jamjam-data, jamjam-transit, jamjam-docs, qa, security. main의 jamjam-lead는 lead에 합쳐 삭제, jamjam-data·transit·docs는 이름을 유지하고 프롬프트에 적혀 있던 소유 경로를 permissions로 강제(main에서는 쓰기 `**` 허용이었음) (AGENTS.md)
- [11-14] 담당 태그: [backend] [engine] [ui] [data] [transit] [docs] [qa]
- [11-14] 의존성·빌드 설정(src/package.json, tsconfig)은 ui-dev(통합 담당) 소유, 다른 에이전트는 lead를 통해 요청 — main의 "의존성은 통합 담당에게 요청" 규칙 유지
- [11-14] 겹치는 쓰기 경로는 src/.env.example(backend-dev, jamjam-transit), src/engine/types.ts(engine-dev, jamjam-transit 경로 타입만) 두 개만 허용
- [11-14] 커밋·푸시 차단 훅은 main의 guard-pretool(.kiro/hooks/guard-pretool.json)만 쓴다. 이 브랜치의 git-guard는 기능이 겹쳐 삭제
- [11-14] 훅 스크립트 위치는 main 관례대로 .kiro/scripts/

## Git
- [11-14] 작업 브랜치는 `feat/supabase-subagents`, main에 직접 푸시하지 않는다
- [11-14] 커밋 작성자는 stclab-done (noreply 이메일), git config는 바꾸지 않는다
- [11-14] 발표자료(~/Downloads/pyeongso-pitch)는 레포에 올리지 않는다

## 진행 상태
- [11-14] main(최신)을 feat/supabase-subagents에 머지, 충돌 10개 해결. 코드 충돌은 main 기능(showcase 모드, DEMO_ROUTE, ReportMap, ODsay 키)에 Supabase 호출을 얹는 방식으로 합침
- [11-14] 완료: app-ui-kiro 작업 13 (lead → ui-dev → qa PASS, 커밋 9d7cdd5)
- [11-14] 완료: supabase-backend 작업 1~6 (lead → backend-dev·ui-dev·qa, qa 재검토 1회, security SECURE). 확인: vitest 66개, pgTAP 47개, 빌드 성공
- [11-14] 보류: 작업 7(Edge Function). security medium 2건(mark_helpful 경로 검사, 제보·피드백 횟수 제한)은 후속 작업 (qa/reports/2026-11-14-security.md)
- [11-14] main 머지는 사용자 검토 후에만 한다 — 사용자 요청
