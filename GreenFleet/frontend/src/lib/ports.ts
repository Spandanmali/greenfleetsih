export const PORTS = [
  { code: 'SGSIN', name: 'Singapore, Singapore', latitude: 1.29, longitude: 103.85 },
  { code: 'NLRTM', name: 'Rotterdam, Netherlands', latitude: 51.92, longitude: 4.48 },
  { code: 'CNSHA', name: 'Shanghai, China', latitude: 31.23, longitude: 121.47 },
  { code: 'CNNGB', name: 'Ningbo, China', latitude: 29.87, longitude: 121.55 },
  { code: 'KRPUS', name: 'Busan, South Korea', latitude: 35.10, longitude: 129.04 },
  { code: 'AEDXB', name: 'Dubai, United Arab Emirates', latitude: 25.20, longitude: 55.27 },
  { code: 'USLAX', name: 'Los Angeles, United States', latitude: 33.74, longitude: -118.27 },
  { code: 'USNYC', name: 'New York, United States', latitude: 40.67, longitude: -74.04 },
  { code: 'DEHAM', name: 'Hamburg, Germany', latitude: 53.55, longitude: 9.99 },
  { code: 'GBFXT', name: 'Felixstowe, United Kingdom', latitude: 51.96, longitude: 1.35 },
  { code: 'INNSA', name: 'Nhava Sheva, India', latitude: 18.95, longitude: 72.95 },
  { code: 'BRSSZ', name: 'Santos, Brazil', latitude: -23.95, longitude: -46.33 },
]

export function getIdealDistance(originCode: string, destinationCode: string) {
  const origin = PORTS.find((port) => port.code === originCode)
  const destination = PORTS.find((port) => port.code === destinationCode)
  if (!origin || !destination || originCode === destinationCode) return ''

  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = toRadians(destination.latitude - origin.latitude)
  const longitudeDelta = toRadians(destination.longitude - origin.longitude)
  const originLatitude = toRadians(origin.latitude)
  const destinationLatitude = toRadians(destination.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2
  const greatCircleNm = 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)) / 1.852

  return String(Math.round(greatCircleNm * 1.1))
}

export function getEstimatedBunker(
  distanceNm: string,
  cargoWeightMt: string,
  speedKnots: number,
  enginePowerKw: number,
  deadweightTonnage: number,
) {
  const distance = Number(distanceNm)
  const cargo = Number(cargoWeightMt)
  if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(cargo) || cargo < 0 || speedKnots <= 0) return 0
  const loadFactor = cargo / Math.max(deadweightTonnage, 1)
  return enginePowerKw
    * (Math.max(speedKnots, 1) / 14) ** 3
    * loadFactor
    * 185
    * (distance / Math.max(speedKnots, 1))
    / 1_000_000
}