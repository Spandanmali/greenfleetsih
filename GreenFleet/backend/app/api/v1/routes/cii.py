from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.vessel import Vessel
from app.models.cii_record import CIIRecord
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.services.cii_calculator import calculate_cii

router = APIRouter(prefix="/cii", tags=["cii"])


class CIIRequest(BaseModel):
    vessel_id: str
    distance_nm: float
    fuel_consumed_mt: float
    fuel_type: str = "VLSFO"
    year: int = 2026


@router.post("/calculate")
def calculate_vessel_cii(
    payload: CIIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vessel = db.query(Vessel).filter(Vessel.id == payload.vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")

    capacity = vessel.deadweight_tonnage or vessel.gross_tonnage or 50000
    vtype = vessel.vessel_type.value if hasattr(vessel.vessel_type, 'value') else vessel.vessel_type
    result = calculate_cii(
        vessel_type=vtype,
        capacity=capacity,
        distance_nm=payload.distance_nm,
        fuel_consumed_mt=payload.fuel_consumed_mt,
        fuel_type=payload.fuel_type,
        year=payload.year,
    )

    record = CIIRecord(
        vessel_id=payload.vessel_id,
        year=payload.year,
        distance_travelled_nm=payload.distance_nm,
        fuel_consumed_mt=payload.fuel_consumed_mt,
        co2_emitted_tonnes=result["co2_emitted_tonnes"],
        transport_work=result["transport_work"],
        attained_cii=result["attained_cii"],
        required_cii=result["required_cii"],
        cii_grade=result["cii_grade"],
    )
    db.add(record)
    vessel.current_cii_grade = result["cii_grade"]
    db.commit()

    return result


@router.get("/vessel/{vessel_id}/history")
def get_cii_history(
    vessel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(CIIRecord)
        .filter(CIIRecord.vessel_id == vessel_id)
        .order_by(CIIRecord.year.desc())
        .all()
    )
    return [
        {
            "year": r.year,
            "attained_cii": r.attained_cii,
            "required_cii": r.required_cii,
            "cii_grade": r.cii_grade.value if hasattr(r.cii_grade, 'value') else r.cii_grade,
            "co2_emitted_tonnes": r.co2_emitted_tonnes,
        }
        for r in records
    ]
