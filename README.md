# Security Audit Artifacts

Generated files:
- input_backup.ts — backup copy of the original file (unchanged)
- input.ts — secure, fixed version (includes a secure marker)
- report.json — machine-readable audit summary
- test.js — Node test that inspects files for secrets and a secure marker
- test_runner.js — runs tests for expected pass/fail per file and reports pass rate
- run_test.sh / run_test.bat — convenience scripts to run the test runner
- auto_test.js — detects OS, runs the appropriate script, and appends logs to logs/test_run.log
- logs/test_run.log — (created by auto_test.js) test run history

How to run tests:
- Linux/macOS: ./run_test.sh
- Windows: run_test.bat
- Or run: node test_runner.js

How to run the auto tester and view logs:
- node auto_test.js
- Logs are appended to logs/test_run.log (timestamp + output + status)

How to confirm security fixes:
- test.js looks for common secret patterns and a secure marker in the fixed file.
- input.ts includes `export const __SECURE__ = true;` as the verification marker. input_backup.ts is expected to fail the tests.
