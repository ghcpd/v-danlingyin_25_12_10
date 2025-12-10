@echo off
REM run_test.bat - Test script for Windows
REM Runs test_runner.js and logs output

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "LOG_DIR=%SCRIPT_DIR%logs"
set "LOG_FILE=%LOG_DIR%\test_run.log"

REM Create logs directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Run the test runner
echo Running security tests...
echo. >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
echo Timestamp: %date% %time% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"

node "%SCRIPT_DIR%test_runner.js"
if errorlevel 1 (
    echo TEST FAILED >> "%LOG_FILE%"
    echo TEST FAILED
    exit /b 1
) else (
    echo TEST PASSED >> "%LOG_FILE%"
    echo TEST PASSED
    exit /b 0
)
