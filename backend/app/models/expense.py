from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum

class ExpenseStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_FINANCE = "pending_finance"
    PENDING_MANAGER = "pending_manager"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    expense_no = Column(String(50), unique=True, index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String(50), nullable=False)  # 差旅/办公/招待
    description = Column(Text)
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.DRAFT, nullable=False)
    submitted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("User", backref="expenses")
    invoice = relationship("Invoice", backref="expense", uselist=False)
    approval_logs = relationship("ApprovalLog", backref="expense")