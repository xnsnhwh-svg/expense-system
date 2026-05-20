# 企业财务智能报销与审核编排系统

基于CrewAI多Agent架构的企业财务报销系统，支持发票OCR识别、AI合规校验和审批流程编排。

## 功能特性

### 多Agent编排系统
- **OCR识别Agent** - 从发票图片提取关键信息
- **合规校验Agent** - 验证发票真实性、重复报销、金额一致性
- **审批路由Agent** - 智能分发给合适的审批人

### 核心功能
- [x] 发票上传（支持图片、PDF）
- [x] OCR发票识别（模拟/百度API）
- [x] AI合规校验（4项规则检测）
- [x] 多级审批流程（财务初审 + 主管审批）
- [x] 流程状态可视化
- [x] 角色权限管理

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | FastAPI + Python |
| 前端框架 | React 18 + Ant Design + Vite |
| 多Agent框架 | CrewAI |
| 数据库 | PostgreSQL + SQLAlchemy |
| 认证 | JWT |
| OCR | 百度OCR API（可选） |

## 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/xnsnhwh-svg/expense-system.git
cd expense-system
```

### 2. 启动后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python init_db.py

# 启动服务
uvicorn app.main:app --reload
```

后端运行在 http://localhost:8000

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动服务
npm run dev
```

前端运行在 http://localhost:3000

### 4. 配置百度OCR（可选）

如需使用真实OCR识别，在 `backend/.env` 中配置：

```env
BAIDU_OCR_API_KEY=你的API Key
BAIDU_OCR_SECRET_KEY=你的Secret Key
```

不配置则使用模拟OCR数据。

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 员工 | employee | employee123 | 发起报销 |
| 财务 | finance | finance123 | 初审报销单 |
| 主管 | manager | manager123 | 审批大额报销 |
| 管理员 | admin | admin123 | 系统管理 |

## 系统流程

```
员工提交报销
     ↓
上传发票图片
     ↓
┌─────────────────────────────────┐
│        CrewAI 多Agent编排        │
├─────────────────────────────────┤
│  OCR识别Agent → 提取发票信息     │
│  合规校验Agent → AI规则检测      │
│  审批路由Agent → 确定审批节点     │
└─────────────────────────────────┘
     ↓
财务初审（审核通过/驳回）
     ↓
主管审批（≥5000元需此步骤）
     ↓
审批通过 → 打款完成
```

## 项目结构

```
expense-system/
├── backend/
│   ├── app/
│   │   ├── agents/          # CrewAI多Agent
│   │   │   ├── orchestrator.py
│   │   │   ├── tasks.py
│   │   │   └── tools.py
│   │   ├── models/          # 数据库模型
│   │   ├── routers/         # API路由
│   │   │   ├── auth.py
│   │   │   ├── expense.py
│   │   │   ├── invoice.py
│   │   │   └── approval.py
│   │   ├── services/        # 业务服务
│   │   └── utils/           # 工具
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           # 页面
│       ├── components/       # 组件
│       └── api/             # API调用
└── docs/                    # 设计文档
```

## API文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 开发说明

### 数据库初始化

首次运行需要初始化数据库和测试用户：

```bash
cd backend
python init_db.py
```

### 前置要求

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

## License

MIT
