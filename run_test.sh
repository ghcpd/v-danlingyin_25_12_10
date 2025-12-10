#!/usr/bin/env bash
# Run the JS test runner (Linux/macOS)
node "$(dirname "$0")/test_runner.js"
exit $?
