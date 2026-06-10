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
    expense_date: Optional[str] = None
    payment_method: Optional[str] = None


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    expense_date: Optional[str] = None
    payment_method: Optional[str] = None


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


class BatchApprovalRequest(BaseModel):
    expense_ids: list[int]
    comment: str = ""


class BatchRejectRequest(BaseModel):
    expense_ids: list[int]
    comment: str = ""


class BudgetCreate(BaseModel):
    department: str
    fiscal_year: int
    category: str = ""
    budget_amount: float
    warning_threshold: float = 0.8


class StandardCreate(BaseModel):
    role: str = ""
    category: str
    max_amount: Optional[float] = None
    per_day_limit: Optional[float] = None
    description: str = ""


class CategoryCreate(BaseModel):
    name: str
    code: str = ""
    description: str = ""


class ApprovalChainCreate(BaseModel):
    name: str
    department: str = ""
    category: str = ""
    min_amount: float = 0
    max_amount: float = 99999999
    finance_required: bool = True
    manager_required: bool = False
    admin_required: bool = False


class ConfigUpdate(BaseModel):
    value: str