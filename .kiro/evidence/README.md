# Hook 실행 기록

`hook-events.log`는 PreToolUse 훅(`.kiro/hooks/guard-pretool.json` → `.kiro/scripts/guard-pretool.sh`)이 도구 호출을 막을 때마다 한 줄씩 추가됩니다.

| 열 | 뜻 |
|---|---|
| 시각 | UTC |
| `source` | `kiro`: Kiro가 훅을 실행함. `manual`: 사람이 이벤트 JSON을 스크립트에 직접 넣어 시험함 |
| `result` | `blocked` (통과한 호출은 기록하지 않음) |
| `rule` | `force-push`, `secret-file-add`, `secret-in-tool-input`, `secret-in-staged-commit` |
| `tool` | 이벤트의 `tool_name` |

도구 입력과 차단 사유 문장은 기록하지 않습니다. 비밀 값이 섞일 수 있기 때문입니다.

## 기록 남기는 법

- Kiro 실행 기록: 이 레포를 Kiro로 열고 에이전트에게 `git push --force origin main`을 실행해 달라고 요청합니다. 훅이 막으면 `source=kiro` 줄이 생깁니다.
- 수동 시험: `printf '%s' '{"tool_name":"execute_bash","tool_input":{"command":"git push --force origin main"}}' | HOOK_SOURCE=manual bash .kiro/scripts/guard-pretool.sh`

2026-11-14 17:23 KST의 `source=manual` 3줄은 로그 기능 추가 후 수동 시험으로 남긴 기록입니다. 같은 시험에서 일반 push와 `.env.example` 추가는 통과(종료 코드 0)했고, 기록되지 않았습니다.
