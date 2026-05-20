#!/bin/bash

# 企业财务报销系统 - 后端启动 (Mac版)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/backend"

echo "========================================"
echo "  企业财务报销系统 - 后端启动"
echo "========================================"
echo ""

echo "[1/3] 检查依赖..."
pip3 install -r requirements.txt --quiet 2>/dev/null

echo "[2/3] 初始化数据库..."
python3 init_db.py

echo "[3/3] 启动服务..."
echo ""
echo "  访问地址: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo ""
echo "  按 Ctrl+C 停止服务"
echo ""

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
