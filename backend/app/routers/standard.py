from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ExpenseStandard, User, UserRole, ApprovalChain
from app.schemas import StandardCreate, ApprovalChainCreate
from app.utils.security import get_current_user

router = APIRouter(tags=["标准与审批链"])


@router.get("/standard/list")
def list_standards(db: Session = Depends(get_db)):
    standards = db.query(ExpenseStandard).all()
    return [{
        "id": s.id, "role": s.role, "category": s.category,
        "max_amount": float(s.max_amount) if s.max_amount else None,
        "per_day_limit": float(s.per_day_limit) if s.per_day_limit else None,
        "description": s.description
    } for s in standards]


@router.post("/standard/create")
def create_standard(
    data: StandardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")
    std = ExpenseStandard(
        role=data.role, category=data.category,
        max_amount=data.max_amount, per_day_limit=data.per_day_limit,
        description=data.description
    )
    db.add(std)
    db.commit()
    return {"id": std.id, "success": True}


@router.put("/standard/{std_id}")
def update_standard(
    std_id: int, data: StandardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")
    std = db.query(ExpenseStandard).filter(ExpenseStandard.id == std_id).first()
    if not std:
        raise HTTPException(status_code=404, detail="标准不存在")
    std.role = data.role
    std.category = data.category
    std.max_amount = data.max_amount
    std.per_day_limit = data.per_day_limit
    std.description = data.description
    db.commit()
    return {"success": True}


@router.delete("/standard/{std_id}")
def delete_standard(
    std_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")
    std = db.query(ExpenseStandard).filter(ExpenseStandard.id == std_id).first()
    if std:
        db.delete(std)
        db.commit()
    return {"success": True}


@router.get("/chain/list")
def list_approval_chains(db: Session = Depends(get_db)):
    chains = db.query(ApprovalChain).all()
    return [{
        "id": c.id, "name": c.name, "department": c.department,
        "category": c.category, "min_amount": float(c.min_amount),
        "max_amount": float(c.max_amount),
        "finance_required": c.finance_required,
        "manager_required": c.manager_required,
        "admin_required": c.admin_required,
        "is_active": c.is_active
    } for c in chains]


@router.post("/chain/create")
def create_approval_chain(
    data: ApprovalChainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")
    chain = ApprovalChain(
        name=data.name, department=data.department,
        category=data.category, min_amount=data.min_amount,
        max_amount=data.max_amount, finance_required=data.finance_required,
        manager_required=data.manager_required,
        admin_required=data.admin_required
    )
    db.add(chain)
    db.commit()
    return {"id": chain.id, "success": True}


@router.put("/chain/{chain_id}")
def update_approval_chain(
    chain_id: int, data: ApprovalChainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chain = db.query(ApprovalChain).filter(ApprovalChain.id == chain_id).first()
    if not chain:
        raise HTTPException(status_code=404, detail="审批链不存在")
    for attr in ["name", "department", "category", "finance_required", "manager_required", "admin_required"]:
        setattr(chain, attr, getattr(data, attr))
    chain.min_amount = data.min_amount
    chain.max_amount = data.max_amount
    db.commit()
    return {"success": True}


@router.delete("/chain/{chain_id}")
def delete_approval_chain(
    chain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="无权操作")
    chain = db.query(ApprovalChain).filter(ApprovalChain.id == chain_id).first()
    if chain:
        db.delete(chain)
        db.commit()
    return {"success": True}