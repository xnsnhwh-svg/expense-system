from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Invoice, Expense, ExpenseStatus, User, UserRole
from app.schemas import ExpenseCreate, ExpenseResponse, ApprovalRequest
from app.utils.security import get_current_user
import uuid

router = APIRouter(prefix="/expense", tags=["报销"])

@router.post("/create")
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = Expense(
        expense_no=f"EXP-{uuid.uuid4().hex[:8].upper()}",
        employee_id=current_user.id,
        amount=data.amount,
        category=data.category,
        description=data.description,
        status=ExpenseStatus.DRAFT
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"id": expense.id, "expense_no": expense.expense_no}

@router.get("/list")
def list_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.EMPLOYEE:
        expenses = db.query(Expense).filter(Expense.employee_id == current_user.id).all()
    else:
        expenses = db.query(Expense).all()
    return [{"id": e.id, "expense_no": e.expense_no, "amount": float(e.amount),
             "category": e.category, "status": e.status.value} for e in expenses]

@router.get("/{expense_id}")
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    return {
        "id": expense.id,
        "expense_no": expense.expense_no,
        "amount": float(expense.amount),
        "category": expense.category,
        "status": expense.status.value,
        "description": expense.description
    }

@router.post("/submit/{expense_id}")
def submit_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if expense.status != ExpenseStatus.DRAFT:
        raise HTTPException(status_code=400, detail="只有草稿状态可以提交")

    from datetime import datetime
    expense.status = ExpenseStatus.PENDING_FINANCE
    expense.submitted_at = datetime.utcnow()
    db.commit()
    return {"success": True, "status": expense.status.value}

@router.get("/{expense_id}/detail")
def get_expense_detail(expense_id: int, db: Session = Depends(get_db)):
    """获取报销单详情（含发票列表）"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")

    invoices = db.query(Invoice).filter(Invoice.expense_id == expense_id).all()

    return {
        "id": expense.id,
        "expense_no": expense.expense_no,
        "amount": float(expense.amount),
        "category": expense.category,
        "status": expense.status.value,
        "description": expense.description,
        "submitted_at": expense.submitted_at.isoformat() if expense.submitted_at else None,
        "invoices": [{
            "id": inv.id,
            "invoice_no": inv.invoice_no,
            "invoice_amount": float(inv.invoice_amount) if inv.invoice_amount else 0,
            "seller_name": inv.seller_name,
            "image_url": inv.image_url,
            "validation_result": inv.validation_result
        } for inv in invoices]
    }