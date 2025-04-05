@echo off
echo [*] Запускаем Silero TTS App...

REM Проверяем, что всё необходимое установлено
if not exist "node_modules" (
    echo [!] Кажется, зависимости не установлены
    echo [!] Сначала запустите setup.bat
    pause
    exit /b 1
)

REM Запускаем приложение
echo [*] Запускаем backend и frontend...
npm start

REM В случае ошибки
if %ERRORLEVEL% NEQ 0 (
    echo [!] Произошла ошибка при запуске приложения
    pause
    exit /b 1
)

pause