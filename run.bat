@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "BACKEND_DIR=%PROJECT_ROOT%backend\src"

where npm >nul 2>&1
if errorlevel 1 (
    echo npm was not found. Install Node.js, then run this file again.
    pause
    exit /b 1
)

where java >nul 2>&1
if errorlevel 1 (
    echo Java was not found. Install JDK 17 or newer, then run this file again.
    pause
    exit /b 1
)

where mvn >nul 2>&1
if errorlevel 1 (
    echo Maven was not found. Install Maven, then run this file again.
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    pushd "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        popd
        echo Frontend dependency installation failed.
        pause
        exit /b 1
    )
    popd
)

echo Starting Dayflow frontend and backend...
start "Dayflow Frontend" /D "%FRONTEND_DIR%" cmd /k npm run dev
start "Dayflow Backend" /D "%BACKEND_DIR%" cmd /k mvn spring-boot:run

echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo Close the two opened terminals to stop the services.
endlocal