from datetime import timedelta
from time import time

import jwt
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from api.config import settings
from api.database import get_db
from api.dependencies import create_access_token, get_current_user_optional
from api.email import send_password_reset_email
from api.models import User
from api.schemas import (
    AuthMeResponse,
    PasswordResetRequest,
    PasswordResetVerified,
    UserCreate,
    UserLogin,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
def register(body: UserCreate, db: Session = Depends(get_db)):
    # Check existing email
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check existing username
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    # Password match
    if body.password != body.pass_confirm:
        raise HTTPException(status_code=400, detail="Passwords must match")
    # Honeypot check — bots check the checkbox, real users leave it unchecked
    if body.not_a_robot is True:
        # Bot detected, pretend success
        return {"message": "Registration successful"}

    user = User(email=body.email, username=body.username, password=body.password)
    db.add(user)
    db.commit()
    return {"message": "Registration successful"}


@router.post("/login")
def login(body: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.check_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=not settings.DEVELOPMENT,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"message": "Login successful", "username": user.username}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=AuthMeResponse)
def me(user=Depends(get_current_user_optional)):
    if user is None:
        return AuthMeResponse(authenticated=False)
    return AuthMeResponse(authenticated=True, username=user.username, id=user.id)


@router.post("/reset-password")
async def reset_password(body: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user is None:
        # Don't reveal whether email exists
        return {"message": "If that email exists, a reset link has been sent"}

    token = jwt.encode(
        {"reset_password": user.username, "exp": time() + 500},
        key=settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    await send_password_reset_email(user, token)
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-verified/{token}")
def reset_verified(token: str, body: PasswordResetVerified, db: Session = Depends(get_db)):
    if body.password != body.pass_confirm:
        raise HTTPException(status_code=400, detail="Passwords must match")

    try:
        payload = jwt.decode(token, key=settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username = payload["reset_password"]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")

    user.set_password(body.password)
    db.commit()
    return {"message": "Password reset successful"}
