#!/usr/bin/env node

const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * auto_test.js - Automatic test runner
 * Detects OS and runs appropriate test script
 * Logs all output to logs/test_run.log
 */

const SCRIPT_DIR = __dirname;
const LOG_DIR = path.join(SCRIPT_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'test_run.log');

function ensureLogsDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry + '\n');
}

function runTests() {
  ensureLogsDir();

  const platform = os.platform();
  const isWindows = platform === 'win32';

  log('========================================');
  log('AUTO TEST RUNNER');
  log('========================================');
  log(`Detected OS: ${platform}`);
  log(`Windows: ${isWindows}`);

  try {
    let result;
    
    if (isWindows) {
      log('Running: run_test.bat');
      result = execSync(`cmd /c "${path.join(SCRIPT_DIR, 'run_test.bat')}"`, {
        stdio: 'inherit',
        cwd: SCRIPT_DIR
      });
    } else {
      log('Running: run_test.sh');
      result = execSync(`bash "${path.join(SCRIPT_DIR, 'run_test.sh')}"`, {
        stdio: 'inherit',
        cwd: SCRIPT_DIR
      });
    }

    log('========================================');
    log('TEST PASSED ✓');
    log('========================================');
    return 0;
  } catch (error) {
    log('========================================');
    log('TEST FAILED ✗');
    log(`Error: ${error.message}`);
    log('========================================');
    return 1;
  }
}

if (require.main === module) {
  process.exit(runTests());
}

module.exports = { runTests };
