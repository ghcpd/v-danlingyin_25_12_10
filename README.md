# Security Audit Artifacts

Files generated:
- input_backup.ts — unchanged copy of the original file (for comparison / reproducibility)
- input.ts — hardened, fixed version (marker: SECURITY_FIX_APPLIED)
- report.json — JSON security report listing findings and fixes
- test.js — validator that scans a single file (fails if marker missing or secrets detected)
- test_runner.js — runs tests for input_backup.ts (expected FAIL) and input.ts (expected PASS)
- run_test.sh / run_test.bat — convenience wrappers for Linux/macOS and Windows
- auto_test.js — detects OS, runs tests, and writes logs to logs/test_run.log
- logs/test_run.log — appended by auto_test.js with timestamped entries

How to run tests:
1) Linux/macOS: ./run_test.sh
2) Windows: run_test.bat
3) Or run auto_test.js: node auto_test.js (this will also write logs)

How to read logs:
- Check logs/test_run.log for JSON lines with timestamp, tested_files, stdout/stderr and final status.

How to confirm security fixes:
- input.ts contains the marker comment SECURITY_FIX_APPLIED. The test harness looks for this marker and heuristic secret patterns.
- report.json documents the vulnerabilities and the secure snippets added.
