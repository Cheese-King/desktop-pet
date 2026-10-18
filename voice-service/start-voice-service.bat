@echo off
setlocal EnableExtensions
set "SCRIPT_DIR=%~dp0"
set "GSV_ROOT=%~1"
if not defined GSV_ROOT set "GSV_ROOT=%GPT_SOVITS_ROOT%"
if not defined GSV_ROOT (
  echo [ERROR] GPT-SoVITS root was not provided.
  pause
  exit /b 1
)
for %%I in ("%GSV_ROOT%") do set "GSV_ROOT=%%~fI"
set "PYTHON=%GSV_ROOT%\runtime\python.exe"

if not exist "%PYTHON%" (
  echo [ERROR] GPT-SoVITS Python was not found: %PYTHON%
  pause
  exit /b 1
)

cd /d "%GSV_ROOT%"
set "PATH=%GSV_ROOT%\runtime;%PATH%"
"%PYTHON%" "%SCRIPT_DIR%voice_service.py" --config "%SCRIPT_DIR%voice.config.json" --gpt-sovits-root "%GSV_ROOT%"

if errorlevel 1 pause
