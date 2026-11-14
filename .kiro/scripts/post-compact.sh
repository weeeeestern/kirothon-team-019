#!/usr/bin/env bash
# Deliberately ignore summary and summary_path: neither is safe to archive blindly.
script_dir="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ! python3 "$script_dir/compaction-state.py" post 2>/dev/null; then
  printf '%s\n' '작업 상태 저장을 건너뛰었어요. 압축 후 실제 Git 상태를 확인하세요.'
fi
printf '%s\n' 'AGENTS.md와 docs/DECISIONS.md를 다시 읽고 git status로 현재 변경을 확인한 뒤 이어가세요. 현재 사용자 지시를 우선하세요.'
exit 0
