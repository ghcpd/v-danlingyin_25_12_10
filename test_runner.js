// test_runner.js - Run tests for expected behaviors and report pass rate
const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  {file: 'input_backup.ts', expectPass: false},
  {file: 'input.ts', expectPass: true}
];

let passed = 0;
let total = tests.length;

for (const t of tests) {
  const target = path.resolve(__dirname, t.file);
  const res = spawnSync('node', [path.resolve(__dirname, 'test.js'), target], {encoding:'utf8'});
  const success = res.status === 0;
  const ok = success === t.expectPass;
  console.log(`${t.file}: ${success ? 'PASS' : 'FAIL'} (expected ${t.expectPass ? 'PASS' : 'FAIL'}) -> ${ok ? 'OK' : 'UNEXPECTED'}`);
  if (ok) passed++;
}

const percent = Math.round((passed/total)*100);
console.log(`Final: ${passed}/${total} tests OK (${percent}%)`);
if (passed !== total) process.exit(2);
process.exit(0);
