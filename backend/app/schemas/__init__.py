from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    expense_no: str
    amount: float
    category: str
    status: str
    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    comment: str = ""