from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Expense, ExpenseStatus, ApprovalLog, User, UserRole, Notification, ApprovalChain
from app.schemas import ApprovalRequest, BatchApprovalRequest, BatchRejectRequest
from app.utils.security import get_current_user
from datetime import datetime

router = APIRouter(prefix="/approval", tags=["审批"])


def _notify(db: Session, user_id: int, title: str, content: str, expense_id: int = None):
    db.add(Notification(user_id=user_id, title=title, content=content, expense_id=expense_id))


def can_approve(expense: Expense, user: User) -> bool:
    if expense.status == ExpenseStatus.PENDING_FINANCE:
        return user.role in [UserRole.FINANCE, UserRole.ADMIN]
    if expense.status == ExpenseStatus.PENDING_MANAGER:
        return user.role in [UserRole.MANAGER, UserRole.ADMIN]
    return False


def _get_next_status(expense: Expense, db: Session) -> ExpenseStatus:
    if expense.status == ExpenseStatus.PENDING_FINANCE:
        return ExpenseStatus.PENDING_MANAGER
    return ExpenseStatus.APPROVED


def _get_approver_name(role: str) -> str:
    return {"dept": "部门负责人", "finance": "财务", "manager": "终审"}.get(role, role)


@router.post("/approve/{expense_id}")
def approve_expense(
    expense_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if not can_approve(expense, current_user):
        raise HTTPException(status_code=403, detail="无权审批")

    old_status = expense.status.value
    expense.status = _get_next_status(expense, db)

    log = ApprovalLog(
        expense_id=expense.id, approver_id=current_user.id,
        action="approve", comment=req.comment,
        from_status=old_status, to_status=expense.status.value
    )
    db.add(log)

    stage_names = {
        "pending_finance": "财务审核",
        "pending_manager": "终审"
    }
    stage = stage_names.get(old_status, "审核")
    _notify(db, expense.employee_id,
        f"报销单{expense.expense_no}{stage}通过",
        f"{stage}已通过，金额¥{float(expense.amount):.2f}",
        expense.id)

    if expense.status == ExpenseStatus.PENDING_MANAGER:
        manager_users = db.query(User).filter(User.role == UserRole.MANAGER).all()
        for mu in manager_users:
            _notify(db, mu.id,
                "报销单待终审",
                f"{expense.employee.full_name}的报销单{expense.expense_no}通过财务审核，待终审",
                expense.id)

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
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if not can_approve(expense, current_user):
        raise HTTPException(status_code=403, detail="无权审批")

    old_status = expense.status.value
    expense.status = ExpenseStatus.RETURNED

    log = ApprovalLog(
        expense_id=expense.id, approver_id=current_user.id,
        action="return", comment=req.comment,
        from_status=old_status, to_status=expense.status.value
    )
    db.add(log)

    _notify(db, expense.employee_id,
        f"报销单{expense.expense_no}被退回",
        f"原因：{req.comment or '无'}，请修改后重新提交",
        expense.id)

    db.commit()
    return {"success": True, "status": expense.status.value}


@router.post("/batch-approve")
def batch_approve(
    req: BatchApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = []
    for eid in req.expense_ids:
        expense = db.query(Expense).filter(Expense.id == eid).first()
        if expense and can_approve(expense, current_user):
            old_status = expense.status.value
            expense.status = _get_next_status(expense, db)
            log = ApprovalLog(
                expense_id=expense.id, approver_id=current_user.id,
                action="approve", comment=req.comment,
                from_status=old_status, to_status=expense.status.value
            )
            db.add(log)
            results.append({"id": eid, "success": True})
        else:
            results.append({"id": eid, "success": False, "error": "无权操作"})
    db.commit()
    return {"results": results}


@router.post("/batch-reject")
def batch_reject(
    req: BatchRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = []
    for eid in req.expense_ids:
        expense = db.query(Expense).filter(Expense.id == eid).first()
        if expense and can_approve(expense, current_user):
            old_status = expense.status.value
            expense.status = ExpenseStatus.RETURNED
            log = ApprovalLog(
                expense_id=expense.id, approver_id=current_user.id,
                action="return", comment=req.comment,
                from_status=old_status, to_status=expense.status.value
            )
            db.add(log)
            results.append({"id": eid, "success": True})
        else:
            results.append({"id": eid, "success": False, "error": "无权操作"})
    db.commit()
    return {"results": results}


@router.post("/pay/{expense_id}")
def mark_as_paid(
    expense_id: int,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if current_user.role not in [UserRole.FINANCE, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="只有财务或管理员可以打款")
    if expense.status != ExpenseStatus.APPROVED:
        raise HTTPException(status_code=400, detail="只有已审批通过的报销单可以打款")

    expense.status = ExpenseStatus.PAID
    expense.paid_at = datetime.utcnow()

    log = ApprovalLog(
        expense_id=expense.id, approver_id=current_user.id,
        action="paid", comment=req.comment or "已打款",
        from_status=ExpenseStatus.APPROVED.value,
        to_status=ExpenseStatus.PAID.value
    )
    db.add(log)

    _notify(db, expense.employee_id,
        f"报销单{expense.expense_no}已打款",
        f"你的报销已打款完成，金额¥{float(expense.amount):.2f}",
        expense.id)

    db.commit()
    return {"success": True, "status": expense.status.value, "paid_at": expense.paid_at.isoformat()}
