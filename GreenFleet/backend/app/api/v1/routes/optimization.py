from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.vessel import Vessel
from app.optimization.evaluator import FleetProblem
from app.optimization.ga import GAOptimizer
from app.optimization.qpso import QPSOOptimizer
from app.schemas.optimization import QPSORequest, QPSOResponse

router = APIRouter(prefix="/optimization", tags=["optimization"])


@router.post("/qpso", response_model=QPSOResponse)
def run_qpso(
    payload: QPSORequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Vessel).filter(Vessel.is_active == True)
    if payload.vessel_ids:
        query = query.filter(Vessel.id.in_(payload.vessel_ids))
    vessels = query.all()
    if not vessels:
        raise HTTPException(status_code=400, detail="No active vessels are available")

    vessel_specs = [{
        "id": str(vessel.id),
        "name": vessel.name,
        "vessel_type": vessel.vessel_type.value if hasattr(vessel.vessel_type, "value") else vessel.vessel_type,
        "gross_tonnage": vessel.gross_tonnage or 50000,
        "deadweight_tonnage": vessel.deadweight_tonnage or 75000,
        "engine_power_kw": vessel.engine_power_kw or 12000,
    } for vessel in vessels]

    problem = FleetProblem(payload.routes, vessel_specs, payload.speeds, payload.fuel_types)
    if payload.method == "ga":
        optimizer = GAOptimizer(
            route_count=len(payload.routes), vessel_count=len(vessel_specs),
            speed_count=len(payload.speeds), fuel_count=len(payload.fuel_types),
            population=payload.particles, generations=payload.iterations, seed=42,
        )
        result = optimizer.optimize(problem.cost)
        assignments = problem.result_assignments(result.assignments)
        metrics = {
            "method": "ga", "iterations": result.generations, "generations": result.generations,
            "particles": payload.particles, "evaluations": result.evaluations,
            "initial_cost_usd": round(result.initial_cost, 2), "final_cost_usd": round(result.best_cost, 2),
            "improvement_percent": round(((result.initial_cost - result.best_cost) / result.initial_cost * 100) if result.initial_cost else 0, 2),
            "convergence": result.convergence, "runtime_ms": result.runtime_ms,
        }
    else:
        optimizer = QPSOOptimizer(
            route_count=len(payload.routes), vessel_count=len(vessel_specs),
            speed_count=len(payload.speeds), fuel_count=len(payload.fuel_types),
            particles=payload.particles, iterations=payload.iterations, seed=42,
        )
        result = optimizer.optimize(problem.cost)
        assignments = problem.result_assignments(optimizer.decode(result.best_position))
        metrics = {
            "method": "qpso", "iterations": payload.iterations, "generations": 0,
            "particles": payload.particles, "evaluations": result.evaluations,
            "initial_cost_usd": round(result.initial_cost, 2), "final_cost_usd": round(result.best_cost, 2),
            "improvement_percent": round(((result.initial_cost - result.best_cost) / result.initial_cost * 100) if result.initial_cost else 0, 2),
            "convergence": result.convergence, "runtime_ms": 0,
        }

    return {
        "assignments": assignments,
        "total_predicted_fuel_mt": round(sum(item["predicted_fuel_mt"] for item in assignments), 2),
        "total_cost_usd": round(sum(item["predicted_cost_usd"] for item in assignments), 2),
        "total_co2_tonnes": round(sum(item["predicted_co2_tonnes"] for item in assignments), 2),
        "metrics": metrics,
    }