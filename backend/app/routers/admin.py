from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    User, UserRole, Expense, ExpenseStatus, Invoice,
    ExpenseCategory, SystemConfig, ApprovalLog
)
from app.schemas import CategoryCreate, ConfigUpdate
from app.utils.security import get_current_user, get_password_hash
from datetime import datetime
import csv
import io

router = APIRouter(prefix="/admin", tags=["管理后台"])


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return current_user


def require_reports_access(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="无权访问报表")
    return current_user


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    users = db.query(User).all()
    return [{
        "id": u.id, "username": u.username, "full_name": u.full_name,
        "email": u.email, "role": u.role.value, "department": u.department,
        "is_active": u.is_active
    } for u in users]


@router.post("/users")
def create_user(
    username: str, full_name: str, password: str,
    role: str = "employee", department: str = "", email: str = "",
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")

    try:
        user_role = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的角色")

    user = User(
        username=username, full_name=full_name,
        hashed_password=get_password_hash(password),
        role=user_role, department=department, email=email
    )
    db.add(user)
    db.commit()
    return {"id": user.id, "success": True}


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    full_name: str = None, role: str = None, department: str = None,
    email: str = None, is_active: int = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if full_name is not None:
        user.full_name = full_name
    if role is not None:
        try:
            user.role = UserRole(role)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的角色")
    if department is not None:
        user.department = department
    if email is not None:
        user.email = email
    if is_active is not None:
        user.is_active = is_active
    db.commit()
    return {"success": True}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    db.delete(user)
    db.commit()
    return {"success": True}


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(ExpenseCategory).all()
    return [{"id": c.id, "name": c.name, "code": c.code, "description": c.description, "is_active": c.is_active} for c in cats]


@router.post("/categories")
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    cat = ExpenseCategory(name=data.name, code=data.code, description=data.description)
    db.add(cat)
    db.commit()
    return {"id": cat.id, "success": True}


@router.put("/categories/{cat_id}")
def update_category(
    cat_id: int,
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="类别不存在")
    cat.name = data.name
    cat.code = data.code
    cat.description = data.description
    db.commit()
    return {"success": True}


@router.delete("/categories/{cat_id}")
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == cat_id).first()
    if cat:
        db.delete(cat)
        db.commit()
    return {"success": True}


@router.get("/config")
def list_configs(db: Session = Depends(get_db)):
    configs = db.query(SystemConfig).all()
    return {c.key: c.value for c in configs}


@router.post("/config/{key}")
def set_config(
    key: str, data: ConfigUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if config:
        config.value = data.value
    else:
        config = SystemConfig(key=key, value=data.value)
        db.add(config)
    db.commit()
    return {"success": True}


@router.get("/reports/summary")
def get_summary(
    department: str = None,
    category: str = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_reports_access)
):
    q = db.query(Expense)
    if department:
        q = q.join(User, Expense.employee_id == User.id).filter(User.department == department)
    if category:
        q = q.filter(Expense.category == category)
    if start_date:
        q = q.filter(Expense.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        q = q.filter(Expense.created_at <= datetime.fromisoformat(end_date))

    total_count = q.count()
    total_amount = db.query(func.sum(Expense.amount)).select_from(q.subquery()).scalar() or 0

    by_status = {}
    for status in ExpenseStatus:
        count = q.filter(Expense.status == status).count()
        if count > 0:
            amt = db.query(func.sum(Expense.amount)).filter(Expense.status == status).scalar() or 0
            by_status[status.value] = {"count": count, "amount": float(amt)}

    by_category = db.query(
        Expense.category, func.count(Expense.id), func.sum(Expense.amount)
    ).group_by(Expense.category).all()

    by_department = db.query(
        User.department, func.count(Expense.id), func.sum(Expense.amount)
    ).join(User, Expense.employee_id == User.id).group_by(User.department).all()

    return {
        "total_count": total_count,
        "total_amount": float(total_amount),
        "by_status": by_status,
        "by_category": [{"category": c, "count": n, "amount": float(a)} for c, n, a in by_category],
        "by_department": [{"department": d, "count": n, "amount": float(a)} for d, n, a in by_department if d]
    }


@router.get("/reports/monthly")
def get_monthly_report(
    year: int = None,
    db: Session = Depends(get_db),
    _=Depends(require_reports_access)
):
    if not year:
        year = datetime.now().year

    monthly = []
    for month in range(1, 13):
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, month + 1, 1)

        q = db.query(func.count(Expense.id), func.sum(Expense.amount)).filter(
            Expense.created_at >= start, Expense.created_at < end
        )
        count, amount = q.first()
        monthly.append({
            "month": month,
            "count": count or 0,
            "amount": float(amount or 0)
        })

    return {"year": year, "monthly": monthly}


@router.get("/audit-logs")
def get_audit_logs(
    expense_id: int = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(ApprovalLog)
    if expense_id:
        q = q.filter(ApprovalLog.expense_id == expense_id)
    logs = q.order_by(ApprovalLog.id.desc()).limit(limit).all()
    return [{
        "id": l.id, "expense_id": l.expense_id,
        "action": l.action, "comment": l.comment,
        "approver_id": l.approver_id,
        "from_status": l.from_status, "to_status": l.to_status,
        "created_at": l.created_at.isoformat() if l.created_at else None
    } for l in logs]


@router.get("/reports/export")
def export_expenses(
    db: Session = Depends(get_db),
    _=Depends(require_reports_access)
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["报销单号", "金额", "类别", "状态", "申请人", "部门", "创建时间", "事由", "打款时间"])

    expenses = db.query(Expense).order_by(Expense.created_at.desc()).all()
    for e in expenses:
        writer.writerow([
            e.expense_no, float(e.amount), e.category, e.status.value,
            e.employee.full_name if e.employee else "",
            e.employee.department if e.employee else "",
            e.created_at.isoformat() if e.created_at else "",
            e.description or "",
            e.paid_at.isoformat() if e.paid_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=expenses_{datetime.now().strftime('%Y%m%d')}.csv"}
    )