# Security audit artifacts — quick runbook

Files generated
- `input_backup.ts` — an unchanged copy of the original `input.ts` (keeps unsafe patterns for testing).
- `input.ts` — fixed/secure version. Removes environment-variable-name leakage and adds PBKDF2 iteration upper bound.
- `report.json` — structured security report with findings and recommendations.
- `test.js` — a per-file security test harness (heuristics for the findings above).
- `test_runner.js` — runs tests against two targets with expected outcomes and prints pass rate.
- `run_test.sh` / `run_test.bat` — convenience scripts to run `test_runner.js` on Unix or Windows.
- `auto_test.js` — detects OS, runs the appropriate test script and appends results to `logs/test_run.log`.

How to run tests

Unix/macOS:
```sh
./run_test.sh
```

Windows (cmd):
```cmd
run_test.bat
```

Auto runner (cross-platform):
```sh
node auto_test.js
```

How to read logs

- Logs are appended to `logs/test_run.log`. Each run includes an ISO timestamp, stdout/stderr and final status (TEST PASSED / TEST FAILED).

How to confirm security fixes

- `test_runner.js` is configured to expect `input_backup.ts` to FAIL (it contains the original insecure patterns) and `input.ts` to PASS (the fixed code). The test harness (`test.js`) will report PASS/FAIL per file and `test_runner.js` will return non-zero exit code if expectations are not met.
