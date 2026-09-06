export const FUEL_TYPES = ['VLSFO', 'MGO', 'HFO', 'LNG', 'METHANOL', 'HYDROGEN', 'AMMONIA', 'SHORE_POWER']

export const FUEL_PRICES_USD_PER_UNIT: Record<string, number> = {
  VLSFO: 600,
  MGO: 850,
  HFO: 500,
  LNG: 700,
  METHANOL: 550,
  HYDROGEN: 3000,
  AMMONIA: 700,
  SHORE_POWER: 150,
}

export const fuelLabel = (fuel: string) => fuel.replace('_', ' ')