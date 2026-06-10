from sqlalchemy import Column, Integer, String, Numeric, Boolean
from app.database import Base


class ApprovalChain(Base):
    __tablename__ = "approval_chains"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(100))
    category = Column(String(50))
    min_amount = Column(Numeric(12, 2), default=0)
    max_amount = Column(Numeric(12, 2), default=99999999)
    finance_required = Column(Boolean, default=True)
    manager_required = Column(Boolean, default=False)
    admin_required = Column(Boolean, default=False)
    is_active = Column(Integer, default=1)