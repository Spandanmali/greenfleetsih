"""Shared fleet objective used by every optimization method."""

from dataclasses import dataclass
from typing import Any, List, Sequence

from app.ml import fuel_model
from app.optimization.qpso import DiscreteAssignment


@dataclass
class FleetProblem:
    routes: Sequence[Any]
    vessels: Sequence[dict]
    speeds: Sequence[float]
    fuel_types: Sequence[str]

    def predict_assignment(self, route_index: int, assignment: DiscreteAssignment) -> dict:
        route = self.routes[route_index]
        vessel = self.vessels[assignment.vessel]
        return fuel_model.predict(
            vessel_type=vessel["vessel_type"],
            gross_tonnage=vessel["gross_tonnage"],
            deadweight_tonnage=vessel["deadweight_tonnage"],
            engine_power_kw=vessel["engine_power_kw"],
            distance_nm=route.distance_nm,
            cargo_weight_mt=route.cargo_weight_mt,
            speed_knots=self.speeds[assignment.speed],
            fuel_type=self.fuel_types[assignment.fuel],
            fuel_price_per_mt=route.fuel_price_per_mt,
        )

    def cost(self, assignments: List[DiscreteAssignment]) -> float:
        """The canonical objective: sum predicted fuel cost per route."""
        return sum(
            self.predict_assignment(route_index, assignment)["predicted_cost_usd"]
            for route_index, assignment in enumerate(assignments)
        )

    def result_assignments(self, assignments: List[DiscreteAssignment]) -> list[dict]:
        results = []
        for route_index, assignment in enumerate(assignments):
            route = self.routes[route_index]
            vessel = self.vessels[assignment.vessel]
            prediction = self.predict_assignment(route_index, assignment)
            results.append({
                "route_id": route.id,
                "origin_port": route.origin_port,
                "destination_port": route.destination_port,
                "vessel_id": vessel["id"],
                "vessel_name": vessel["name"],
                "speed_knots": self.speeds[assignment.speed],
                "fuel_type": self.fuel_types[assignment.fuel],
                "predicted_fuel_mt": prediction["predicted_fuel_mt"],
                "predicted_cost_usd": prediction["predicted_cost_usd"],
                "predicted_co2_tonnes": prediction["predicted_co2_tonnes"],
            })
        return results