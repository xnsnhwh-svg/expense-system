from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    department = Column(String(100), nullable=False)
    ratio = Column(Numeric(5, 4), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    expense = relationship("Expense", backref="splits")