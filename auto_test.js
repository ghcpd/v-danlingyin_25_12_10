const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const script = isWindows ? 'run_test.bat' : 'run_test.sh';
const fullScript = path.join(__dirname, script);

if (!fs.existsSync(fullScript)) {
  console.error('Missing test script:', fullScript);
  process.exit(2);
}

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'test_run.log');

const start = new Date();
let res;
let executed = null;
// Prefer invoking Node directly with test_runner.js to avoid shell quoting issues on paths with spaces.
const runnerPath = path.join(__dirname, 'test_runner.js');
if (fs.existsSync(runnerPath)) {
  res = spawnSync(process.execPath, [runnerPath], { encoding: 'utf8' });
  executed = `${process.execPath} ${runnerPath}`;
} else {
  // Fallback: call the platform-specific script; ensure fullScript is quoted to handle spaces
  res = spawnSync(`"${fullScript}"`, { encoding: 'utf8', shell: true });
  executed = fullScript;
}
const end = new Date();

const logEntry = {
  timestamp: start.toISOString(),
  duration_ms: end - start,
  script: executed || script,
  stdout: res && res.stdout ? res.stdout.toString() : '',
  stderr: res && res.stderr ? res.stderr.toString() : '',
  status: res && res.status === 0 ? 'TEST PASSED' : 'TEST FAILED'
};

fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

console.log('Test run saved to', logFile);
console.log('Status:', logEntry.status);
process.exit(res.status === 0 ? 0 : 1);
