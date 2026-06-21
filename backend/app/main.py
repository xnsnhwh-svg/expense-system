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
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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
