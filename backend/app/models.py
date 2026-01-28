from sqlalchemy import Column, Integer, String
from .database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
