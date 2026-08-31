@echo off
REM AI Interview Coach - double-click this file on Windows to set up and
REM launch the app. See README.md "Quick start" for details.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
echo.
pause
