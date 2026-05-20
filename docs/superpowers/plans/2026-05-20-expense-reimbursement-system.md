# 企业财务智能报销与审核编排系统 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个可演示的报销系统原型：员工上传发票 → OCR识别 → AI校验 → 审批流转 → 流程监控

**Architecture:** 前后端分离架构。FastAPI后端提供REST API，React前端实现员工端和财务端界面，PostgreSQL存储数据，百度OCR API处理发票识别。

**Tech Stack:** Python 3.11+ / FastAPI / SQLAlchemy / PostgreSQL / React 18 / 百度OCR API

---

## Phase 1: 项目基础搭建（第1-2周）

### Task 1: 后端项目初始化

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: 创建后端项目目录和依赖文件**

```txt
# backend/requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
python-multipart==0.0.6
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
alembic==1.13.1
aiohttp==3.9.1
```

- [ ] **Step 2: 创建FastAPI入口文件**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="企业财务智能报销系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "企业财务智能报销系统 API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

- [ ] **Step 3: 创建配置文件**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # 数据库
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/expense_db"

    # JWT认证
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 百度OCR API (需要申请)
    BAIDU_OCR_API_KEY: str = ""
    BAIDU_OCR_SECRET_KEY: str = ""

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
```

- [ ] **Step 4: 创建数据库连接**

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 5: 测试后端启动**

Run: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
Expected: `Uvicorn running on http://127.0.0.1:8000`

- [ ] **Step 6: Commit**

```bash
mkdir -p backend/app
git init
git add backend/requirements.txt backend/app/
git commit -m "feat: 项目初始化，FastAPI基础框架"
```

---

### Task 2: 前端项目初始化

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/api/index.js`

- [ ] **Step 1: 创建前端项目结构**

```json
{
  "name": "expense-system-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.2",
    "antd": "^5.12.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.10"
  }
}
```

- [ ] **Step 2: 创建Vite配置**

```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

- [ ] **Step 3: 创建React入口**

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import 'antd/dist/reset.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 4: 创建App主组件和路由**

```jsx
// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import LoginPage from './pages/LoginPage'
import EmployeeDashboard from './pages/EmployeeDashboard'
import FinanceDashboard from './pages/FinanceDashboard'
import ApprovalPage from './pages/ApprovalPage'

function App() {
  return (
    <ConfigProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/approval/:id" element={<ApprovalPage />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App
```

- [ ] **Step 5: 创建API调用模块**

```javascript
// frontend/src/api/index.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const login = (username, password) =>
  api.post('/auth/login', { username, password })

export const uploadInvoice = (formData) =>
  api.post('/invoice/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getExpenseList = (role) =>
  api.get(`/expense/list?role=${role}`)

export const approveExpense = (id, result) =>
  api.post(`/expense/${id}/approve`, result)

export default api
```

- [ ] **Step 6: 安装依赖并测试前端**

Run: `cd frontend && npm install && npm run dev`
Expected: 前端运行在 http://localhost:3000

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: 前端项目初始化，React + Ant Design + Vite"
```

---

### Task 3: 数据库模型设计

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/expense.py`
- Create: `backend/app/models/invoice.py`
- Create: `backend/app/models/approval_log.py`

- [ ] **Step 1: 创建用户模型**

```python
# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    EMPLOYEE = "employee"       # 普通员工
    FINANCE = "finance"         # 财务人员
    MANAGER = "manager"         # 主管
    ADMIN = "admin"            # 管理员

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    department = Column(String(100))
    is_active = Column(Integer, default=1)

    def __repr__(self):
        return f"<User {self.username}>"
```

- [ ] **Step 2: 创建报销单模型**

```python
# backend/app/models/expense.py
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum

class ExpenseStatus(str, enum.Enum):
    DRAFT = "draft"               # 草稿（未提交）
    PENDING_FINANCE = "pending_finance"  # 待财务初审
    PENDING_MANAGER = "pending_manager" # 待主管审批
    APPROVED = "approved"         # 审批通过
    REJECTED = "rejected"         # 驳回
    PAID = "paid"                 # 已打款

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_no = Column(String(50), unique=True, index=True, nullable=False)  # 报销单号
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)      # 报销金额
    category = Column(String(50), nullable=False)        # 报销类别：差旅/办公/招待
    description = Column(Text)                           # 报销事由
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.DRAFT, nullable=False)
    submitted_at = Column(DateTime)                      # 提交时间
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    employee = relationship("User", backref="expenses")
    invoice = relationship("Invoice", backref="expense", uselist=False)
    approval_logs = relationship("ApprovalLog", backref="expense")

    def __repr__(self):
        return f"<Expense {self.expense_no}>"
```

- [ ] **Step 3: 创建发票模型**

```python
# backend/app/models/invoice.py
from sqlalchemy import Column, Integer, String, Numeric, Date, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    invoice_no = Column(String(100), index=True)          # 发票号码
    invoice_code = Column(String(50))                     # 发票代码
    invoice_amount = Column(Numeric(10, 2))                # 发票金额
    invoice_date = Column(Date)                            # 发票日期
    seller_name = Column(String(200))                     # 销售方名称
    buyer_name = Column(String(200))                       # 购买方名称
    image_url = Column(String(500))                        # 发票图片存储地址
    ocr_raw_text = Column(Text)                           # OCR原始识别文本
    ocr_confidence = Column(Numeric(5, 4))               # OCR置信度
    validation_result = Column(String(50))                # 校验结果：valid/invalid/warning
    validation_message = Column(Text)                     # 校验信息
    created_at = Column(Integer)                          # Unix timestamp

    def __repr__(self):
        return f"<Invoice {self.invoice_no}>"
```

- [ ] **Step 4: 创建审批日志模型**

```python
# backend/app/models/approval_log.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base
from datetime import datetime

class ApprovalLog(Base):
    __tablename__ = "approval_logs"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(20), nullable=False)           # approve/reject/return
    comment = Column(Text)                                 # 审批意见
    from_status = Column(String(50))                       # 原状态
    to_status = Column(String(50))                         # 新状态
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    approver = relationship("User", backref="approval_actions")

    def __repr__(self):
        return f"<ApprovalLog {self.id}>"
```

- [ ] **Step 5: 创建模型初始化文件**

```python
# backend/app/models/__init__.py
from app.models.user import User, UserRole
from app.models.expense import Expense, ExpenseStatus
from app.models.invoice import Invoice
from app.models.approval_log import ApprovalLog

__all__ = ["User", "UserRole", "Expense", "ExpenseStatus", "Invoice", "ApprovalLog"]
```

- [ ] **Step 6: 创建数据库迁移脚本**

```python
# backend/app/init_db.py
from app.database import engine, Base
from app.models import User, Expense, Invoice, ApprovalLog
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    Base.metadata.create_all(bind=engine)

    # 创建测试用户（如果不存在）
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models import UserRole
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                hashed_password=pwd_context.hash("admin123"),
                full_name="系统管理员",
                role=UserRole.ADMIN,
                department="IT"
            )
            db.add(admin)

        if not db.query(User).filter(User.username == "finance").first():
            finance = User(
                username="finance",
                hashed_password=pwd_context.hash("finance123"),
                full_name="财务人员",
                role=UserRole.FINANCE,
                department="财务部"
            )
            db.add(finance)

        if not db.query(User).filter(User.username == "employee").first():
            employee = User(
                username="employee",
                hashed_password=pwd_context.hash("employee123"),
                full_name="测试员工",
                role=UserRole.EMPLOYEE,
                department="研发部"
            )
            db.add(employee)

        db.commit()
        print("数据库初始化完成！")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
```

- [ ] **Step 7: 测试数据库**

Run: `cd backend && python -c "from app.init_db import init_db; init_db()"`
Expected: 输出"数据库初始化完成！"

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/
git commit -m "feat: 数据库模型设计 - User, Expense, Invoice, ApprovalLog"
```

---

## Phase 2: 发票上传与OCR识别（第3-4周）

### Task 4: 发票上传功能

**Files:**
- Create: `backend/app/routers/invoice.py`
- Create: `backend/app/services/file_service.py`
- Modify: `backend/app/main.py` (添加路由)
- Create: `frontend/src/pages/InvoiceUploadPage.jsx`
- Create: `frontend/src/components/InvoiceUploader.jsx`

- [ ] **Step 1: 创建文件存储服务**

```python
# backend/app/services/file_service.py
import os
import uuid
from datetime import datetime
from typing import Optional

class FileService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def save_file(self, file, subfolder: str = "") -> str:
        """保存上传文件，返回文件访问路径"""
        if subfolder:
            target_dir = os.path.join(self.upload_dir, subfolder)
            os.makedirs(target_dir, exist_ok=True)
        else:
            target_dir = self.upload_dir

        # 生成唯一文件名
        ext = os.path.splitext(file.filename)[1]
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(target_dir, filename)

        # 保存文件
        with open(file_path, "wb") as f:
            content = file.file.read()
            f.write(content)

        # 返回相对路径
        relative_path = os.path.join(subfolder, filename) if subfolder else filename
        return f"/uploads/{relative_path}"

    def delete_file(self, file_path: str) -> bool:
        """删除文件"""
        full_path = os.path.join(self.upload_dir, file_path.replace("/uploads/", ""))
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False

file_service = FileService()
```

- [ ] **Step 2: 创建发票上传API路由**

```python
# backend/app/routers/invoice.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.file_service import file_service
from app.models import Invoice, Expense, User
from app.schemas import InvoiceResponse
from datetime import datetime

router = APIRouter(prefix="/invoice", tags=["发票"])

@router.post("/upload")
async def upload_invoice(
    file: UploadFile = File(...),
    expense_id: int = None,
    db: Session = Depends(get_db)
):
    """上传发票图片"""
    # 验证文件类型
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="只支持 JPG、PNG、PDF 格式")

    # 限制文件大小（10MB）
    if file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过10MB")

    # 保存文件
    file_path = file_service.save_file(file, subfolder="invoices")

    # 创建发票记录
    invoice = Invoice(
        expense_id=expense_id,
        image_url=file_path,
        created_at=int(datetime.now().timestamp())
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return {
        "id": invoice.id,
        "image_url": invoice.image_url,
        "message": "上传成功"
    }
```

- [ ] **Step 3: 在main.py中注册路由**

```python
# backend/app/main.py (修改)
from app.routers import invoice, expense, auth

app = FastAPI(title="企业财务智能报销系统", version="1.0.0")

# 注册路由
app.include_router(auth.router)
app.include_router(invoice.router)
app.include_router(expense.router)
```

- [ ] **Step 4: 创建发票上传前端组件**

```jsx
// frontend/src/components/InvoiceUploader.jsx
import { Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import api from '../api'

function InvoiceUploader({ expenseId, onSuccess }) {
  const props = {
    name: 'file',
    accept: 'image/jpeg,image/png,application/pdf',
    maxCount: 10,
    action: '/api/invoice/upload',
    data: { expense_id: expenseId },
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
        onSuccess?.(info.file.response)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    }
  }

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>上传发票</Button>
    </Upload>
  )
}

export default InvoiceUploader
```

- [ ] **Step 5: 创建发票上传页面**

```jsx
// frontend/src/pages/InvoiceUploadPage.jsx
import { Card, Steps, Button, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import InvoiceUploader from '../components/InvoiceUploader'

function InvoiceUploadPage() {
  const navigate = useNavigate()

  const handleSubmit = () => {
    message.success('发票上传完成，进入OCR识别...')
    navigate('/employee/dashboard')
  }

  return (
    <Card title="上传发票">
      <Steps
        current={0}
        items={[
          { title: '上传发票' },
          { title: 'OCR识别' },
          { title: '提交报销' }
        ]}
      />

      <div style={{ marginTop: 32 }}>
        <InvoiceUploader onSuccess={() => {}} />
      </div>

      <div style={{ marginTop: 24 }}>
        <Button type="primary" onClick={handleSubmit}>
          提交报销
        </Button>
      </div>
    </Card>
  )
}

export default InvoiceUploadPage
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/routers/invoice.py backend/app/services/file_service.py
git add frontend/src/pages/InvoiceUploadPage.jsx frontend/src/components/InvoiceUploader.jsx
git commit -m "feat: 发票上传功能，支持图片和PDF"
```

---

### Task 5: 百度OCR API接入

**Files:**
- Create: `backend/app/services/ocr_service.py`
- Modify: `backend/app/routers/invoice.py` (添加OCR识别接口)
- Modify: `frontend/src/pages/InvoiceUploadPage.jsx` (添加识别结果展示)

- [ ] **Step 1: 创建OCR服务**

```python
# backend/app/services/ocr_service.py
import aiohttp
import base64
import json
from typing import Optional, Dict, Any
from app.config import settings

class OCRService:
    """百度OCR发票识别服务"""

    def __init__(self):
        self.access_token = None

    async def get_access_token(self) -> str:
        """获取百度API access_token"""
        if self.access_token:
            return self.access_token

        url = "https://aip.baidubce.com/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": settings.BAIDU_OCR_API_KEY,
            "client_secret": settings.BAIDU_OCR_SECRET_KEY
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as resp:
                result = await resp.json()
                self.access_token = result.get("access_token")
                return self.access_token

    async def recognize_invoice(self, image_path: str) -> Dict[str, Any]:
        """识别发票，返回结构化信息"""
        access_token = await self.get_access_token()

        # 读取图片并转为base64
        with open(image_path, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()

        # 调用百度OCR增值税发票识别
        url = f"https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice"
        params = {"access_token": access_token}
        data = {"image": image_base64}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, params=params, data=data) as resp:
                result = await resp.json()

        if "words_result" in result:
            words = result["words_result"]
            return {
                "success": True,
                "data": {
                    "invoice_code": words.get("InvoiceCode", ""),
                    "invoice_no": words.get("InvoiceNo", ""),
                    "invoice_date": words.get("InvoiceDate", ""),
                    "seller_name": words.get("SellerName", ""),
                    "buyer_name": words.get("BuyerName", ""),
                    "amount": words.get("TotalAmount", ""),
                    "tax_amount": words.get("TaxAmount", ""),
                    "ocr_confidence": result.get("words_result_num", 0) / 10
                }
            }
        else:
            return {
                "success": False,
                "error": result.get("error_msg", "识别失败")
            }

    async def recognize_invoice_by_url(self, image_url: str) -> Dict[str, Any]:
        """通过图片URL识别发票"""
        # 如果是本地文件路径，转换为绝对路径
        if image_url.startswith("/uploads/"):
            import os
            image_path = os.path.join("backend" if os.path.exists("backend") else ".", image_url.lstrip("/"))
            return await self.recognize_invoice(image_path)
        return {"success": False, "error": "不支持的图片地址"}

ocr_service = OCRService()
```

- [ ] **Step 2: 添加OCR识别API路由**

```python
# backend/app/routers/invoice.py (修改，添加新接口)
@router.post("/recognize/{invoice_id}")
async def recognize_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """对已上传的发票进行OCR识别"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票不存在")

    # 调用OCR服务
    result = await ocr_service.recognize_invoice_by_url(invoice.image_url)

    if result["success"]:
        # 更新发票记录
        invoice.invoice_code = result["data"].get("invoice_code")
        invoice.invoice_no = result["data"].get("invoice_no")
        invoice.invoice_date = result["data"].get("invoice_date")
        invoice.seller_name = result["data"].get("seller_name")
        invoice.buyer_name = result["data"].get("buyer_name")
        invoice.invoice_amount = result["data"].get("amount")
        invoice.ocr_confidence = result["data"].get("ocr_confidence")
        db.commit()

        return {"success": True, "data": result["data"]}
    else:
        return {"success": False, "error": result["error"]}
```

- [ ] **Step 3: 创建OCR结果展示组件**

```jsx
// frontend/src/components/OCRResultCard.jsx
import { Card, Descriptions, Tag } from 'antd'

function OCRResultCard({ ocrResult }) {
  if (!ocrResult) return null

  const isValid = ocrResult.confidence > 0.8

  return (
    <Card title="OCR识别结果" style={{ marginTop: 16 }}>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="发票代码">{ocrResult.invoice_code}</Descriptions.Item>
        <Descriptions.Item label="发票号码">{ocrResult.invoice_no}</Descriptions.Item>
        <Descriptions.Item label="开票日期">{ocrResult.invoice_date}</Descriptions.Item>
        <Descriptions.Item label="发票金额">
          <Tag color="blue">{ocrResult.amount}元</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="销售方">{ocrResult.seller_name}</Descriptions.Item>
        <Descriptions.Item label="购买方">{ocrResult.buyer_name}</Descriptions.Item>
        <Descriptions.Item label="识别置信度">
          <Tag color={isValid ? 'green' : 'orange'}>
            {(ocrResult.confidence * 100).toFixed(1)}%
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

export default OCRResultCard
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/ocr_service.py
git commit -m "feat: 集成百度OCR发票识别API"
```

---

## Phase 3: AI校验与审批流程（第5-7周）

### Task 6: 规则引擎校验服务

**Files:**
- Create: `backend/app/services/validation_service.py`
- Modify: `backend/app/routers/invoice.py`
- Create: `frontend/src/components/ValidationResult.jsx`

- [ ] **Step 1: 创建校验规则引擎**

```python
# backend/app/services/validation_service.py
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Invoice, Expense
from datetime import datetime, timedelta

class ValidationRule:
    """校验规则基类"""
    def __init__(self, code: str, name: str):
        self.code = code
        self.name = name

    def validate(self, invoice: Invoice, db: Session) -> Dict[str, Any]:
        raise NotImplementedError

class Invoice真实性校验(ValidationRule):
    """发票真实性校验"""
    def __init__(self):
        super().__init__("REALITY_CHECK", "发票真实性校验")

    def validate(self, invoice: Invoice, db: Session) -> Dict[str, Any]:
        # 简单的真实性校验：检查是否识别出了关键信息
        if not invoice.invoice_no or len(invoice.invoice_no) < 8:
            return {
                "passed": False,
                "level": "error",
                "message": "发票号码缺失或无效"
            }

        # 检查置信度
        if invoice.ocr_confidence and float(invoice.ocr_confidence) < 0.7:
            return {
                "passed": False,
                "level": "warning",
                "message": f"识别置信度较低({float(invoice.ocr_confidence)*100:.1f}%)，请人工复核"
            }

        return {"passed": True, "level": "info", "message": "真实性校验通过"}

class 重复报销校验(ValidationRule):
    """重复报销校验"""
    def __init__(self):
        super().__init__("DUPLICATE_CHECK", "重复报销校验")

    def validate(self, invoice: Invoice, db: Session) -> Dict[str, Any]:
        if not invoice.invoice_no:
            return {"passed": True, "level": "info", "message": "无发票号码，跳过重复校验"}

        # 查找同一发票号码的其他报销记录
        existing = db.query(Invoice).join(Expense).filter(
            Invoice.invoice_no == invoice.invoice_no,
            Invoice.id != invoice.id,
            Expense.status.in_(["approved", "paid"])
        ).first()

        if existing:
            return {
                "passed": False,
                "level": "error",
                "message": f"发现重复报销！该发票已于{existing.created_at}提交报销"
            }

        return {"passed": True, "level": "info", "message": "无重复报销记录"}

class 金额一致性校验(ValidationRule):
    """金额一致性校验"""
    def __init__(self):
        super().__init__("AMOUNT_CHECK", "金额一致性校验")

    def validate(self, invoice: Invoice, db: Session) -> Dict[str, Any]:
        expense = invoice.expense
        if not expense or not invoice.invoice_amount:
            return {"passed": True, "level": "info", "message": "信息不完整"}

        diff = abs(float(invoice.invoice_amount) - float(expense.amount))
        if diff > 0.01:
            return {
                "passed": False,
                "level": "warning",
                "message": f"发票金额({invoice.invoice_amount})与报销金额({expense.amount})不一致"
            }

        return {"passed": True, "level": "info", "message": "金额一致"}

class ValidationEngine:
    """校验引擎"""

    def __init__(self):
        self.rules: List[ValidationRule] = [
            Invoice真实性校验(),
            重复报销校验(),
            金额一致性校验(),
        ]

    def validate(self, invoice: Invoice, db: Session) -> Dict[str, Any]:
        results = []
        for rule in self.rules:
            result = rule.validate(invoice, db)
            results.append({
                "code": rule.code,
                "name": rule.name,
                **result
            })

        # 汇总结果
        has_error = any(r["level"] == "error" for r in results)
        has_warning = any(r["level"] == "warning" for r in results)

        if has_error:
            overall = "invalid"
        elif has_warning:
            overall = "warning"
        else:
            overall = "valid"

        return {
            "overall": overall,
            "details": results,
            "can_submit": not has_error
        }

validation_engine = ValidationEngine()
```

- [ ] **Step 2: 添加校验接口**

```python
# backend/app/routers/invoice.py (添加)
@router.post("/validate/{invoice_id}")
async def validate_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """对发票进行AI校验"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票不存在")

    result = validation_engine.validate(invoice, db)

    # 更新发票校验结果
    invoice.validation_result = result["overall"]
    invoice.validation_message = "; ".join([
        f"{r['name']}: {r['message']}" for r in result["details"]
    ])
    db.commit()

    return result
```

- [ ] **Step 3: 前端校验结果展示**

```jsx
// frontend/src/components/ValidationResult.jsx
import { Alert, List, Tag } from 'antd'

function ValidationResult({ validation }) {
  if (!validation) return null

  const statusMap = {
    valid: { color: 'success', text: '校验通过' },
    warning: { color: 'warning', text: '存在警告' },
    invalid: { color: 'error', text: '校验未通过' }
  }

  const status = statusMap[validation.overall] || statusMap.warning

  return (
    <Alert
      type={status.color}
      message={`AI校验结果: ${status.text}`}
      description={
        <List
          size="small"
          dataSource={validation.details}
          renderItem={item => (
            <List.Item>
              <Tag color={item.passed ? 'green' : item.level === 'warning' ? 'orange' : 'red'}>
                {item.name}
              </Tag>
              {item.message}
            </List.Item>
          )}
        />
      }
    />
  )
}

export default ValidationResult
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/validation_service.py
git commit -m "feat: 规则引擎校验服务 - 真实性、重复、金额校验"
```

---

### Task 7: 审批流程

**Files:**
- Create: `backend/app/services/approval_service.py`
- Create: `backend/app/routers/approval.py`
- Modify: `backend/app/routers/expense.py`
- Create: `frontend/src/pages/FinanceAuditPage.jsx`
- Create: `frontend/src/pages/ManagerApprovalPage.jsx`

- [ ] **Step 1: 创建审批服务**

```python
# backend/app/services/approval_service.py
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Expense, ExpenseStatus, ApprovalLog, User, UserRole
from datetime import datetime

class ApprovalService:
    """审批流程服务"""

    def can_approve(self, expense: Expense, user: User) -> bool:
        """检查用户是否有权限审批"""
        if expense.status == ExpenseStatus.PENDING_FINANCE:
            return user.role in [UserRole.FINANCE, UserRole.ADMIN]
        elif expense.status == ExpenseStatus.PENDING_MANAGER:
            return user.role in [UserRole.MANAGER, UserRole.ADMIN]
        return False

    def submit(self, expense_id: int, db: Session) -> Expense:
        """提交报销单"""
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise ValueError("报销单不存在")

        if expense.status != ExpenseStatus.DRAFT:
            raise ValueError("只有草稿状态可以提交")

        expense.status = ExpenseStatus.PENDING_FINANCE
        expense.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(expense)
        return expense

    def approve(self, expense_id: int, user_id: int, comment: str, db: Session) -> Expense:
        """审批通过"""
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        user = db.query(User).filter(User.id == user_id).first()

        if not self.can_approve(expense, user):
            raise PermissionError("无权审批此报销单")

        old_status = expense.status.value

        # 财务初审通过 -> 提交给主管
        if expense.status == ExpenseStatus.PENDING_FINANCE:
            expense.status = ExpenseStatus.PENDING_MANAGER
        # 主管审批通过 -> 完成
        elif expense.status == ExpenseStatus.PENDING_MANAGER:
            expense.status = ExpenseStatus.APPROVED

        # 记录审批日志
        log = ApprovalLog(
            expense_id=expense.id,
            approver_id=user.id,
            action="approve",
            comment=comment,
            from_status=old_status,
            to_status=expense.status.value
        )
        db.add(log)
        db.commit()
        db.refresh(expense)
        return expense

    def reject(self, expense_id: int, user_id: int, comment: str, db: Session) -> Expense:
        """驳回报销单"""
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        user = db.query(User).filter(User.id == user_id).first()

        if not self.can_approve(expense, user):
            raise PermissionError("无权审批此报销单")

        old_status = expense.status.value
        expense.status = ExpenseStatus.REJECTED

        log = ApprovalLog(
            expense_id=expense.id,
            approver_id=user.id,
            action="reject",
            comment=comment,
            from_status=old_status,
            to_status=expense.status.value
        )
        db.add(log)
        db.commit()
        db.refresh(expense)
        return expense

    def mark_paid(self, expense_id: int, db: Session) -> Expense:
        """标记已打款"""
        expense = db.query(Expense).filter(Expense.id == expense_id).first()

        if expense.status != ExpenseStatus.APPROVED:
            raise ValueError("只有审批通过的报销单才能标记打款")

        expense.status = ExpenseStatus.PAID
        db.commit()
        db.refresh(expense)
        return expense

approval_service = ApprovalService()
```

- [ ] **Step 2: 创建审批API路由**

```python
# backend/app/routers/approval.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.approval_service import approval_service
from app.models import Expense
from app.utils.security import get_current_user

router = APIRouter(prefix="/approval", tags=["审批"])

class ApprovalRequest(BaseModel):
    comment: str = ""

@router.post("/submit/{expense_id}")
def submit_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """提交报销单"""
    try:
        expense = approval_service.submit(expense_id, db)
        return {"success": True, "expense_id": expense.id, "status": expense.status.value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/approve/{expense_id}")
def approve_expense(
    expense_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """审批通过"""
    try:
        expense = approval_service.approve(expense_id, current_user.id, req.comment, db)
        return {"success": True, "status": expense.status.value}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/reject/{expense_id}")
def reject_expense(
    expense_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """驳回报销单"""
    try:
        expense = approval_service.reject(expense_id, current_user.id, req.comment, db)
        return {"success": True, "status": expense.status.value}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/mark-paid/{expense_id}")
def mark_paid(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记已打款"""
    try:
        expense = approval_service.mark_paid(expense_id, db)
        return {"success": True, "status": expense.status.value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 3: 创建财务审核页面**

```jsx
// frontend/src/pages/FinanceAuditPage.jsx
import { Table, Button, Modal, Input, message, Tag } from 'antd'
import { useState, useEffect } from 'react'
import api from '../api'
import ValidationResult from '../components/ValidationResult'

const { TextArea } = Input

function FinanceAuditPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const result = await api.getExpenseList('finance')
    setData(result.data || [])
    setLoading(false)
  }

  const handleApprove = async () => {
    await api.approveExpense(selectedRecord.id, { comment })
    message.success('审核通过')
    setSelectedRecord(null)
    loadData()
  }

  const handleReject = async () => {
    await api.rejectExpense(selectedRecord.id, { comment })
    message.success('已驳回')
    setSelectedRecord(null)
    loadData()
  }

  const columns = [
    { title: '报销单号', dataIndex: 'expense_no' },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v}` },
    { title: '类别', dataIndex: 'category' },
    { title: '状态', dataIndex: 'status', render: s => <Tag>{s}</Tag> },
    {
      title: '操作',
      render: (_, record) => (
        <Button onClick={() => setSelectedRecord(record)}>审核</Button>
      )
    }
  ]

  return (
    <div>
      <Table columns={columns} dataSource={data} loading={loading} rowKey="id" />

      <Modal
        open={!!selectedRecord}
        onCancel={() => setSelectedRecord(null)}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <>
            <h3>报销单详情</h3>
            <p>金额: ¥{selectedRecord.amount}</p>
            <ValidationResult validation={selectedRecord.validation} />

            <TextArea
              placeholder="审核意见（可选）"
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{ marginTop: 16 }}
            />

            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleApprove}>审核通过</Button>
              <Button danger onClick={handleReject} style={{ marginLeft: 8 }}>驳回</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default FinanceAuditPage
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/approval_service.py backend/app/routers/approval.py
git add frontend/src/pages/FinanceAuditPage.jsx
git commit -m "feat: 审批流程 - 提交、审核、驳回"
```

---

## Phase 4: 流程监控与优化（第8-10周）

### Task 8: 流程状态可视化

**Files:**
- Create: `frontend/src/components/ExpenseStatusTimeline.jsx`
- Modify: `frontend/src/pages/EmployeeDashboard.jsx`
- Modify: `frontend/src/pages/FinanceDashboard.jsx`

- [ ] **Step 1: 创建状态时间线组件**

```jsx
// frontend/src/components/ExpenseStatusTimeline.jsx
import { Steps, Tag } from 'antd'

const statusSteps = [
  { status: 'draft', title: '草稿' },
  { status: 'pending_finance', title: '待财务初审' },
  { status: 'pending_manager', title: '待主管审批' },
  { status: 'approved', title: '审批通过' },
  { status: 'paid', title: '已打款' }
]

function ExpenseStatusTimeline({ currentStatus }) {
  const currentIndex = statusSteps.findIndex(s => s.status === currentStatus)

  return (
    <Steps
      current={currentIndex >= 0 ? currentIndex : 0}
      items={statusSteps.map(step => ({
        title: step.title
      }))}
    />
  )
}

export default ExpenseStatusTimeline
```

- [ ] **Step 2: 创建员工仪表盘**

```jsx
// frontend/src/pages/EmployeeDashboard.jsx
import { Card, Table, Button, Tag, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useState, useEffect } from 'react'
import ExpenseStatusTimeline from '../components/ExpenseStatusTimeline'

function EmployeeDashboard() {
  const [expenses, setExpenses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadMyExpenses()
  }, [])

  const loadMyExpenses = async () => {
    const result = await api.getExpenseList('employee')
    setExpenses(result.data || [])
  }

  const columns = [
    { title: '报销单号', dataIndex: 'expense_no' },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v}` },
    { title: '类别', dataIndex: 'category' },
    {
      title: '状态',
      render: (_, record) => <ExpenseStatusTimeline currentStatus={record.status} compact />
    },
    {
      title: '操作',
      render: (_, record) => (
        <Button size="small" onClick={() => navigate(`/expense/${record.id}`)}>
          查看详情
        </Button>
      )
    }
  ]

  return (
    <Card
      title="我的报销"
      extra={<Button type="primary" onClick={() => navigate('/employee/create')}>新建报销</Button>}
    >
      <Table columns={columns} dataSource={expenses} rowKey="id" />
    </Card>
  )
}

export default EmployeeDashboard
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ExpenseStatusTimeline.jsx frontend/src/pages/EmployeeDashboard.jsx
git commit -m "feat: 员工仪表盘和流程状态可视化"
```

---

### Task 9: 认证与权限

**Files:**
- Create: `backend/app/utils/security.py`
- Create: `backend/app/routers/auth.py`
- Modify: `frontend/src/pages/LoginPage.jsx`
- Modify: `backend/app/routers/invoice.py` (添加认证依赖)

- [ ] **Step 1: 创建JWT认证工具**

```python
# backend/app/utils/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token无效或已过期")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="无效的认证信息")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user
```

- [ ] **Step 2: 创建登录路由**

```python
# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User
from app.utils.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["认证"])

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "department": user.department
        }
    }
```

- [ ] **Step 3: 创建登录页面**

```jsx
// frontend/src/pages/LoginPage.jsx
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function LoginPage() {
  const navigate = useNavigate()

  const onFinish = async (values) => {
    try {
      const result = await api.login(values.username, values.password)
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('user', JSON.stringify(result.user))
      message.success('登录成功')

      // 根据角色跳转
      if (result.user.role === 'finance') {
        navigate('/finance')
      } else if (result.user.role === 'manager') {
        navigate('/manager')
      } else {
        navigate('/employee')
      }
    } catch (e) {
      message.error('登录失败: ' + (e.detail || '未知错误'))
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card title="企业财务报销系统" style={{ width: 400 }}>
        <Form onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/utils/security.py backend/app/routers/auth.py
git add frontend/src/pages/LoginPage.jsx
git commit -m "feat: JWT认证和登录页面"
```

---

## Phase 5: 部署与验收（第11周）

### Task 10: 项目打包与部署准备

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `README.md`

- [ ] **Step 1: 创建Docker配置**

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: expense_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/expense_db
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

- [ ] **Step 2: 创建README**

```markdown
# 企业财务智能报销与审核编排系统

## 快速启动

### 前置要求
- Docker 和 Docker Compose
- 百度OCR API Key（可选）

### 启动步骤

1. 克隆代码
2. 复制环境变量文件
   cp backend/.env.example backend/.env
   # 编辑 .env 填入百度OCR密钥

3. 启动服务
   docker-compose up -d

4. 初始化数据库
   docker-compose exec backend python -c "from app.init_db import init_db; init_db()"

5. 访问系统
   - 前端: http://localhost:3000
   - 后端API: http://localhost:8000

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 财务 | finance | finance123 |
| 员工 | employee | employee123 |

## 功能模块

- [ ] 发票上传（支持图片、PDF）
- [ ] OCR发票识别
- [ ] AI规则校验
- [ ] 多级审批流程
- [ ] 流程状态可视化
- [ ] 移动端适配
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml README.md
git commit -m "chore: Docker部署配置"
```

---

## 技术栈汇总

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + Vite | 现代化前端开发 |
| UI组件库 | Ant Design 5 | 企业级UI |
| 后端框架 | FastAPI | 高性能Python web框架 |
| 数据库 | PostgreSQL | 关系型数据库 |
| ORM | SQLAlchemy 2.0 | Python ORM |
| 认证 | JWT | 无状态认证 |
| OCR | 百度OCR API | 发票识别 |
| 部署 | Docker Compose | 容器化部署 |

---

## 开发分工建议（3人）

| 开发者 | 主要职责 | 任务 |
|--------|----------|------|
| 后端 | FastAPI开发、数据库、OCR集成 | Task 1, 3, 5, 6, 9 |
| 前端 | React开发、页面组件 | Task 2, 4, 7, 8 |
| 全栈 | API对接、流程、审批 | Task 4, 6, 7, 8, 10 |

---

## Self-Review 检查清单

- [ ] 所有Task都有具体的代码示例
- [ ] 文件路径都是准确的
- [ ] API路由和方法签名一致
- [ ] 没有"TODO"或"TBD"占位符
- [ ] 前端组件和后端API对应
