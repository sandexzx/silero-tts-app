@echo off
echo [*] Launching Silero TTS App...
REM Checking if everything needed is installed
if not exist "node_modules" (
    echo [!] Seems like dependencies aren't installed
    echo [!] Please run setup.bat first
    pause
    exit /b 1
)
REM Starting the application
echo [*] Launching backend and frontend...
npm start
REM In case of error
if %ERRORLEVEL% NEQ 0 (
    echo [!] An error occurred while launching the application
    pause
    exit /b 1
)
pause