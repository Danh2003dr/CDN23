@echo off
echo ========================================
echo     CDN MANAGEMENT SYSTEM STARTUP
echo ========================================

REM Kiểm tra và tạo file .env nếu chưa có
if not exist "server\.env" (
    echo [INFO] Tạo file .env từ env.example...
    copy "server\env.example" "server\.env"
    echo [WARNING] Vui lòng chỉnh sửa file server\.env với thông tin database và JWT secret!
    echo.
)

REM Dừng các process đang sử dụng port 5000
echo [INFO] Kiểm tra và dừng process đang sử dụng port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    if not "%%a"=="0" (
        echo [INFO] Dừng process PID: %%a
        taskkill /F /PID %%a 2>nul
    )
)

REM Dừng tất cả process node
echo [INFO] Dừng tất cả process Node.js...
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul

REM Khởi động backend
echo [INFO] Khởi động Backend Server...
start "CDN Backend" cmd /k "cd server && npm run dev"

REM Chờ backend khởi động
timeout /t 5 /nobreak >nul

REM Khởi động frontend
echo [INFO] Khởi động Frontend...
start "CDN Frontend" cmd /k "cd client-new && npm start"

echo.
echo ========================================
echo    HỆ THỐNG ĐANG KHỞI ĐỘNG...
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này...
pause >nul