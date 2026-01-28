from pydantic import BaseModel

class ExpenseCreate(BaseModel):
    title: str
    amount: int
    category: str

class ExpenseOut(ExpenseCreate):
    id: int

    class Config:
        from_attributes = True
