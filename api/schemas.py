from pydantic import BaseModel, EmailStr
from typing import Optional


class SaveVaseRequest(BaseModel):
    name: str
    appearance: object
    access: Optional[str] = "private"
    generic0: dict
    generic1: dict
    modifiers: list


class LoadVaseRequest(BaseModel):
    name: str
    user: str


class IncrementDownloadRequest(BaseModel):
    name: str
    user: str


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    pass_confirm: str
    not_a_robot: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetVerified(BaseModel):
    password: str
    pass_confirm: str


class AuthMeResponse(BaseModel):
    authenticated: bool
    username: Optional[str] = None
    id: Optional[int] = None
