#!/usr/bin/env python3
"""Persist minimal Git metadata, never conversation input or file contents."""
from datetime import datetime, timezone
from pathlib import Path
import json
import re
import subprocess
import sys
import time


def git(*args):
    return subprocess.check_output(
        ['git', *args], stderr=subprocess.DEVNULL, timeout=5
    )


def main():
    phase = sys.argv[1]
    if phase not in ('pre', 'post'):
        raise ValueError('invalid phase')
    root = Path(git('rev-parse', '--show-toplevel').decode().strip())
    kiro = root / '.kiro'
    directory = kiro / 'compaction'
    if kiro.is_symlink() or directory.is_symlink():
        raise ValueError('snapshot directory must not be a symlink')
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    try:
        commit = git('rev-parse', '--verify', 'HEAD').decode().strip()
        if not re.fullmatch(r'[0-9a-f]{40,64}', commit):
            commit = None
    except subprocess.CalledProcessError:
        commit = None  # Newly initialized repositories have no HEAD yet.
    # Names and diff contents are intentionally omitted from the snapshot.
    status = git('status', '--porcelain=v1', '-z', '--untracked-files=normal').split(b'\0')
    count, index = 0, 0
    while index < len(status) and status[index]:
        entry = status[index]
        count += 1
        index += 2 if b'R' in entry[:2] or b'C' in entry[:2] else 1
    payload = {
        'phase': phase,
        'at': datetime.now(timezone.utc).isoformat(),
        'commit': commit,
        'changed_entries': count,
        'resume': ['AGENTS.md', 'docs/DECISIONS.md', 'git status'],
    }
    name = f'{phase}-{time.time_ns()}.json'
    with (directory / name).open('x', encoding='utf-8') as output:
        json.dump(payload, output, ensure_ascii=False, indent=2)
        output.write('\n')
    # Only our regular snapshot files are eligible; spaces and unrelated files are safe.
    snapshots = sorted(
        (p for p in directory.iterdir()
         if re.fullmatch(rf'{phase}-[0-9]+\.json', p.name)
         and not p.is_symlink() and p.is_file()),
        key=lambda p: int(p.stem.split('-')[1]), reverse=True,
    )
    for old in snapshots[20:]:
        old.unlink()
    print(f'작업 상태: .kiro/compaction/{name} (대화·파일 내용 제외)')


if __name__ == '__main__':
    main()
