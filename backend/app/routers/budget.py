from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Budget, User, UserRole
from app.schemas import BudgetCreate
from app.utils.security import get_current_user

router = APIRouter(prefix="/budget", tags=["预算管理"])


@router.get("/list")
def list_budgets(
    department: str = None, fiscal_year: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Budget)
    if department:
        q = q.filter(Budget.department == department)
    if fiscal_year:
        q = q.filter(Budget.fiscal_year == fiscal_year)
    else:
        from datetime import datetime
        q = q.filter(Budget.fiscal_year == datetime.now().year)
    budgets = q.all()
    return [{
        "id": b.id, "department": b.department, "fiscal_year": b.fiscal_year,
        "category": b.category, "budget_amount": float(b.budget_amount),
        "used_amount": float(b.used_amount),
        "remaining": float(b.budget_amount) - float(b.used_amount),
        "usage_rate": float(b.used_amount) / float(b.budget_amount) if float(b.budget_amount) > 0 else 0,
        "warning_threshold": float(b.warning_threshold)
    } for b in budgets]


@router.post("/create")
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")

    budget = Budget(
        department=data.department, fiscal_year=data.fiscal_year,
        category=data.category, budget_amount=data.budget_amount,
        warning_threshold=data.warning_threshold
    )
    db.add(budget)
    db.commit()
    return {"id": budget.id, "success": True}


@router.put("/{budget_id}")
def update_budget(
    budget_id: int, data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="预算不存在")
    budget.budget_amount = data.budget_amount
    budget.warning_threshold = data.warning_threshold
    db.commit()
    return {"success": True}


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget:
        db.delete(budget)
        db.commit()
    return {"success": True}