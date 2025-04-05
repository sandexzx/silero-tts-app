@echo off
echo [*] Скрипт установки Silero TTS App
echo [*] Проверяем нужный софт...

REM Проверяем Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Python не найден! Нужно установить Python 3.8 или выше
    echo [!] Скачай его с https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Проверяем Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js не найден! Нужно установить Node.js 16 или выше
    echo [!] Скачай его с https://nodejs.org/
    pause
    exit /b 1
)

REM Проверяем npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] npm не найден! Должен быть установлен вместе с Node.js
    pause
    exit /b 1
)

echo [+] Все необходимые программы найдены!
echo [*] Устанавливаем зависимости Python...

REM Создаем папку для моделей
if not exist "backend\models" mkdir backend\models
if not exist "backend\temp_audio" mkdir backend\temp_audio

REM Устанавливаем зависимости Python
pip install -r backend\requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ошибка при установке Python-зависимостей
    pause
    exit /b 1
)

echo [+] Python-зависимости установлены!
echo [*] Устанавливаем npm пакеты...

REM Устанавливаем npm пакеты для корневого проекта
npm install
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ошибка при установке npm пакетов в корневой директории
    pause
    exit /b 1
)

echo [+] Корневые npm пакеты установлены!
echo [*] Устанавливаем npm пакеты для фронтенда...

REM Переходим в директорию frontend и устанавливаем npm пакеты
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ошибка при установке npm пакетов для фронтенда
    cd ..
    pause
    exit /b 1
)

echo [+] Все зависимости установлены успешно!
echo [*] Теперь можно запускать приложение через run.bat
cd ..
pause