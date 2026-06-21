from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    bank_account = Column(String(50))
    bank_name = Column(String(100))
    payee_name = Column(String(100))
    status = Column(String(20), default=PaymentStatus.PENDING.value)
    transaction_no = Column(String(100))
    paid_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    remark = Column(Text)

    expense = relationship("Expense", backref="payment")