const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const isWindows = os.platform() === 'win32';
const script = isWindows ? 'run_test.bat' : 'run_test.sh';
try {
  const output = execSync(script, { encoding: 'utf8' });
  const timestamp = new Date().toISOString();
  const log = `${timestamp}\nTested file: ${script}\nOutput:\n${output}\nFinal status: ${output.includes('All tests passed') ? 'TEST PASSED' : 'TEST FAILED'}\n`;
  fs.mkdirSync('logs', { recursive: true });
  fs.appendFileSync('logs/test_run.log', log);
  console.log(log);
} catch (err) {
  const timestamp = new Date().toISOString();
  const log = `${timestamp}\nTested file: ${script}\nOutput:\n${err.stdout || ''}\n${err.stderr || ''}\nFinal status: TEST FAILED\n`;
  fs.mkdirSync('logs', { recursive: true });
  fs.appendFileSync('logs/test_run.log', log);
  console.log(log);
}