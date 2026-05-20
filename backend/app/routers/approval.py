from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Expense, ExpenseStatus, ApprovalLog, User, UserRole
from app.schemas import ApprovalRequest
from app.utils.security import get_current_user

router = APIRouter(prefix="/approval", tags=["审批"])

def can_approve(expense: Expense, user: User) -> bool:
    if expense.status == ExpenseStatus.PENDING_FINANCE:
        return user.role in [UserRole.FINANCE, UserRole.ADMIN]
    if expense.status == ExpenseStatus.PENDING_MANAGER:
        return user.role in [UserRole.MANAGER, UserRole.ADMIN]
    return False

@router.post("/approve/{expense_id}")
def approve_expense(
    expense_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not can_approve(expense, current_user):
        raise HTTPException(status_code=403, detail="无权审批")

    old_status = expense.status.value
    if expense.status == ExpenseStatus.PENDING_FINANCE:
        expense.status = ExpenseStatus.PENDING_MANAGER
    elif expense.status == ExpenseStatus.PENDING_MANAGER:
        expense.status = ExpenseStatus.APPROVED

    log = ApprovalLog(
        expense_id=expense.id,
        approver_id=current_user.id,
        action="approve",
        comment=req.comment,
        from_status=old_status,
        to_status=expense.status.value
    )
    db.add(log)
    db.commit()
    return {"success": True, "status": expense.status.value}

@router.post("/reject/{expense_id}")
def reject_expense(
    expense_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not can_approve(expense, current_user):
        raise HTTPException(status_code=403, detail="无权审批")

    old_status = expense.status.value
    expense.status = ExpenseStatus.REJECTED

    log = ApprovalLog(
        expense_id=expense.id,
        approver_id=current_user.id,
        action="reject",
        comment=req.comment,
        from_status=old_status,
        to_status=expense.status.value
    )
    db.add(log)
    db.commit()
    return {"success": True, "status": expense.status.value}