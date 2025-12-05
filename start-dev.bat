@echo off
echo Starting Mobile Shop POS in Development Mode...
echo.
echo Step 1: Starting Angular Dev Server...
start "Angular Dev Server" cmd /k "npm start"
timeout /t 10 /nobreak >nul
echo.
echo Step 2: Starting Electron...
set NODE_ENV=development
npm run electron
pause

