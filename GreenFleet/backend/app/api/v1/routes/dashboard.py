from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.vessel import Vessel, CIIGrade
from app.models.voyage import Voyage, VoyageStatus
from app.models.fuel_prediction import FuelPrediction
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_vessels = db.query(Vessel).filter(Vessel.is_active == True).count()

    cii_distribution = (
        db.query(Vessel.current_cii_grade, func.count(Vessel.id))
        .filter(Vessel.is_active == True)
        .group_by(Vessel.current_cii_grade)
        .all()
    )
    cii_counts = {grade.value: count for grade, count in cii_distribution}

    recent_voyages = (
        db.query(Voyage)
        .order_by(Voyage.created_at.desc())
        .limit(5)
        .all()
    )

    vessels_list = (
        db.query(Vessel)
        .filter(Vessel.is_active == True)
        .limit(20)
        .all()
    )

    return {
        "total_vessels": total_vessels,
        "cii_distribution": {
            "A": cii_counts.get("A", 0),
            "B": cii_counts.get("B", 0),
            "C": cii_counts.get("C", 0),
            "D": cii_counts.get("D", 0),
            "E": cii_counts.get("E", 0),
        },
        "recent_voyages": [
            {
                "id": str(v.id),
                "vessel_id": str(v.vessel_id),
                "origin": v.origin_port,
                "destination": v.destination_port,
                "status": v.status.value,
                "predicted_fuel_mt": v.predicted_fuel_consumed_mt,
                "actual_fuel_mt": v.actual_fuel_consumed_mt,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in recent_voyages
        ],
        "vessels": [
            {
                "id": str(v.id),
                "imo_number": v.imo_number,
                "name": v.name,
                "vessel_type": v.vessel_type.value,
                "cii_grade": v.current_cii_grade.value if v.current_cii_grade else "unknown",
                "latitude": v.current_latitude,
                "longitude": v.current_longitude,
            }
            for v in vessels_list
        ],
    }
