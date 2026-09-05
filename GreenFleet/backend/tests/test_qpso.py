import unittest

from app.optimization.qpso import QPSOOptimizer


class QPSOOptimizerTests(unittest.TestCase):
    def test_runs_iterations_and_returns_valid_assignments(self):
        optimizer = QPSOOptimizer(2, 2, 3, 2, particles=6, iterations=5, seed=11)
        result = optimizer.optimize(
            lambda assignments: sum(choice.vessel + choice.speed + choice.fuel for choice in assignments)
        )

        self.assertEqual(result.evaluations, 36)
        self.assertEqual(len(result.convergence), 6)
        for assignment in optimizer.decode(result.best_position):
            self.assertIn(assignment.vessel, range(2))
            self.assertIn(assignment.speed, range(3))
            self.assertIn(assignment.fuel, range(2))