from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from api.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    admin: Mapped[int] = mapped_column(Integer, default=0)

    vases = relationship("Vase", backref="creator", lazy=True, cascade="all, delete")

    def __init__(self, email: str, username: str, password: str, admin: int = 0):
        self.username = username
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.admin = admin

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)


class Vase(Base):
    __tablename__ = "vases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unique_name: Mapped[str] = mapped_column(Text, unique=True, index=True)
    name: Mapped[str] = mapped_column(Text)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    data: Mapped[str] = mapped_column(String(512))
    appearance: Mapped[str] = mapped_column(String(512))
    public: Mapped[int] = mapped_column(Integer, index=True, default=0)
    downloads: Mapped[int] = mapped_column(Integer, default=0)

    def __init__(self, user_id: int, name: str, data: str, appearance: str, public: int = 0, downloads: int = 0):
        self.user_id = user_id
        self.name = name
        self.data = data
        self.appearance = appearance
        self.public = public
        self.unique_name = f"{user_id}-{name}"
        self.downloads = downloads

    def set_access(self, access: str):
        if access == "public":
            self.public = 1
        elif access == "private":
            self.public = 0

    def increment_downloads(self):
        self.downloads += 1
