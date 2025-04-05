@echo off
echo [*] Silero TTS App Setup Script
echo [*] Checking required software...
REM Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Python not found! You need Python 3.8 or higher
    echo [!] Download it from https://www.python.org/downloads/
    pause
    exit /b 1
)
REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js not found! You need Node.js 16 or higher
    echo [!] Download it from https://nodejs.org/
    pause
    exit /b 1
)
REM Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] npm not found! Should be installed with Node.js
    pause
    exit /b 1
)
echo [+] All required programs found!
echo [*] Installing Python dependencies...
REM Create folders for models
if not exist "backend\models" mkdir backend\models
if not exist "backend\temp_audio" mkdir backend\temp_audio
REM Install Python dependencies
pip install -r backend\requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [!] Error installing Python dependencies
    pause
    exit /b 1
)
echo [+] Python dependencies installed!
echo [*] Installing npm packages...
REM Install npm packages for root project
npm install
if %ERRORLEVEL% NEQ 0 (
    echo [!] Error installing npm packages in root directory
    pause
    exit /b 1
)
echo [+] Root npm packages installed!
echo [*] Installing npm packages for frontend...
REM Navigate to frontend directory and install npm packages
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo [!] Error installing npm packages for frontend
    cd ..
    pause
    exit /b 1
)
echo [+] All dependencies successfully installed!
echo [*] You can now run the application using run.bat
cd ..
pause