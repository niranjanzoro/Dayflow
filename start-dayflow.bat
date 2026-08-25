@echo off
REM ============================================================
REM  Dayflow HRMS - full stack in REAL API mode
REM  (no demo codes: verification emails are actually sent)
REM
REM  One-time setup before first run:
REM    1. Create backend\.env (copy from .env.example) and set:
REM         MAIL_ENABLED=true
REM         MAIL_USERNAME=your@gmail.com
REM         MAIL_PASSWORD=<16-char Gmail App Password>
REM         MAIL_FROM=your@gmail.com
REM    2. MySQL must be running (default root/root on :3306)
REM ============================================================

title Dayflow Launcher

echo Starting Spring Boot backend on :8080 ...
start "Dayflow Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo Waiting for backend to boot...
timeout /t 20 /nobreak >nul

echo Starting frontend on :5173 in REAL API mode...
start "Dayflow Frontend" cmd /k "cd /d %~dp0frontend && set VITE_USE_MOCK=false&& npm run dev"

echo.
echo Done. Open http://localhost:5173
echo   - Sign up: code arrives by EMAIL, never shown on screen.
echo   - After verifying, an HR must approve the account
%%     (sign in as admin@dayflow.com / Admin@123 -^> Employee Management).
echo Close both windows to stop.
pause
