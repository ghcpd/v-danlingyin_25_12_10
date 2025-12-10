@echo off
REM Runs the test runner (Windows)
node test_runner.js
IF %ERRORLEVEL% EQU 0 (
  echo TEST RUNNER: ALL EXPECTATIONS MET
  exit /b 0
) ELSE (
  echo TEST RUNNER: SOME EXPECTATIONS FAILED
  exit /b 1
)
