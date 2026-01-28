from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import Expense
from .schemas import ExpenseCreate
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ CORS FIX (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------- ROUTES --------------------

@app.get("/expenses")
def get_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).all()

@app.post("/expenses")
def add_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = Expense(
        title=expense.title,
        amount=expense.amount,
        category=expense.category
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).get(expense_id)
    db.delete(expense)
    db.commit()
    return {"message": "Deleted"}

@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense: ExpenseCreate,
    db: Session = Depends(get_db)
):
    e = db.query(Expense).get(expense_id)
    e.title = expense.title
    e.amount = expense.amount
    e.category = expense.category
    db.commit()
    return e
