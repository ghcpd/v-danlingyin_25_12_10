const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  { file: 'input_backup.ts', expect: 'fail' },
  { file: 'input.ts', expect: 'pass' }
];

let passed = 0;
let total = tests.length;

console.log('Running security tests (expectation-driven)');

tests.forEach(t => {
  const p = path.resolve(t.file);
  console.log('\n-- Testing', t.file, '(expected:', t.expect + ')');
  const r = spawnSync('node', ['test.js', p], { encoding: 'utf8' });
  const stdout = r.stdout ? r.stdout.trim() : '';
  const stderr = r.stderr ? r.stderr.trim() : '';
  const code = r.status;

  console.log(stdout);
  if (stderr) console.error(stderr);

  const result = code === 0 ? 'pass' : 'fail';
  const ok = result === t.expect;
  console.log(`Result: ${result}  Expected: ${t.expect}  ${ok ? '✅' : '❌'}`);
  if (ok) passed++;
});

console.log('\nSUMMARY: ' + passed + '/' + total + ' expectations met.');
const success = passed === total;
process.exit(success ? 0 : 1);
