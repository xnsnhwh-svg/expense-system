@echo off
title 企业财务报销系统 - 一键启动
color 0A

echo ========================================
echo   企业财务报销系统 - 一键启动
echo ========================================
echo.

:: 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.11+
    pause
    exit /b 1
)

:: 检查Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js 18+
    pause
    exit /b 1
)

:: 启动后端
echo [1/4] 启动后端服务...
start "报销系统-后端" cmd /c "cd /d "%~dp0backend" && pip install -r requirements.txt >nul 2>&1 && python init_db.py >nul 2>&1 && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [2/4] 启动前端服务...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [安装] 正在安装前端依赖...
    npm install
)
start "报销系统-前端" cmd /c "npm run dev"

echo.
echo ========================================
echo   系统已启动！
echo ========================================
echo.
echo   前端: http://localhost:3000
echo   后端: http://localhost:8000
echo   API文档: http://localhost:8000/docs
echo.
echo   测试账号:
echo     员工: employee / employee123
echo     财务: finance / finance123
echo     主管: manager / manager123
echo     管理员: admin / admin123
echo.
echo ========================================
echo   按任意键打开浏览器...
echo ========================================

pause >nul
start http://localhost:3000
