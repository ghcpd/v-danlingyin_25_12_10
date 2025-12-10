#!/bin/bash

# run_test.sh - Test script for Linux/macOS
# Runs test_runner.js and logs output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/test_run.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Run the test runner
echo "Running security tests..." | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

if node "$SCRIPT_DIR/test_runner.js" | tee -a "$LOG_FILE"; then
    echo "TEST PASSED" | tee -a "$LOG_FILE"
    exit 0
else
    echo "TEST FAILED" | tee -a "$LOG_FILE"
    exit 1
fi
