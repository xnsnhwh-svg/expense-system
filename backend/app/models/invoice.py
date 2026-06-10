from sqlalchemy import Column, Integer, String, Numeric, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    invoice_no = Column(String(100), index=True)
    invoice_code = Column(String(50))
    invoice_amount = Column(Numeric(10, 2))
    invoice_date = Column(Date)
    seller_name = Column(String(200))
    buyer_name = Column(String(200))
    image_url = Column(String(500))
    ocr_raw_text = Column(Text)
    ocr_confidence = Column(Numeric(5, 4))
    validation_result = Column(String(50))
    validation_message = Column(Text)
    validation_details = Column(Text)
    created_at = Column(Integer)