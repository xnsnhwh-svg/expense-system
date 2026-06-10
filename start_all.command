#!/bin/bash

# 企业财务报销系统 - 一键启动 (Mac版)

echo "========================================"
echo "  企业财务报销系统 - 一键启动"
echo "========================================"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到Python，请先安装Python 3.11+"
    echo "  访问: https://www.python.org/downloads/"
    read -p "按回车键退出..."
    exit 1
fi

# 检查Node
if ! command -v node &> /dev/null; then
    echo "[错误] 未找到Node.js，请先安装Node.js 18+"
    echo "  访问: https://nodejs.org/"
    read -p "按回车键退出..."
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 启动后端
echo "[1/4] 安装后端依赖..."
cd "$SCRIPT_DIR/backend"
pip3 install -r requirements.txt --quiet 2>/dev/null

echo "[2/4] 初始化数据库..."
python3 init_db.py 2>/dev/null

echo "[3/4] 启动后端服务..."
open http://localhost:8000/docs
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
echo "[4/4] 启动前端服务..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "  安装前端依赖..."
    npm install
fi

open http://localhost:3001
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  系统已启动！"
echo "========================================"
echo ""
echo "  前端: http://localhost:3001"
echo "  后端: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo ""
echo "  测试账号:"
echo "    员工: employee / employee123"
echo "    财务: finance / finance123"
echo "    主管: manager / manager123"
echo "    管理员: admin / admin123"
echo ""
echo "========================================"
echo "  按 Ctrl+C 停止服务"
echo "========================================"

# 等待退出
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '服务已停止'" EXIT
wait
