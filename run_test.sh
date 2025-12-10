#!/usr/bin/env sh
# Runs the test runner (Unix/macOS/Linux)
node test_runner.js
EXIT=$?
if [ "$EXIT" -eq 0 ]; then
  echo "TEST RUNNER: ALL EXPECTATIONS MET"
else
  echo "TEST RUNNER: SOME EXPECTATIONS FAILED"
fi
exit $EXIT
