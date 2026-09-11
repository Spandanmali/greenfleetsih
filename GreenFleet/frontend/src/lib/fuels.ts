export const FUEL_TYPES = ['VLSFO', 'MGO', 'HFO', 'LNG', 'METHANOL', 'HYDROGEN', 'AMMONIA']

export const FUEL_PRICES_USD_PER_UNIT: Record<string, number> = {
  VLSFO: 600,
  MGO: 850,
  HFO: 450,
  LNG: 950,
  METHANOL: 800,
  HYDROGEN: 3000,
  AMMONIA: 1200,
}

export const fuelLabel = (fuel: string) => fuel.replace('_', ' ')