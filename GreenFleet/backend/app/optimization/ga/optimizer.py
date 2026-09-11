"""DEAP-backed classical genetic algorithm for fleet assignments."""

import random
import time
import hashlib
from dataclasses import dataclass
from typing import Callable, List

from deap import base, creator, tools

from app.optimization.qpso import DiscreteAssignment


@dataclass
class GAResult:
    assignments: List[DiscreteAssignment]
    best_cost: float
    initial_cost: float
    generations: int
    evaluations: int
    runtime_ms: float
    convergence: List[float]
    initialization_signature: str


class GAOptimizer:
    """Use DEAP for population, evaluation, selection, variation, and evolution."""

    def __init__(self, route_count: int, vessel_count: int, speed_count: int, fuel_count: int,
                 population: int = 20, generations: int = 30, seed: int | None = None):
        if route_count < 1 or min(vessel_count, speed_count, fuel_count) < 1:
            raise ValueError("GA dimensions and choices must be positive")
        if population < 4 or generations < 1:
            raise ValueError("GA requires at least four individuals and one generation")
        self.route_count = route_count
        self.choice_counts = (vessel_count, speed_count, fuel_count)
        self.population_size = population
        self.generations = generations
        self.random = random.Random(seed)

    def _assignment(self, individual) -> List[DiscreteAssignment]:
        return [DiscreteAssignment(
            vessel=individual[index],
            speed=individual[index + 1],
            fuel=individual[index + 2],
        ) for index in range(0, len(individual), 3)]

    def optimize(self, objective: Callable[[List[DiscreteAssignment]], float]) -> GAResult:
        fitness_name = "GreenFleetMinFitness"
        individual_name = "GreenFleetIndividual"
        if not hasattr(creator, fitness_name):
            creator.create(fitness_name, base.Fitness, weights=(-1.0,))
        if not hasattr(creator, individual_name):
            creator.create(individual_name, list, fitness=getattr(creator, fitness_name))

        toolbox = base.Toolbox()
        toolbox.register("individual", tools.initIterate, getattr(creator, individual_name), lambda: [
            self.random.randrange(choice)
            for _ in range(self.route_count)
            for choice in self.choice_counts
        ])
        toolbox.register("population", tools.initRepeat, list, toolbox.individual)
        toolbox.register("evaluate", lambda individual: (objective(self._assignment(individual)),))

        def select(population, count):
            return [min(
                (self.random.choice(population) for _ in range(3)),
                key=lambda individual: individual.fitness.values[0],
            ) for _ in range(count)]

        def mate(first, second):
            if len(first) > 1:
                left, right = sorted(self.random.sample(range(len(first)), 2))
                first[left:right], second[left:right] = second[left:right], first[left:right]
            return first, second

        toolbox.register("select", select)
        toolbox.register("mate", mate)

        def mutate(individual):
            for index, choice in zip(range(len(individual)), self.choice_counts * self.route_count):
                if self.random.random() < 0.15:
                    individual[index] = self.random.randrange(choice)
            return individual,

        toolbox.register("mutate", mutate)
        population = toolbox.population(n=self.population_size)
        initialization_signature = hashlib.sha256(repr([individual[:] for individual in population]).encode()).hexdigest()[:16]
        evaluations = 0

        def evaluate_invalid():
            nonlocal evaluations
            invalid = [individual for individual in population if not individual.fitness.valid]
            for individual in invalid:
                individual.fitness.values = toolbox.evaluate(individual)
            evaluations += len(invalid)

        started = time.perf_counter()
        evaluate_invalid()
        initial_cost = min(individual.fitness.values[0] for individual in population)
        best_cost = initial_cost
        best_individual = min(population, key=lambda individual: individual.fitness.values[0])[:]
        convergence = [best_cost]
        for _ in range(self.generations):
            offspring = list(map(toolbox.clone, toolbox.select(population, len(population))))
            for first, second in zip(offspring[::2], offspring[1::2]):
                if self.random.random() < 0.7:
                    toolbox.mate(first, second)
                    del first.fitness.values
                    del second.fitness.values
            for individual in offspring:
                if self.random.random() < 0.2:
                    toolbox.mutate(individual)
                    del individual.fitness.values
            population[:] = offspring
            evaluate_invalid()
            generation_best = min(population, key=lambda individual: individual.fitness.values[0])
            if generation_best.fitness.values[0] < best_cost:
                best_cost = generation_best.fitness.values[0]
                best_individual = generation_best[:]
            convergence.append(best_cost)

        return GAResult(
            assignments=self._assignment(best_individual),
            best_cost=best_cost,
            initial_cost=initial_cost,
            generations=self.generations,
            evaluations=evaluations,
            runtime_ms=round((time.perf_counter() - started) * 1000, 2),
            convergence=convergence,
            initialization_signature=initialization_signature,
        )