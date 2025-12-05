@echo off
echo Building and Starting Mobile Shop POS...
echo.
echo Building Angular app...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)
echo.
echo Starting Electron...
call npm run electron
pause

