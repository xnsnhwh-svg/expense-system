#!/bin/bash

# 企业财务报销系统 - 前端启动 (Mac版)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/frontend"

echo "========================================"
echo "  企业财务报销系统 - 前端启动"
echo "========================================"
echo ""

echo "[1/2] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "  安装前端依赖..."
    npm install
fi

echo "[2/2] 启动服务..."
echo ""
echo "  访问地址: http://localhost:3001"
echo ""
echo "  按 Ctrl+C 停止服务"
echo ""

open http://localhost:3001
npm run dev
