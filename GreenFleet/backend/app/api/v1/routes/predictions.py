from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.vessel import Vessel
from app.models.fuel_prediction import FuelPrediction
from app.schemas.prediction import PredictionRequest, PredictionOut
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.ml import fuel_model

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/", response_model=PredictionOut, status_code=201)
def run_prediction(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vessel = db.query(Vessel).filter(Vessel.id == payload.vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")

    result = fuel_model.predict(
        vessel_type=vessel.vessel_type.value if hasattr(vessel.vessel_type, 'value') else vessel.vessel_type,
        gross_tonnage=vessel.gross_tonnage or 50000,
        deadweight_tonnage=vessel.deadweight_tonnage or 75000,
        engine_power_kw=vessel.engine_power_kw or 12000,
        distance_nm=payload.distance_nm,
        cargo_weight_mt=payload.cargo_weight_mt,
        speed_knots=payload.cruising_speed_knots,
        fuel_type=payload.fuel_type,
        fuel_price_per_mt=payload.fuel_price_per_mt or 600.0,
    )

    prediction = FuelPrediction(
        vessel_id=payload.vessel_id,
        created_by=current_user.id,
        origin_port=payload.origin_port,
        destination_port=payload.destination_port,
        distance_nm=payload.distance_nm,
        cargo_weight_mt=payload.cargo_weight_mt,
        cruising_speed_knots=payload.cruising_speed_knots,
        fuel_type=payload.fuel_type,
        fuel_price_per_mt=payload.fuel_price_per_mt or 600.0,
        predicted_fuel_mt=result["predicted_fuel_mt"],
        confidence_lower=result["confidence_lower"],
        confidence_upper=result["confidence_upper"],
        predicted_cost_usd=result["predicted_cost_usd"],
        predicted_co2_tonnes=result["predicted_co2_tonnes"],
        speed_sensitivity=result["speed_sensitivity"],
        model_version=result["model_version"],
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@router.get("/vessel/{vessel_id}", response_model=List[PredictionOut])
def get_vessel_predictions(
    vessel_id: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(FuelPrediction)
        .filter(FuelPrediction.vessel_id == vessel_id)
        .order_by(FuelPrediction.created_at.desc())
        .limit(limit)
        .all()
    )
