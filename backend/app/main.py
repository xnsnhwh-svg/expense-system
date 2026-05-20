from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, expense, approval
from app.routers.invoice import router as invoice_router

app = FastAPI(title="企业财务智能报销系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expense.router)
app.include_router(approval.router)
app.include_router(invoice_router)

@app.get("/")
def root():
    return {"message": "企业财务智能报销系统 API"}

@app.get("/health")
def health():
    return {"status": "healthy"}