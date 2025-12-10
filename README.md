Summary of generated files:

- input_backup.ts: Unchanged copy of the original source (keeps original behavior for comparison).
- input.ts: Secure, refactored version with the following hardening: generic error messages (no env var names), Buffer return for private keys, and enforced MIN/MAX PBKDF2 iterations.
- report.json: JSON security audit report listing discovered issues, severities, descriptions, and fixes.
- test.js: Node script that scans a code file for forbidden patterns (old error message, private-key toString usage, known secret regexes). Exits non-zero if a forbidden pattern is found.
- test_runner.js: Runs two items: input_backup.ts (expected to FAIL) and input.ts (expected to PASS). Prints results and returns non-zero if any item doesn't match expectation.
- run_test.sh / run_test.bat: Convenience scripts to run the test runner on Linux/macOS and Windows respectively.
- auto_test.js: Preferably invokes node to run test_runner.js directly (avoids shell quoting issues on paths with spaces). If test_runner.js is missing, it falls back to the platform script. It appends a log entry to logs/test_run.log containing timestamp, output, duration and final status (TEST PASSED / TEST FAILED).

How to run tests:
- Linux/macOS: ./run_test.sh
- Windows: run_test.bat
- Or run node auto_test.js to auto-select and log the run.

How to read logs:
- Logs are appended to logs/test_run.log. Each line is a JSON object containing: timestamp, duration_ms, script, stdout, stderr, and status.

How to confirm security fixes:
- The test runner checks for the previously observed insecure patterns present in input_backup.ts (the old file) and verifies they are absent in input.ts.
- A successful run shows input_backup.ts as FAIL and input.ts as PASS, and auto_test.js will log TEST PASSED.

Notes:
- No hardcoded secrets were found in the original file. The changes target hardening and reducing accidental exposure risk.
- Tune MIN_ITERATIONS and MAX_ITERATIONS to match your deployment's acceptable security/performance tradeoffs.
