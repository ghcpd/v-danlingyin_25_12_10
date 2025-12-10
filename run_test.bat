@echo off
REM Run the test runner (Windows)
node "%~dp0test_runner.js"
exit /B %ERRORLEVEL%
