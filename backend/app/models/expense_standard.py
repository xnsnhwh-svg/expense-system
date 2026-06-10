from sqlalchemy import Column, Integer, String, Numeric
from app.database import Base


class ExpenseStandard(Base):
    __tablename__ = "expense_standards"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50))
    category = Column(String(50), nullable=False)
    max_amount = Column(Numeric(10, 2))
    per_day_limit = Column(Numeric(10, 2))
    description = Column(String(200))