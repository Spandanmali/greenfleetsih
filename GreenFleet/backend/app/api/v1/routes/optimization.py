from fastapi import APIRouter, Depends, HTTPException
import hashlib
import random
import time
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.vessel import Vessel
from app.optimization.evaluator import FleetProblem
from app.optimization.ga import GAResult
from app.optimization.qpso import QPSOOptimizer
from app.optimization.qpso import DiscreteAssignment
from app.schemas.optimization import BenchmarkResponse, QPSORequest, QPSOResponse

router = APIRouter(prefix="/optimization", tags=["optimization"])


def load_problem(payload: QPSORequest, db: Session) -> FleetProblem:
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
    return FleetProblem(payload.routes, vessel_specs, payload.speeds, payload.fuel_types)


def run_benchmark_qpso(payload: QPSORequest, problem: FleetProblem):
    optimizer = QPSOOptimizer(
        route_count=len(payload.routes), vessel_count=len(problem.vessels),
        speed_count=len(payload.speeds), fuel_count=len(payload.fuel_types),
        particles=payload.particles, iterations=payload.iterations,
    )
    return optimizer.optimize(problem.cost)


def run_classical_ga(payload: QPSORequest, problem: FleetProblem):
    """Run a self-contained classical GA for benchmark comparisons."""
    random_source = random.Random()
    route_count = len(payload.routes)
    choice_counts = (len(problem.vessels), len(payload.speeds), len(payload.fuel_types))
    population_size = max(20, min(payload.particles, 30))
    mutation_rate = 0.15

    def random_assignment() -> list[DiscreteAssignment]:
        return [DiscreteAssignment(
            vessel=random_source.randrange(choice_counts[0]),
            speed=random_source.randrange(choice_counts[1]),
            fuel=random_source.randrange(choice_counts[2]),
        ) for _ in range(route_count)]

    def tournament(population: list[list[DiscreteAssignment]], costs: list[float]) -> list[DiscreteAssignment]:
        candidates = [random_source.randrange(len(population)) for _ in range(3)]
        winner = min(candidates, key=lambda index: costs[index])
        return population[winner][:]

    def crossover(first: list[DiscreteAssignment], second: list[DiscreteAssignment]) -> tuple[list[DiscreteAssignment], list[DiscreteAssignment]]:
        if route_count < 2:
            return first[:], second[:]
        cut = random_source.randrange(1, route_count)
        return first[:cut] + second[cut:], second[:cut] + first[cut:]

    def mutate(individual: list[DiscreteAssignment]) -> None:
        if random_source.random() >= mutation_rate:
            return
        route_index = random_source.randrange(route_count)
        individual[route_index] = DiscreteAssignment(
            vessel=random_source.randrange(choice_counts[0]),
            speed=random_source.randrange(choice_counts[1]),
            fuel=random_source.randrange(choice_counts[2]),
        )

    started = time.perf_counter()
    population = [random_assignment() for _ in range(population_size)]
    initialization_signature = hashlib.sha256(repr(population).encode()).hexdigest()[:16]
    population_costs = [problem.cost(individual) for individual in population]
    evaluations = population_size

    best_index = min(range(population_size), key=population_costs.__getitem__)
    best_cost = population_costs[best_index]
    best_individual = population[best_index][:]
    convergence = [best_cost]

    for _ in range(payload.iterations):
        next_population = [best_individual[:]]
        while len(next_population) < population_size:
            first = tournament(population, population_costs)
            second = tournament(population, population_costs)
            child, sibling = crossover(first, second)
            mutate(child)
            mutate(sibling)
            next_population.extend((child, sibling))
        population = next_population[:population_size]
        population_costs = [problem.cost(individual) for individual in population]
        evaluations += population_size

        generation_best_index = min(range(population_size), key=population_costs.__getitem__)
        if population_costs[generation_best_index] < best_cost:
            best_cost = population_costs[generation_best_index]
            best_individual = population[generation_best_index][:]
        convergence.append(best_cost)

    return GAResult(
        assignments=best_individual,
        best_cost=best_cost,
        initial_cost=convergence[0],
        generations=payload.iterations,
        evaluations=evaluations,
        runtime_ms=round((time.perf_counter() - started) * 1000, 2),
        convergence=convergence,
        initialization_signature=initialization_signature,
    )


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
        result = run_classical_ga(payload, problem)
        assignments = problem.result_assignments(result.assignments)
        metrics = {
            "method": "ga", "iterations": result.generations, "generations": result.generations,
            "particles": payload.particles, "evaluations": result.evaluations,
            "initial_cost_usd": round(result.initial_cost, 2), "final_cost_usd": round(result.best_cost, 2),
            "improvement_percent": round(((result.initial_cost - result.best_cost) / result.initial_cost * 100) if result.initial_cost else 0, 2),
            "convergence": result.convergence, "runtime_ms": result.runtime_ms,
            "initialization_signature": result.initialization_signature,
        }
    else:
        optimizer = QPSOOptimizer(
            route_count=len(payload.routes), vessel_count=len(vessel_specs),
            speed_count=len(payload.speeds), fuel_count=len(payload.fuel_types),
            particles=payload.particles, iterations=payload.iterations,
        )
        result = optimizer.optimize(problem.cost)
        assignments = problem.result_assignments(optimizer.decode(result.best_position))
        metrics = {
            "method": "qpso", "iterations": payload.iterations, "generations": 0,
            "particles": payload.particles, "evaluations": result.evaluations,
            "initial_cost_usd": round(result.initial_cost, 2), "final_cost_usd": round(result.best_cost, 2),
            "improvement_percent": round(((result.initial_cost - result.best_cost) / result.initial_cost * 100) if result.initial_cost else 0, 2),
            "convergence": result.convergence, "runtime_ms": result.runtime_ms,
            "initialization_signature": result.initialization_signature,
        }

    return {
        "assignments": assignments,
        "total_predicted_fuel_mt": round(sum(item["predicted_fuel_mt"] for item in assignments), 2),
        "total_cost_usd": round(sum(item["predicted_cost_usd"] for item in assignments), 2),
        "total_co2_tonnes": round(sum(item["predicted_co2_tonnes"] for item in assignments), 2),
        "metrics": metrics,
    }


@router.post("/benchmark", response_model=BenchmarkResponse)
def run_algorithm_benchmark(
    payload: QPSORequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problem = load_problem(payload, db)
    qpso_result = run_benchmark_qpso(payload, problem)
    ga_result = run_classical_ga(payload, problem)
    return {
        "qpso": {
            "final_cost_usd": qpso_result.best_cost,
            "convergence": qpso_result.convergence,
            "runtime_ms": qpso_result.runtime_ms,
                    "initialization_signature": qpso_result.initialization_signature,
        },
        "ga": {
            "final_cost_usd": ga_result.best_cost,
            "convergence": ga_result.convergence,
            "runtime_ms": ga_result.runtime_ms,
                    "initialization_signature": ga_result.initialization_signature,
        },
        "iterations": payload.iterations,
        "particles": payload.particles,
    }