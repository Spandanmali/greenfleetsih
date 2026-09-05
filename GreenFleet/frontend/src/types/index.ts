export type UserRole = 'admin' | 'full_access' | 'partial_access'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export type VesselType = 'bulk_carrier' | 'container_ship' | 'tanker' | 'general_cargo' | 'roro' | 'cruise' | 'other'
export type CIIGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'unknown'

export interface Vessel {
  id: string
  imo_number: string
  name: string
  vessel_type: VesselType
  flag_state: string | null
  gross_tonnage: number | null
  deadweight_tonnage: number | null
  engine_power_kw: number | null
  design_speed_knots: number | null
  fuel_type: string
  build_year: number | null
  current_cii_grade: CIIGrade
  current_latitude: number | null
  current_longitude: number | null
  is_active: boolean
  created_at: string
}

export type VoyageStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export interface Voyage {
  id: string
  vessel_id: string
  origin_port: string
  destination_port: string
  cargo_weight_mt: number
  cargo_type: string | null
  distance_nm: number | null
  cruising_speed_knots: number | null
  fuel_type: string
  departure_time: string | null
  arrival_time: string | null
  status: VoyageStatus
  actual_fuel_consumed_mt: number | null
  predicted_fuel_consumed_mt: number | null
  co2_emitted_tonnes: number | null
  created_at: string
}

export interface SpeedPoint {
  speed_knots: number
  fuel_mt: number
  cost_usd: number
}

export interface FuelPrediction {
  id: string
  vessel_id: string
  origin_port: string
  destination_port: string
  distance_nm: number
  cargo_weight_mt: number
  cruising_speed_knots: number
  fuel_type: string
  predicted_fuel_mt: number
  confidence_lower: number
  confidence_upper: number
  predicted_cost_usd: number
  predicted_co2_tonnes: number
  fuel_price_per_mt: number
  speed_sensitivity: SpeedPoint[]
  model_version: string
  created_at: string
}

export interface DashboardSummary {
  total_vessels: number
  cii_distribution: Record<CIIGrade, number>
  recent_voyages: Array<{
    id: string
    vessel_id: string
    origin: string
    destination: string
    status: VoyageStatus
    predicted_fuel_mt: number | null
    actual_fuel_mt: number | null
    created_at: string
  }>
  vessels: Array<{
    id: string
    imo_number: string
    name: string
    vessel_type: VesselType
    cii_grade: CIIGrade
    latitude: number | null
    longitude: number | null
  }>
}
