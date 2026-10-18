@echo off
setlocal
if not exist "%~dp0app\DesktopPet.exe" (
  echo [ERROR] Desktop pet executable was not found.
  pause
  exit /b 1
)
start "" "%~dp0app\DesktopPet.exe"
exit /b 0
