import unittest

from app.optimization.ga import GAOptimizer


class GAOptimizerTests(unittest.TestCase):
    def test_deap_ga_runs_generations_and_returns_valid_assignments(self):
        optimizer = GAOptimizer(2, 2, 3, 2, population=6, generations=5, seed=11)
        result = optimizer.optimize(
            lambda assignments: sum(choice.vessel + choice.speed + choice.fuel for choice in assignments)
        )

        self.assertEqual(result.generations, 5)
        self.assertGreaterEqual(result.evaluations, 6)
        self.assertEqual(len(result.assignments), 2)
        for assignment in result.assignments:
            self.assertIn(assignment.vessel, range(2))
            self.assertIn(assignment.speed, range(3))
            self.assertIn(assignment.fuel, range(2))