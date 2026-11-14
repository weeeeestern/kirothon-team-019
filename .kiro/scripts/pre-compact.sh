#!/usr/bin/env bash
# PreCompact 훅: 압축 직전에 작업 상태를 파일로 남기고, 결정 기록을 갱신하라고 알린다.
# 항상 0으로 끝나서 압축을 막지 않는다. stdout은 압축 전 에이전트 컨텍스트에 들어간다.
set -u
root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
dir="$root/.kiro/compaction"
mkdir -p "$dir"
ts="$(date +%Y%m%d-%H%M%S)"
state="$dir/state-$ts.md"
{
  echo "# 압축 직전 상태 ($ts)"
  echo
  echo "브랜치: $(git -C "$root" branch --show-current 2>/dev/null)"
  echo
  echo "## 최근 커밋"
  git -C "$root" log --oneline -5 2>/dev/null
  echo
  echo "## 커밋 안 된 변경"
  git -C "$root" status --short 2>/dev/null | head -50
} > "$state"
ls -1t "$dir"/state-*.md 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null

echo "곧 대화가 압축돼요. 압축 전에 할 일:"
echo "1. 이번 대화에서 새로 정한 것과 끝낸 작업이 docs/DECISIONS.md에 없으면 지금 해당 절에 한 줄씩 추가하세요."
echo "2. '진행 상태' 절에 지금 하던 작업과 다음 단계를 적으세요."
echo "작업 상태 스냅숏: .kiro/compaction/state-$ts.md"
exit 0
