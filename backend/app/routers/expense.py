from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Invoice, Expense, ExpenseStatus, ApprovalLog, User, UserRole, Notification, Budget
from app.schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ApprovalRequest
from app.utils.security import get_current_user
import uuid
import json
from datetime import datetime, date

router = APIRouter(prefix="/expense", tags=["报销"])


def _create_notification(db: Session, user_id: int, title: str, content: str, expense_id: int = None):
    n = Notification(user_id=user_id, title=title, content=content, expense_id=expense_id)
    db.add(n)


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
        expense_date=datetime.strptime(data.expense_date, "%Y-%m-%d").date() if data.expense_date else None,
        payment_method=data.payment_method,
        status=ExpenseStatus.DRAFT
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"id": expense.id, "expense_no": expense.expense_no}


@router.put("/update/{expense_id}")
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if expense.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能编辑自己的报销单")
    if expense.status not in [ExpenseStatus.DRAFT, ExpenseStatus.RETURNED]:
        raise HTTPException(status_code=400, detail="只有草稿或退回状态可编辑")

    if data.amount is not None:
        expense.amount = data.amount
    if data.category is not None:
        expense.category = data.category
    if data.description is not None:
        expense.description = data.description
    if data.expense_date is not None:
        expense.expense_date = datetime.strptime(data.expense_date, "%Y-%m-%d").date() if data.expense_date else None
    if data.payment_method is not None:
        expense.payment_method = data.payment_method
    db.commit()
    return {"success": True}


@router.delete("/delete/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if expense.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能删除自己的报销单")
    expense.is_deleted = 1
    db.commit()
    return {"success": True}


@router.get("/trash/list")
def list_trash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.is_deleted == 1)
    if current_user.role == UserRole.EMPLOYEE:
        query = query.filter(Expense.employee_id == current_user.id)
    expenses = query.all()
    return [{
        "id": e.id, "expense_no": e.expense_no, "amount": float(e.amount),
        "category": e.category, "status": e.status.value,
        "employee_name": e.employee.full_name if e.employee else "",
        "department": e.employee.department if e.employee else "",
        "expense_date": e.expense_date.isoformat() if e.expense_date else None,
        "payment_method": e.payment_method,
    } for e in expenses]


@router.post("/trash/restore/{expense_id}")
def restore_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if expense.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能恢复自己的报销单")
    expense.is_deleted = 0
    db.commit()
    return {"success": True}


@router.delete("/trash/permanent-all")
def permanent_delete_all_trash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.EMPLOYEE:
        items = db.query(Expense).filter(Expense.employee_id == current_user.id, Expense.is_deleted == 1).all()
    else:
        items = db.query(Expense).filter(Expense.is_deleted == 1).all()
    count = 0
    for expense in items:
        for inv in db.query(Invoice).filter(Invoice.expense_id == expense.id).all():
            db.delete(inv)
        for log in db.query(ApprovalLog).filter(ApprovalLog.expense_id == expense.id).all():
            db.delete(log)
        db.delete(expense)
        count += 1
    db.commit()
    return {"success": True, "deleted_count": count}


@router.delete("/trash/permanent/{expense_id}")
def permanent_delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if expense.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="只能删除自己的报销单")
    if expense.is_deleted != 1:
        raise HTTPException(status_code=400, detail="请先从列表移到回收站")
    for inv in db.query(Invoice).filter(Invoice.expense_id == expense_id).all():
        db.delete(inv)
    for log in db.query(ApprovalLog).filter(ApprovalLog.expense_id == expense_id).all():
        db.delete(log)
    db.delete(expense)
    db.commit()
    return {"success": True}


@router.get("/list")
def list_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.EMPLOYEE:
        expenses = db.query(Expense).filter(Expense.employee_id == current_user.id, Expense.is_deleted == 0).all()
    else:
        expenses = db.query(Expense).filter(Expense.is_deleted == 0).all()
    return [{
        "id": e.id, "expense_no": e.expense_no, "amount": float(e.amount),
        "category": e.category, "status": e.status.value,
        "employee_name": e.employee.full_name if e.employee else "",
        "department": e.employee.department if e.employee else "",
        "expense_date": e.expense_date.isoformat() if e.expense_date else None,
        "payment_method": e.payment_method,
        "paid_at": e.paid_at.isoformat() if e.paid_at else None
    } for e in expenses]


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
        "description": expense.description,
        "expense_date": expense.expense_date.isoformat() if expense.expense_date else None,
        "payment_method": expense.payment_method,
        "paid_at": expense.paid_at.isoformat() if expense.paid_at else None,
        "employee_name": expense.employee.full_name if expense.employee else "",
        "department": expense.employee.department if expense.employee else ""
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
    if expense.status not in [ExpenseStatus.DRAFT, ExpenseStatus.RETURNED]:
        raise HTTPException(status_code=400, detail="只有草稿或退回状态可提交")

    invoices = db.query(Invoice).filter(Invoice.expense_id == expense_id).all()
    if not invoices:
        raise HTTPException(status_code=400, detail="请先上传发票再提交")

    from datetime import datetime
    expense.status = ExpenseStatus.PENDING_FINANCE
    expense.submitted_at = datetime.utcnow()

    finance_users = db.query(User).filter(User.role == UserRole.FINANCE).all()
    for fu in finance_users:
        _create_notification(db, fu.id,
            "新报销单待审核",
            f"{current_user.full_name}提交了报销单{expense.expense_no}，金额¥{float(expense.amount):.2f}",
            expense.id)

    budget = db.query(Budget).filter(
        Budget.department == current_user.department,
        Budget.fiscal_year == datetime.now().year
    ).first()
    if budget:
        budget.used_amount = float(budget.used_amount or 0) + float(expense.amount)

    db.commit()
    return {"success": True, "status": expense.status.value}


@router.get("/{expense_id}/detail")
def get_expense_detail(expense_id: int, db: Session = Depends(get_db)):
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
        "expense_date": expense.expense_date.isoformat() if expense.expense_date else None,
        "payment_method": expense.payment_method,
        "submitted_at": expense.submitted_at.isoformat() if expense.submitted_at else None,
        "paid_at": expense.paid_at.isoformat() if expense.paid_at else None,
        "employee_name": expense.employee.full_name if expense.employee else "",
        "department": expense.employee.department if expense.employee else "",
        "invoices": [{
            "id": inv.id,
            "invoice_no": inv.invoice_no,
            "invoice_amount": float(inv.invoice_amount) if inv.invoice_amount else 0,
            "seller_name": inv.seller_name,
            "image_url": inv.image_url,
            "validation_result": inv.validation_result,
            "validation_message": inv.validation_message,
            "validation_details": json.loads(inv.validation_details) if inv.validation_details else None
        } for inv in invoices]
    }