import unittest
from types import SimpleNamespace

from app.optimization.evaluator import FleetProblem
from app.optimization.qpso import DiscreteAssignment


class FleetProblemTests(unittest.TestCase):
    def setUp(self):
        self.route = SimpleNamespace(
            id="route-1",
            origin_port="SGSIN",
            destination_port="NLRTM",
            distance_nm=8070,
            cargo_weight_mt=45000,
            fuel_price_per_mt=600,
        )
        self.vessels = [{
            "id": "vessel-1",
            "name": "Test vessel",
            "vessel_type": "container_ship",
            "gross_tonnage": 50000,
            "deadweight_tonnage": 75000,
            "engine_power_kw": 12000,
        }]

    def test_fuel_choices_have_distinct_nonzero_cost_and_emissions(self):
        problem = FleetProblem(
            [self.route], self.vessels, [14], ["HFO", "METHANOL", "HYDROGEN", "AMMONIA"],
        )
        hfo = problem.predict_assignment(0, DiscreteAssignment(0, 0, 0))
        methanol = problem.predict_assignment(0, DiscreteAssignment(0, 0, 1))
        self.assertNotEqual(hfo["predicted_cost_usd"], methanol["predicted_cost_usd"])
        self.assertGreater(hfo["predicted_co2_tonnes"], 0)
        self.assertGreater(methanol["predicted_co2_tonnes"], 0)
        self.assertLess(methanol["predicted_co2_tonnes"], hfo["predicted_co2_tonnes"])


if __name__ == "__main__":
    unittest.main()
