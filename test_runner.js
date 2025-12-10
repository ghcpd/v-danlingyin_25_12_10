const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  { file: 'input_backup.ts', expect: 'fail' },
  { file: 'input.ts', expect: 'pass' }
];

let passedCount = 0;
let results = [];

for (const t of tests) {
  const res = spawnSync('node', [path.join(__dirname, 'test.js'), t.file], { encoding: 'utf8' });
  const code = res.status;
  const stdout = res.stdout ? res.stdout.trim() : '';
  const stderr = res.stderr ? res.stderr.trim() : '';

  // test.js returns 0 on PASS (no forbidden patterns), 1 on FAIL (forbidden patterns found), 2 on read error
  const actual = (code === 0) ? 'pass' : 'fail';
  const ok = actual === t.expect;
  if (ok) passedCount++;
  results.push({ file: t.file, expected: t.expect, actual, code, ok, stdout, stderr });
  console.log(`${t.file}: expected=${t.expect} actual=${actual} code=${code}`);
  if (stdout) console.log('stdout:', stdout);
  if (stderr) console.error('stderr:', stderr);
}

const total = tests.length;
const passRate = Math.round((passedCount / total) * 100);
console.log(`\nSummary: ${passedCount}/${total} tests matched expected behavior (${passRate}%).`);

// Exit non-zero if any test didn't match expected behavior
if (passedCount !== total) {
  console.error('Some tests did not meet expected behavior.');
  process.exit(1);
}
console.log('All tests behaved as expected.');
process.exit(0);
