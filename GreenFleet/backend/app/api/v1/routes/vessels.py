from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.vessel import Vessel
from app.schemas.vessel import VesselCreate, VesselUpdate, VesselOut
from app.api.v1.deps import get_current_user, require_full_access
from app.models.user import User

router = APIRouter(prefix="/vessels", tags=["vessels"])


@router.get("/", response_model=List[VesselOut])
def list_vessels(
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Vessel)
    if is_active is not None:
        query = query.filter(Vessel.is_active == is_active)
    return query.all()


@router.get("/{vessel_id}", response_model=VesselOut)
def get_vessel(
    vessel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return vessel


@router.post("/", response_model=VesselOut, status_code=201)
def create_vessel(
    payload: VesselCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_full_access),
):
    if db.query(Vessel).filter(Vessel.imo_number == payload.imo_number).first():
        raise HTTPException(status_code=400, detail="IMO number already registered")
    vessel = Vessel(**payload.model_dump())
    db.add(vessel)
    db.commit()
    db.refresh(vessel)
    return vessel


@router.patch("/{vessel_id}", response_model=VesselOut)
def update_vessel(
    vessel_id: str,
    payload: VesselUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_full_access),
):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(vessel, field, value)
    db.commit()
    db.refresh(vessel)
    return vessel


@router.delete("/{vessel_id}", status_code=204)
def deactivate_vessel(
    vessel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_full_access),
):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    vessel.is_active = False
    db.commit()
