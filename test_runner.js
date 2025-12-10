const { execSync } = require('child_process');
const tests = [
  { file: 'input_backup.ts', expected: 'FAIL' },
  { file: 'input.ts', expected: 'PASS' }
];
let passed = 0;
let total = tests.length;
tests.forEach(test => {
  try {
    const output = execSync(`node test.js ${test.file}`, { encoding: 'utf8' }).trim();
    if (output === test.expected) {
      passed++;
      console.log(`${test.file}: PASS`);
    } else {
      console.log(`${test.file}: FAIL (expected ${test.expected}, got ${output})`);
    }
  } catch (err) {
    console.log(`${test.file}: FAIL (error: ${err.message})`);
  }
});
const rate = (passed / total * 100).toFixed(2);
console.log(`Pass rate: ${passed}/${total} (${rate}%)`);
if (passed === total) {
  console.log('All tests passed');
  process.exit(0);
} else {
  console.log('Some tests failed');
  process.exit(1);
}