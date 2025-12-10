const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const scriptPath = isWin ? path.join(__dirname, 'run_test.bat') : path.join(__dirname, 'run_test.sh');
// exec requires a single command string; quote the script path so paths with spaces are handled.
const script = `"${scriptPath}"`;
const logDir = path.resolve('logs');
const logFile = path.join(logDir, 'test_run.log');

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function stamp() { return new Date().toISOString(); }

exec(script, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout, stderr) => {
  const out = stdout ? stdout.toString() : '';
  const errOut = stderr ? stderr.toString() : '';
  const status = err ? 'TEST FAILED' : 'TEST PASSED';

  const record = [];
  record.push(`[${stamp()}] script: ${script}`);
  record.push(`[${stamp()}] status: ${status}`);
  record.push('=== STDOUT ===');
  record.push(out.trim());
  if (errOut.trim()) {
    record.push('=== STDERR ===');
    record.push(errOut.trim());
  }
  record.push('\n');

  fs.appendFileSync(logFile, record.join('\n') + '\n');

  console.log('Auto-test finished — status:', status);
  console.log('Log saved to', logFile);
  process.exit(err ? 1 : 0);
});
