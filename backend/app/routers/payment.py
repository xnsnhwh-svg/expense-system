from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Payment, PaymentStatus, Expense, ExpenseStatus, User, UserRole, Notification
from app.utils.security import get_current_user
from app.utils.masking import mask_sensitive_fields
from datetime import datetime
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/payment", tags=["支付"])


class FailRequest(BaseModel):
    reason: str = ""


class CreatePaymentRequest(BaseModel):
    bank_account: str = ""
    bank_name: str = ""
    payee_name: str = ""


@router.get("/list")
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Payment)
    if current_user.role == UserRole.EMPLOYEE:
        q = q.join(Expense).filter(Expense.employee_id == current_user.id)
    payments = q.order_by(Payment.created_at.desc()).all()
    return [mask_sensitive_fields({
        "id": p.id, "expense_id": p.expense_id,
        "expense_no": p.expense.expense_no if p.expense else "",
        "amount": float(p.amount),
        "bank_account": p.bank_account, "bank_name": p.bank_name,
        "payee_name": p.payee_name, "status": p.status,
        "transaction_no": p.transaction_no,
        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "remark": p.remark
    }, current_user.role.value) for p in payments]


@router.get("/{expense_id}")
def get_payment(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.expense_id == expense_id).first()
    if not payment:
        return None
    return mask_sensitive_fields({
        "id": payment.id, "expense_id": payment.expense_id,
        "amount": float(payment.amount),
        "bank_account": payment.bank_account, "bank_name": payment.bank_name,
        "payee_name": payment.payee_name, "status": payment.status,
        "transaction_no": payment.transaction_no,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "remark": payment.remark
    }, current_user.role.value)


@router.post("/create/{expense_id}")
def create_payment(
    expense_id: int,
    req: CreatePaymentRequest = CreatePaymentRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.FINANCE, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="无权操作")

    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")
    if expense.status != ExpenseStatus.APPROVED:
        raise HTTPException(status_code=400, detail="只有已审批通过的报销单可创建付款")

    existing = db.query(Payment).filter(Payment.expense_id == expense_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="该报销单已有付款记录")

    payment = Payment(
        expense_id=expense_id,
        amount=expense.amount,
        bank_account=req.bank_account or "6222****1234",
        bank_name=req.bank_name or "招商银行",
        payee_name=req.payee_name or expense.employee.full_name,
        status=PaymentStatus.PENDING.value
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"id": payment.id, "success": True}


@router.post("/process/{payment_id}")
def process_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.FINANCE, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="无权操作")

    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="付款记录不存在")
    if payment.status != PaymentStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="只有待付款的记录可以处理")

    payment.status = PaymentStatus.PROCESSING.value
    db.commit()
    return {"success": True, "status": payment.status}


@router.post("/complete/{payment_id}")
def complete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.FINANCE, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="无权操作")

    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="付款记录不存在")

    payment.status = PaymentStatus.SUCCESS.value
    payment.transaction_no = f"PAY{uuid.uuid4().hex[:12].upper()}"
    payment.paid_at = datetime.utcnow()

    expense = db.query(Expense).filter(Expense.id == payment.expense_id).first()
    if expense:
        expense.status = ExpenseStatus.PAID
        expense.paid_at = datetime.utcnow()

    db.add(Notification(
        user_id=expense.employee_id if expense else 0,
        title=f"报销单{expense.expense_no if expense else ''}已打款",
        content=f"付款金额¥{float(payment.amount):.2f}，交易号{payment.transaction_no}",
        expense_id=payment.expense_id
    ))

    db.commit()
    return {
        "success": True,
        "status": payment.status,
        "transaction_no": payment.transaction_no,
        "paid_at": payment.paid_at.isoformat()
    }


@router.post("/fail/{payment_id}")
def fail_payment(
    payment_id: int,
    req: FailRequest = None,
    reason: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.FINANCE, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="无权操作")

    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="付款记录不存在")

    payment.status = PaymentStatus.FAILED.value
    payment.remark = (req.reason if req else reason) or "付款失败"
    db.commit()
    return {"success": True, "status": payment.status}
