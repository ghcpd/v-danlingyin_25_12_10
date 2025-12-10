@echo off
:: Run the JS test runner (Windows)
node "%~dp0test_runner.js"
exit /b %errorlevel%
