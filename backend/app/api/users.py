from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, UserBase, UserUpdate

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/profile", response_model=UserResponse)
def get_user_profile(db: Session = Depends(get_db)):
    """Retrieve the current farmer profile. Creates default profile if none exists."""
    user = db.query(User).first()
    if not user:
        user = User(
            name="Farmer",
            phone="",
            state="Tamil Nadu",
            preferred_language="en",
            tamil_dialect="standard"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.post("/profile", response_model=UserResponse)
def update_user_profile(profile_in: UserUpdate, db: Session = Depends(get_db)):
    """Update or initialize the farmer profile, preferred language, and dialect."""
    user = db.query(User).first()
    if not user:
        user = User(
            name=profile_in.name or "Farmer",
            phone=profile_in.phone or "",
            state=profile_in.state,
            preferred_language=profile_in.preferred_language or "en",
            tamil_dialect=profile_in.tamil_dialect or "standard"
        )
        db.add(user)
    else:
        if profile_in.name is not None:
            user.name = profile_in.name
        if profile_in.phone is not None:
            user.phone = profile_in.phone
        if profile_in.state is not None:
            user.state = profile_in.state
        if profile_in.preferred_language is not None:
            user.preferred_language = profile_in.preferred_language
        if profile_in.tamil_dialect is not None:
            user.tamil_dialect = profile_in.tamil_dialect

    db.commit()
    db.refresh(user)
    return user
