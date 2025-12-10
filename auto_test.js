// auto_test.js — detects OS, runs appropriate test script, and logs output
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const cmd = isWin ? 'run_test.bat' : 'bash run_test.sh';
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'test_run.log');

exec(cmd, { timeout: 5 * 60 * 1000 }, (err, stdout, stderr) => {
  const timestamp = new Date().toISOString();
  const output = (stdout || '') + (stderr || '');
  const status = err ? 'TEST FAILED' : 'TEST PASSED';
  const entry = `${timestamp} | ${isWin ? 'Windows' : 'Unix'} | ${cmd} | ${status}\n${output}\n----\n`;
  fs.appendFileSync(logFile, entry);
  console.log(entry);
  process.exit(err ? 1 : 0);
});
