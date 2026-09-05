import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Fuel, TrendingDown, DollarSign, Wind } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { vesselApi, predictionApi } from '../lib/api'
import { Vessel, FuelPrediction } from '../types'
import toast from 'react-hot-toast'

const PORTS = [
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

const getIdealDistance = (originCode: string, destinationCode: string) => {
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

export default function FuelPredictionPage() {
  const [form, setForm] = useState({
    vessel_id: '',
    origin_port: '',
    destination_port: '',
    distance_nm: '',
    cargo_weight_mt: '',
    cruising_speed_knots: '',
    fuel_type: 'VLSFO',
    fuel_price_per_mt: '600',
  })
  const [result, setResult] = useState<FuelPrediction | null>(null)

  const { data: vessels = [] } = useQuery<Vessel[]>({
    queryKey: ['vessels'],
    queryFn: () => vesselApi.list().then((r) => r.data),
  })

  const selectedVessel = vessels.find((vessel) => vessel.id === form.vessel_id)
  const hasRequiredFields = Boolean(
    selectedVessel && form.origin_port && form.destination_port && form.distance_nm
      && form.cargo_weight_mt && form.cruising_speed_knots
  )
  const loadFactor = Number(form.cargo_weight_mt) / Math.max(selectedVessel?.deadweight_tonnage || 75000, 1)
  const bunkerEstimate = hasRequiredFields
    ? (selectedVessel?.engine_power_kw || 12000)
      * (Math.max(Number(form.cruising_speed_knots), 1) / 14) ** 3 * loadFactor * 185
      * (Number(form.distance_nm) / Math.max(Number(form.cruising_speed_knots), 1)) / 1_000_000
    : 0

  const mutation = useMutation({
    mutationFn: () =>
      predictionApi.run({
        ...form,
        distance_nm: Number(form.distance_nm),
        cargo_weight_mt: Number(form.cargo_weight_mt),
        cruising_speed_knots: Number(form.cruising_speed_knots),
        fuel_price_per_mt: Number(form.fuel_price_per_mt),
      }),
    onSuccess: (res) => {
      setResult(res.data)
      toast.success('Prediction complete')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Prediction failed'),
  })

  const isValid = form.vessel_id && form.distance_nm && form.cargo_weight_mt && form.cruising_speed_knots

  return (
    <div className="page-shell">
      <p className="eyebrow mb-2">AI voyage intelligence</p><h1 className="page-title mb-2">Fuel consumption prediction</h1>
      <p className="muted mb-8">Model fuel, cost and emissions before every voyage</p>

      <div className="grid grid-cols-2 gap-8">
        {/* Input form */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-[#e5eeeb] mb-2">Voyage parameters</h2>

          <div>
            <label className="label">Vessel</label>
            <select
              className="input"
              value={form.vessel_id}
              onChange={(e) => setForm((f) => ({ ...f, vessel_id: e.target.value }))}
            >
              <option value="">Select vessel…</option>
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.imo_number})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Origin Port</label>
              <select className="input" value={form.origin_port}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  origin_port: e.target.value,
                  distance_nm: getIdealDistance(e.target.value, f.destination_port),
                }))}>
                <option value="">Select origin port...</option>
                {PORTS.map((port) => (
                  <option key={port.code} value={port.code}>{port.name} ({port.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Destination Port</label>
              <select className="input" value={form.destination_port}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  destination_port: e.target.value,
                  distance_nm: getIdealDistance(f.origin_port, e.target.value),
                }))}>
                <option value="">Select destination port...</option>
                {PORTS.map((port) => (
                  <option key={port.code} value={port.code}>{port.name} ({port.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Distance (nautical miles)</label>
              <input type="number" className="input " placeholder="Select both ports" value={form.distance_nm}
                readOnly aria-readonly="true" />
            </div>
            <div>
              <label className="label">Cargo Weight (MT)</label>
              <input type="number" className="input" placeholder="e.g. 45000" value={form.cargo_weight_mt}
                onChange={(e) => setForm((f) => ({ ...f, cargo_weight_mt: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cruising Speed (knots)</label>
              <input type="number" className="input" placeholder="e.g. 13" value={form.cruising_speed_knots}
                onChange={(e) => setForm((f) => ({ ...f, cruising_speed_knots: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fuel Type</label>
              <select className="input" value={form.fuel_type}
                onChange={(e) => setForm((f) => ({ ...f, fuel_type: e.target.value }))}>
                {['VLSFO', 'MGO', 'HFO', 'LNG', 'METHANOL'].map((ft) => (
                  <option key={ft}>{ft}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Estimated Bunker (MT)</label>
            <input
              type="number"
              className="input"
              value={bunkerEstimate ? bunkerEstimate.toFixed(2) : ''}
              placeholder="Complete vessel, route, cargo, and speed"
              readOnly
              aria-readonly="true"
            />
          </div>

          <div>
            <label className="label">Bunker Price (USD/MT)</label>
            <input type="number" className="input" value={form.fuel_price_per_mt}
              onChange={(e) => setForm((f) => ({ ...f, fuel_price_per_mt: e.target.value }))} />
          </div>

          <button
            className="btn-primary w-full"
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending ? 'Running prediction…' : 'Run Fuel Prediction'}
          </button>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="card text-center">
                  <Fuel size={20} className="text-[#53c8d2] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#f4f7f6]">{result.predicted_fuel_mt}</p>
                  <p className="text-xs text-[#8d9b99]">Tonnes fuel</p>
                  <p className="text-xs text-[#62706f] mt-1">
                    {result.confidence_lower}–{result.confidence_upper} MT (90% CI)
                  </p>
                </div>
                <div className="card text-center">
                  <DollarSign size={20} className="text-[#55d58a] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#f4f7f6]">
                    ${result.predicted_cost_usd.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#8d9b99]">Estimated cost</p>
                </div>
                <div className="card text-center">
                  <Wind size={20} className="text-[#e7b86a] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#f4f7f6]">{result.predicted_co2_tonnes}</p>
                  <p className="text-xs text-[#8d9b99]">Tonnes CO₂</p>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-[#e5eeeb] mb-4">Speed sensitivity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={result.speed_sensitivity} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,158,.12)" />
                    <XAxis dataKey="speed_knots" tickFormatter={(v) => `${v}kn`} tick={{ fontSize: 11, fill: '#8d9b99' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8d9b99' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#172121', border: '1px solid rgba(148,163,158,.18)', borderRadius: 12, color: '#f4f7f6' }} formatter={(v) => [`${v} MT`, 'Fuel']} />
                    <ReferenceLine
                      x={result.cruising_speed_knots}
                      stroke="#53c8d2"
                      strokeDasharray="4 2"
                      label={{ value: 'Selected', fontSize: 10 }}
                    />
                    <Bar dataKey="fuel_mt" fill="#53c8d2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-[#62706f] mt-2 text-center">
                  Fuel consumption at ±4 knots from planned speed
                </p>
              </div>

              <div className="card">
                <h3 className="font-semibold text-[#e5eeeb] mb-3">Full speed comparison</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-[#8d9b99] border-b">
                      <th className="text-left pb-2">Speed</th>
                      <th className="text-right pb-2">Fuel (MT)</th>
                      <th className="text-right pb-2">Cost (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {result.speed_sensitivity.map((row) => (
                      <tr key={row.speed_knots} className={row.speed_knots === result.cruising_speed_knots ? 'bg-ocean-50' : ''}>
                        <td className="py-2 font-medium">{row.speed_knots} kn {row.speed_knots === result.cruising_speed_knots ? '← selected' : ''}</td>
                        <td className="py-2 text-right">{row.fuel_mt}</td>
                        <td className="py-2 text-right">${row.cost_usd.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card h-full flex items-center justify-center min-h-64">
              <div className="text-center text-[#62706f]">
                <TrendingDown size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Fill in voyage parameters and run the prediction</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
