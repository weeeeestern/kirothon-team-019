#!/usr/bin/env bash
# PreToolUse 훅: 셸에서 git commit / git push를 실행하기 전에 막을 것을 검사한다.
# 막으면 종료 코드 2와 이유(stderr)를 돌려준다. 검사 대상이 아니면 0으로 통과한다.
set -u

input="$(cat)"
cmd="$(printf '%s' "$input" | python3 -c 'import sys,json
try:
    d=json.load(sys.stdin)
except Exception:
    sys.exit(0)
ti=d.get("tool_input") or d.get("toolInput") or d.get("input") or {}
print(ti.get("command") or ti.get("cmd") or "" if isinstance(ti,dict) else "")' 2>/dev/null)"

case "$cmd" in
  *"git commit"*|*"git push"*) ;;
  *) exit 0 ;;
esac

if printf '%s' "$cmd" | grep -Eq -- '--force|(^|[[:space:]])-f([[:space:]]|$)|--no-verify'; then
  echo "차단: force push와 --no-verify는 쓰지 않아요." >&2
  exit 2
fi

root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$root" || exit 0

if printf '%s' "$cmd" | grep -q "git push"; then
  files="$(git diff --name-only @{upstream}..HEAD 2>/dev/null || git diff --name-only HEAD~1..HEAD 2>/dev/null)"
  diff_text="$(git diff @{upstream}..HEAD 2>/dev/null || true)"
else
  files="$(git diff --cached --name-only)"
  diff_text="$(git diff --cached)"
fi

if printf '%s\n' "$files" | grep -Eq '(^|/)\.env($|\.)|\.pem$|\.key$'; then
  if ! printf '%s\n' "$files" | grep -Eq '(^|/)\.env\.example$' || printf '%s\n' "$files" | grep -Ev '\.env\.example$' | grep -Eq '(^|/)\.env($|\.)|\.pem$|\.key$'; then
    echo "차단: .env, .pem, .key 파일이 커밋에 들어 있어요. 제출 안내가 금지한 항목이에요." >&2
    exit 2
  fi
fi

added="$(printf '%s\n' "$diff_text" | grep -E '^\+' | grep -Ev '^\+\+\+')"
if printf '%s\n' "$added" | grep -Eq 'SERVICE_ROLE_KEY["'"'"' ]*[:=]["'"'"' ]*[A-Za-z0-9._-]{20,}|sb_secret_[A-Za-z0-9_-]{16,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|(serviceKey|apiKey|API_KEY)[\"'"'"' ]*[:=][\"'"'"' ]*[A-Za-z0-9%+/=]{16,}'; then
  echo "차단: 추가된 줄에 키처럼 보이는 문자열이 있어요. 값은 .env나 Supabase 시크릿으로 옮겨 주세요." >&2
  exit 2
fi

exit 0
