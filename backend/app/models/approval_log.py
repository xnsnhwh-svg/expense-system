from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class ApprovalLog(Base):
    __tablename__ = "approval_logs"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(20), nullable=False)  # approve/reject
    comment = Column(Text)
    from_status = Column(String(50))
    to_status = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    approver = relationship("User", backref="approval_actions")