import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scripts = fileURLToPath(new URL('../.kiro/scripts/', import.meta.url));
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'jamjam compaction '));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd });
  writeFileSync(join(cwd, '.gitignore'), '.kiro/compaction/\n');
  return cwd;
}
function run(cwd, phase, input = '') {
  const result = spawnSync('bash', [join(scripts, `${phase}-compact.sh`)], {
    cwd, input, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout;
}

test('hooks tolerate malformed input and never archive summary or summary_path contents', t => {
  const cwd = fixture(t);
  const secret = 'fixture-private-value-do-not-copy';
  const source = join(cwd, '.env');
  writeFileSync(source, secret);
  run(cwd, 'pre', '{malformed');
  const output = run(cwd, 'post', JSON.stringify({ summary: secret, summary_path: source }));
  assert.ok(output.includes('docs/DECISIONS.md'));
  const directory = join(cwd, '.kiro/compaction');
  const files = readdirSync(directory);
  assert.equal(files.length, 2);
  for (const name of files) {
    const text = readFileSync(join(directory, name), 'utf8');
    assert.ok(!text.includes(secret));
    assert.ok(!text.includes('.env'));
    const state = JSON.parse(text);
    assert.equal(state.commit, null);
    assert.equal(state.changed_entries, 2);
  }
  assert.ok(!output.includes(secret));
  assert.equal(readFileSync(source, 'utf8'), secret);
});

test('retention keeps 20 snapshots per phase and preserves unrelated files in paths with spaces', t => {
  const cwd = fixture(t);
  const directory = join(cwd, '.kiro/compaction');
  mkdirSync(directory, { recursive: true });
  for (const phase of ['pre', 'post']) {
    for (let n = 1; n <= 23; n++) writeFileSync(join(directory, `${phase}-${n}.json`), '{}');
  }
  writeFileSync(join(directory, 'keep this.json'), 'keep');
  const target = join(cwd, 'symlink-target');
  writeFileSync(target, 'keep target');
  symlinkSync(target, join(directory, 'pre-0.json'));
  run(cwd, 'pre');
  run(cwd, 'post');
  assert.equal(readdirSync(directory).filter(n => /^pre-[1-9][0-9]*\.json$/.test(n)).length, 20);
  assert.equal(readdirSync(directory).filter(n => /^post-[0-9]+\.json$/.test(n)).length, 20);
  assert.equal(readFileSync(join(directory, 'keep this.json'), 'utf8'), 'keep');
  assert.equal(readFileSync(target, 'utf8'), 'keep target');
});

test('symlinked snapshot directories are rejected without blocking compaction', t => {
  const cwd = fixture(t);
  const outside = join(cwd, 'outside');
  mkdirSync(outside);
  mkdirSync(join(cwd, '.kiro'));
  symlinkSync(outside, join(cwd, '.kiro/compaction'));
  assert.ok(run(cwd, 'pre').includes('건너뛰었어요'));
  assert.deepEqual(readdirSync(outside), []);
});

test('non-repository invocation fails open with recovery guidance', t => {
  const cwd = mkdtempSync(join(tmpdir(), 'jamjam nonrepo '));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  assert.ok(run(cwd, 'post').includes('건너뛰었어요'));
  assert.deepEqual(readdirSync(cwd), []);
});
