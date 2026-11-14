#!/usr/bin/env bash
# Hook input may contain private conversation data. Do not copy or print it.
script_dir="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ! python3 "$script_dir/compaction-state.py" pre 2>/dev/null; then
  printf '%s\n' '작업 상태 저장을 건너뛰었어요. 압축 후 실제 Git 상태를 확인하세요.'
fi
printf '%s\n' '압축 전에 결정·남은 작업을 docs/DECISIONS.md에 비밀 값 없이 갱신하세요. 현재 사용자 지시를 우선하세요.'
exit 0
