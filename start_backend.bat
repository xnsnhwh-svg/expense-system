@echo off
title 企业财务报销系统 - 后端服务
color 0A

echo ========================================
echo   企业财务报销系统 - 后端启动
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/3] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.11+
    pause
    exit /b 1
)

echo [2/3] 检查依赖...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo [安装] 正在安装Python依赖...
    pip install -r requirements.txt
)

echo [3/3] 初始化数据库...
python init_db.py

echo.
echo ========================================
echo   启动后端服务...
echo   访问地址: http://localhost:8000
echo   API文档: http://localhost:8000/docs
echo ========================================
echo.
echo 按 Ctrl+C 停止服务

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
