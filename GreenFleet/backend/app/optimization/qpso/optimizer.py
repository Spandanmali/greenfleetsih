"""Quantum-behaved particle swarm optimization for discrete assignments."""

import math
import random
import time
import hashlib
from dataclasses import dataclass
from typing import Callable, List, Sequence


@dataclass(frozen=True)
class DiscreteAssignment:
    """Indices for one route's vessel, speed, and fuel choices."""

    vessel: int
    speed: int
    fuel: int


@dataclass
class QPSOResult:
    best_position: List[float]
    best_cost: float
    initial_cost: float
    convergence: List[float]
    evaluations: int
    runtime_ms: float
    initialization_signature: str


class QPSOOptimizer:
    """Minimize a discrete objective with the standard QPSO update equation.

    The swarm lives in continuous quantum-behaved coordinates. Before scoring,
    each coordinate is decoded to a valid discrete option, so the objective
    never receives an invalid vessel/speed/fuel combination.
    """

    def __init__(
        self,
        route_count: int,
        vessel_count: int,
        speed_count: int,
        fuel_count: int,
        particles: int = 20,
        iterations: int = 30,
        seed: int | None = None,
    ):
        if route_count < 1 or min(vessel_count, speed_count, fuel_count) < 1:
            raise ValueError("QPSO dimensions and choices must be positive")
        if particles < 4 or iterations < 1:
            raise ValueError("QPSO requires at least four particles and one iteration")
        self.route_count = route_count
        self.choice_counts = (vessel_count, speed_count, fuel_count)
        self.dimensions = route_count * 3
        self.particles = particles
        self.iterations = iterations
        self.random = random.Random(seed)

    def decode(self, position: Sequence[float]) -> List[DiscreteAssignment]:
        """Map a continuous particle position to valid option indices."""
        assignments = []
        for route_index in range(self.route_count):
            offset = route_index * 3
            assignments.append(DiscreteAssignment(
                vessel=int(abs(position[offset])) % self.choice_counts[0],
                speed=int(abs(position[offset + 1])) % self.choice_counts[1],
                fuel=int(abs(position[offset + 2])) % self.choice_counts[2],
            ))
        return assignments

    def optimize(self, objective: Callable[[List[DiscreteAssignment]], float]) -> QPSOResult:
        started = time.perf_counter()
        # Coordinates are stored route-major: vessel, speed, fuel per route.
        particles = [
            [value for route_index in range(self.route_count) for choice in self.choice_counts
             for value in [self.random.uniform(0, max(choice - 1, 1))]]
            for _ in range(self.particles)
        ]
        personal_best = [particle[:] for particle in particles]
        initialization_signature = hashlib.sha256(repr(particles).encode()).hexdigest()[:16]
        personal_costs = [objective(self.decode(particle)) for particle in particles]
        evaluations = self.particles
        best_index = min(range(self.particles), key=personal_costs.__getitem__)
        global_best = personal_best[best_index][:]
        global_cost = personal_costs[best_index]
        initial_cost = global_cost
        convergence = [global_cost]

        for iteration in range(self.iterations):
            mbest = [
                sum(particle[dimension] for particle in personal_best) / self.particles
                for dimension in range(self.dimensions)
            ]
            contraction = 1.0 - 0.5 * iteration / max(self.iterations - 1, 1)
            for particle_index, particle in enumerate(particles):
                for dimension in range(self.dimensions):
                    phi = self.random.random()
                    attractor = (
                        phi * personal_best[particle_index][dimension]
                        + (1 - phi) * global_best[dimension]
                    )
                    u = max(self.random.random(), 1e-12)
                    direction = 1 if self.random.random() < 0.5 else -1
                    particle[dimension] = (
                        attractor
                        + direction * contraction * abs(mbest[dimension] - particle[dimension]) * math.log(1 / u)
                    )
                cost = objective(self.decode(particle))
                evaluations += 1
                if cost < personal_costs[particle_index]:
                    personal_best[particle_index] = particle[:]
                    personal_costs[particle_index] = cost
                    if cost < global_cost:
                        global_best = particle[:]
                        global_cost = cost
            convergence.append(global_cost)

        return QPSOResult(
            global_best,
            global_cost,
            initial_cost,
            convergence,
            evaluations,
            round((time.perf_counter() - started) * 1000, 2),
            initialization_signature,
        )