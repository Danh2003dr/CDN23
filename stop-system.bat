@echo off
echo ========================================
echo     DỪNG CDN MANAGEMENT SYSTEM
echo ========================================

echo [INFO] Đang dừng tất cả process Node.js...
taskkill /f /im node.exe 2>nul

echo [INFO] Đang dừng tất cả process React...
for /f "tokens=2" %%i in ('tasklist /fi "windowtitle eq CDN Frontend*" ^| findstr cmd') do taskkill /f /pid %%i 2>nul

echo [INFO] Đang dừng tất cả process Express...
for /f "tokens=2" %%i in ('tasklist /fi "windowtitle eq CDN Backend*" ^| findstr cmd') do taskkill /f /pid %%i 2>nul

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo       HỆ THỐNG ĐÃ ĐƯỢC DỪNG
echo ========================================
echo.
pause