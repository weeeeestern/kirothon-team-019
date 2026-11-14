#!/usr/bin/env bash
# PostCompact 훅: 압축 요약을 보관하고, 결정 기록을 다시 읽고 이어가라고 알린다.
# stdout은 압축 뒤 대화에 추가된다.
set -u
root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
dir="$root/.kiro/compaction"
mkdir -p "$dir"
ts="$(date +%Y%m%d-%H%M%S)"
input="$(cat)"
summary_path="$(printf '%s' "$input" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("summary_path") or "")
except Exception: print("")' 2>/dev/null)"
if [ -n "$summary_path" ] && [ -f "$summary_path" ]; then
  cp "$summary_path" "$dir/summary-$ts.md"
else
  printf '%s' "$input" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("summary") or "")
except Exception: pass' > "$dir/summary-$ts.md" 2>/dev/null
fi
ls -1t "$dir"/summary-*.md 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null
latest_state="$(ls -1t "$dir"/state-*.md 2>/dev/null | head -1)"

echo "대화가 압축됐어요. 이어서 작업하기 전에:"
echo "1. docs/DECISIONS.md를 다시 읽고, 결정과 '진행 상태' 절을 기준으로 이어가세요."
[ -n "$latest_state" ] && echo "2. 압축 직전 작업 상태: ${latest_state#$root/}"
echo "3. 압축 요약 전문: .kiro/compaction/summary-$ts.md"
echo "결정과 다르게 하려면 먼저 사용자에게 물어보세요."
exit 0
