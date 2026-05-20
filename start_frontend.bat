@echo off
title 企业财务报销系统 - 前端服务
color 0A

echo ========================================
echo   企业财务报销系统 - 前端启动
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [1/3] 检查Node环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js 18+
    pause
    exit /b 1
)

echo [2/3] 检查npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到npm
    pause
    exit /b 1
)

echo [3/3] 检查依赖...
if not exist "node_modules" (
    echo [安装] 正在安装前端依赖...
    npm install
)

echo.
echo ========================================
echo   启动前端服务...
echo   访问地址: http://localhost:3000
echo ========================================
echo.
echo 按 Ctrl+C 停止服务

npm run dev

pause
