from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Calendar
from pydantic import BaseModel
from datetime import date, time

router = APIRouter()


class CalendarCreate(BaseModel):
    resource_id: int
    date: date
    shift_start: time
    shift_end: time
    is_working_day: bool = True


class CalendarResponse(BaseModel):
    id: int
    resource_id: int
    date: date
    shift_start: time
    shift_end: time
    is_working_day: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=list[CalendarResponse])
def list_calendars(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取日历列表"""
    calendars = db.query(Calendar).offset(skip).limit(limit).all()
    return calendars


@router.post("/", response_model=CalendarResponse)
def create_calendar(calendar: CalendarCreate, db: Session = Depends(get_db)):
    """创建日历"""
    db_calendar = Calendar(**calendar.model_dump())
    db.add(db_calendar)
    db.commit()
    db.refresh(db_calendar)
    return db_calendar
