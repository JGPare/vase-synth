import json
from typing import Optional

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from api.database import get_db
from api.dependencies import get_current_user_optional
from api.models import User, Vase
from api.processing import string_dict_to_int_dict
from api.random_vase import random_vase_data
from api.schemas import IncrementDownloadRequest, LoadVaseRequest, SaveVaseRequest
from api.settings import default_vase, settings

router = APIRouter(prefix="/api", tags=["vases"])


@router.post("/save-vase")
def save_vase(
    body: SaveVaseRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user is None:
        return {"status": "not authenticated"}

    vase_data = {
        "generic0": body.generic0,
        "generic1": body.generic1,
        "modifiers": body.modifiers,
    }
    vase_data = string_dict_to_int_dict(vase_data)

    vase = (
        db.query(Vase)
        .filter(Vase.user_id == current_user.id, Vase.name == body.name)
        .first()
    )

    if vase:
        vase.data = json.dumps(vase_data)
        vase.appearance = json.dumps(body.appearance)
        vase.set_access(body.access or "private")
    else:
        vase = Vase(
            user_id=current_user.id,
            name=body.name,
            data=json.dumps(vase_data),
            appearance=json.dumps(body.appearance),
        )
        vase.set_access(body.access or "private")
        db.add(vase)

    db.commit()
    return {"status": "ok"}


@router.post("/get-index")
def get_index(
    access: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user and access == "private":
        vases = (
            db.query(Vase)
            .filter(Vase.user_id == current_user.id)
            .order_by(Vase.downloads.desc())
            .all()
        )
        data = [
            {"name": v.name, "user": current_user.username, "downloads": v.downloads, "access": "public" if v.public else "private"}
            for v in vases
        ]
    else:
        users = db.query(User).all()
        id_name_dict = {u.id: u.username for u in users}
        vases = (
            db.query(Vase)
            .filter(Vase.public == 1)
            .order_by(Vase.downloads.desc())
            .all()
        )
        data = [
            {"name": v.name, "user": id_name_dict[v.user_id], "downloads": v.downloads, "access": "public"}
            for v in vases
        ]

    return data


@router.post("/load-vase")
def load_vase(
    body: Optional[LoadVaseRequest] = None,
    db: Session = Depends(get_db),
):
    vase = None

    if body and body.name and body.user:
        user = db.query(User).filter(User.username == body.user).first()
        if user:
            vase = (
                db.query(Vase)
                .filter(Vase.user_id == user.id, Vase.name == body.name)
                .first()
            )

    if vase:
        vase_data = json.loads(vase.data)
        appearance = vase.appearance
        downloads = vase.downloads
    else:
        vase_data = dict(default_vase)
        appearance = ""
        downloads = 0

    if "radial" in vase_data or "vertical" in vase_data:
        modifiers = []
        for r in vase_data.pop("radial", []):
            modifiers.append({"type": "sin_radial", **r})
        for v in vase_data.pop("vertical", []):
            modifiers.append({"type": "sin_vertical", **v})
        vase_data["modifiers"] = modifiers

    return [json.dumps(vase_data), appearance, downloads]


@router.post("/delete-vase")
def delete_vase(
    name: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if current_user:
        vase = (
            db.query(Vase)
            .filter(Vase.user_id == current_user.id, Vase.name == name)
            .first()
        )
        if vase:
            db.delete(vase)
            db.commit()

    return default_vase


@router.post("/increment-download")
def increment_download(
    body: IncrementDownloadRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    # Increment dummy vase for total download count
    dummy_user = db.query(User).filter(User.username == "jules").first()
    if dummy_user:
        dummy_vase = (
            db.query(Vase)
            .filter(Vase.user_id == dummy_user.id, Vase.name == "dummy")
            .first()
        )
        if dummy_vase:
            dummy_vase.increment_downloads()

    vase = None
    if body.name and body.user:
        user = db.query(User).filter(User.username == body.user).first()
        if user:
            vase = (
                db.query(Vase)
                .filter(Vase.user_id == user.id, Vase.name == body.name)
                .first()
            )

        if not vase and current_user:
            vase = (
                db.query(Vase)
                .filter(Vase.user_id == current_user.id, Vase.name == body.name)
                .first()
            )

    status = "Status OK"
    if vase:
        vase.increment_downloads()
    else:
        status = "Status Failed"

    db.commit()
    return status


@router.get("/load-settings")
def load_settings():
    return settings


@router.get("/load-random")
def load_random():
    vase_data = random_vase_data()
    appearance = "0"
    downloads = 0
    vase_data = json.dumps(vase_data)
    return [vase_data, appearance, downloads]
