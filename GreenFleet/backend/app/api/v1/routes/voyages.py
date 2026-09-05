from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.voyage import Voyage
from app.schemas.voyage import VoyageCreate, VoyageUpdate, VoyageOut
from app.api.v1.deps import get_current_user, require_full_access
from app.models.user import User

router = APIRouter(prefix="/voyages", tags=["voyages"])


@router.get("/", response_model=List[VoyageOut])
def list_voyages(
    vessel_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Voyage)
    if vessel_id:
        query = query.filter(Voyage.vessel_id == vessel_id)
    return query.order_by(Voyage.created_at.desc()).limit(limit).all()


@router.post("/", response_model=VoyageOut, status_code=201)
def create_voyage(
    payload: VoyageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_full_access),
):
    voyage = Voyage(**payload.model_dump())
    db.add(voyage)
    db.commit()
    db.refresh(voyage)
    return voyage


@router.patch("/{voyage_id}", response_model=VoyageOut)
def update_voyage(
    voyage_id: str,
    payload: VoyageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_full_access),
):
    voyage = db.query(Voyage).filter(Voyage.id == voyage_id).first()
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(voyage, field, value)
    db.commit()
    db.refresh(voyage)
    return voyage
