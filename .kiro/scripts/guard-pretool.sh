#!/usr/bin/env bash
# PreToolUse 훅: STDIN으로 도구 호출 이벤트(JSON)를 받는다.
# 종료 코드 2면 Kiro가 도구 호출을 막고, stderr 내용을 에이전트에게 전달한다.
# 비밀 값은 어떤 경우에도 출력하지 않는다. 패턴 이름과 파일 이름만 알린다.
set -u

INPUT="$(cat)"

block() {
  printf 'BLOCKED: %s\n' "$1" >&2
  exit 2
}

# git 규칙은 셸 명령 문자열("command" 값)에만 적용한다.
# 문서나 코드에 "git push -f"라는 글자가 들어 있다는 이유로 파일 쓰기를 막지 않기 위해서다.
CMD="$(printf '%s' "$INPUT" | grep -Eo '"command"[[:space:]]*:[[:space:]]*"([^"\\]|\\.)*"' | head -1 || true)"

# 이 레포의 외부 API 키 이름(.kiro/steering/infra.md)과 일반 토큰 형식
SECRET_ERE='AKIA[0-9A-Z]{16}|BEGIN [A-Z ]*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{36,}|(KAKAO|ODSAY|SEOUL|PUBLIC_DATA|SUPABASE)[A-Z_]*(KEY|SECRET|TOKEN)[^A-Za-z0-9]{0,6}[A-Za-z0-9%+/=_.-]{16,}'
PLACEHOLDER_ERE='your|example|placeholder|changeme|xxxx|<.*>'

if [ -n "$CMD" ]; then
  # 1) 강제 push 금지
  if printf '%s' "$CMD" | grep -Eq 'git[[:space:]]+push.*([[:space:]]--force|--force-with-lease|[[:space:]]-f([[:space:]"]|$))'; then
    block "force push는 금지입니다. 일반 push는 사람이 합니다."
  fi

  # 2) .env, 인증서, 키 파일 스테이징 금지 (.env.example은 허용)
  ADD_TARGETS="$(printf '%s' "$CMD" | grep -Eo 'git[[:space:]]+add.*' | grep -Eo '[^[:space:]]*(\.env[A-Za-z0-9._-]*|\.pem|\.key)([[:space:]"]|$)' | grep -v 'example' || true)"
  if [ -n "$ADD_TARGETS" ]; then
    block "비밀 파일(.env, .pem, .key)을 git add 하려고 했습니다. 이 레포는 Public입니다. .env.example에는 빈 값만 둡니다."
  fi
fi

# 3) 도구 입력(파일 쓰기, 셸 명령 모두)에 비밀 값이 직접 들어 있으면 차단
HIT="$(printf '%s' "$INPUT" | grep -Eoi "$SECRET_ERE" | grep -Evi "$PLACEHOLDER_ERE" | head -1 || true)"
if [ -n "$HIT" ]; then
  block "비밀 값으로 보이는 문자열이 도구 입력에 있습니다(값은 출력하지 않음). process.env 또는 VITE_ 환경 변수에서 읽게 바꾸세요."
fi

# 4) 커밋 직전: 스테이징된 변경에 비밀 값이 있으면 파일 이름만 알리고 차단
if printf '%s' "$CMD" | grep -Eq 'git[[:space:]]+commit'; then
  if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
    FILES="$(git diff --cached --name-only -G"$SECRET_ERE" 2>/dev/null | head -5 | tr '\n' ' ')"
    if [ -n "$FILES" ]; then
      block "스테이징된 파일에 비밀 값으로 보이는 문자열이 있습니다: ${FILES}"
    fi
  fi
fi

exit 0
