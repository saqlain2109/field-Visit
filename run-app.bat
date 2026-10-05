@echo off
title Field Visit CRM - FullStack Launcher
echo ===================================================
echo   Starting Field Visit CRM (Backend + Frontend)
echo ===================================================

echo Starting Spring Boot Backend (Port 4000)...
start "CRM-Backend" cmd /k "cd /d "%~dp0backend-java" && mvn spring-boot:run"

echo Starting Vite Frontend (Port 3000)...
start "CRM-Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ===================================================
echo   Both applications are launching in separate windows!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000
echo ===================================================
pause
