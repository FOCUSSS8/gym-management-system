@echo off
chcp 65001 >nul
title Gym MVP Demo
echo.
echo   Opening demo in your default browser...
echo   Tip: use the role dropdown at top-right to switch views.
echo.
start "" "%~dp0index.html"
timeout /t 2 >nul
exit
