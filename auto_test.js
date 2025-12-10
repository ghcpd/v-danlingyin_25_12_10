// auto_test.js - detect OS and run tests, logging results
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const script = isWin ? path.resolve(__dirname, 'run_test.bat') : path.resolve(__dirname, 'run_test.sh');

let out;
if (isWin) {
  // Call the node runner directly to avoid cmd quotation issues when paths contain spaces
  const runner = path.resolve(__dirname, 'test_runner.js');
  out = spawnSync('node', [runner], {encoding: 'utf8'});
} else {
  // Use shell execution on POSIX
  out = spawnSync(script, [], {shell: true, encoding: 'utf8'});
}
const timestamp = new Date().toISOString();
const logDir = path.resolve(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.resolve(logDir, 'test_run.log');

const testedFiles = ['input_backup.ts','input.ts'];
const finalStatus = out.status === 0 ? 'TEST PASSED' : 'TEST FAILED';

const logEntry = {
  timestamp,
  tested_files: testedFiles,
  stdout: out.stdout,
  stderr: out.stderr,
  status: finalStatus
};

fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
console.log(`${finalStatus} — details written to ${logFile}`);
process.exit(out.status);
