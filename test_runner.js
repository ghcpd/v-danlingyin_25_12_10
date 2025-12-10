// test_runner.js — runs test.js against multiple files and reports pass rate
const { exec } = require('child_process');
const tests = [
  { file: 'input_backup.ts', expect: 'fail' },
  { file: 'input.ts', expect: 'pass' }
];

let completed = 0;
let passed = 0;
const results = [];

function runTest(t) {
  // Quote the filename to handle paths with spaces
  exec(`node test.js "${t.file}"`, (err, stdout, stderr) => {
    const out = stdout.trim() || stderr.trim();
    const status = err ? 'fail' : 'pass';
    const ok = status === t.expect;
    results.push({ file: t.file, expect: t.expect, status, ok, output: out });
    if (ok) passed++;
    completed++;
    if (completed === tests.length) finish();
  });
}

function finish() {
  console.log('Test results:');
  for (const r of results) {
    console.log(`${r.file}: expected=${r.expect} actual=${r.status} ${r.ok ? 'OK' : 'FAIL'}`);
  }
  const passRate = (passed / tests.length) * 100;
  console.log(`Pass rate: ${passRate}% (${passed}/${tests.length})`);
  process.exit(passed === tests.length ? 0 : 1);
}

for (const t of tests) runTest(t);
