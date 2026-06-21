from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, expense, approval
from app.routers.invoice import router as invoice_router
from app.routers.admin import router as admin_router
from app.routers.notification import router as notification_router
from app.routers.budget import router as budget_router
from app.routers.standard import router as standard_router
from app.routers.payment import router as payment_router
from app.routers.chat import router as chat_router
from app.database import engine, Base, SessionLocal
from app.models import *
from app.utils.security import get_password_hash
import os

app = FastAPI(title="企业财务智能报销系统", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(User).count() == 0:
        users = [
            User(username="admin", full_name="系统管理员", role=UserRole.ADMIN, department="IT", hashed_password=get_password_hash("123456")),
            User(username="finance", full_name="财务人员", role=UserRole.FINANCE, department="财务部", hashed_password=get_password_hash("123456")),
            User(username="employee", full_name="测试员工", role=UserRole.EMPLOYEE, department="研发部", hashed_password=get_password_hash("123456")),
            User(username="manager", full_name="主管", role=UserRole.MANAGER, department="管理部", hashed_password=get_password_hash("123456")),
        ]
        db.add_all(users)
        db.commit()
    db.close()

app.include_router(auth.router)
app.include_router(expense.router)
app.include_router(approval.router)
app.include_router(invoice_router)
app.include_router(admin_router)
app.include_router(notification_router)
app.include_router(budget_router)
app.include_router(standard_router)
app.include_router(payment_router)
app.include_router(chat_router)


@app.get("/")
def root():
    return {"message": "企业财务智能报销系统 API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
