from sqlalchemy import Column, Integer, String, Numeric
from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String(100), nullable=False)
    fiscal_year = Column(Integer, nullable=False)
    category = Column(String(50))
    budget_amount = Column(Numeric(12, 2), nullable=False)
    used_amount = Column(Numeric(12, 2), default=0)
    warning_threshold = Column(Numeric(5, 4), default=0.8)