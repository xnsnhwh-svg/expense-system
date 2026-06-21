from sqlalchemy import Column, Integer, DateTime, ForeignKey
from app.database import Base
from datetime import datetime


class ChatReadStatus(Base):
    __tablename__ = "chat_read_status"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    last_read_at = Column(DateTime, default=datetime.utcnow)
