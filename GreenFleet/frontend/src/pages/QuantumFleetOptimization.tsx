import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Atom, Check, Fuel, Leaf, LoaderCircle, Plus, Route as RouteIcon, Ship, Trash2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { optimizationApi, vesselApi, voyageApi } from '../lib/api'
import { Vessel, Voyage } from '../types'
import { getEstimatedBunker, getIdealDistance, PORTS } from '../lib/ports'

type RouteInput = {
  id: string
  origin_port: string
  destination_port: string
  distance_nm: string
  cargo_weight_mt: string
  fuel_price_per_mt: string
}

type OptimizationResult = {
  assignments: Array<{
    route_id: string
    origin_port: string
    destination_port: string
    vessel_id: string
    vessel_name: string
    speed_knots: number
    fuel_type: string
    predicted_fuel_mt: number
    predicted_cost_usd: number
    predicted_co2_tonnes: number
  }>
  total_predicted_fuel_mt: number
  total_cost_usd: number
  total_co2_tonnes: number
  metrics: {
    method: 'qpso' | 'ga'
    iterations: number
    particles: number
    evaluations: number
    improvement_percent: number
    generations?: number
    runtime_ms?: number
  }
}

const FUEL_TYPES = ['VLSFO', 'MGO', 'HFO', 'LNG', 'METHANOL']
const DEFAULT_SPEEDS = '10, 12, 14, 16'

function newRoute(): RouteInput {
  return {
    id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    origin_port: '',
    destination_port: '',
    distance_nm: '',
    cargo_weight_mt: '',
    fuel_price_per_mt: '600',
  }
}

export default function QuantumFleetOptimization() {
  const [routes, setRoutes] = useState<RouteInput[]>([newRoute()])
  const [selectedVesselIds, setSelectedVesselIds] = useState<string[]>([])
  const [speeds, setSpeeds] = useState(DEFAULT_SPEEDS)
  const [fuelTypes, setFuelTypes] = useState<string[]>(FUEL_TYPES)
  const [method, setMethod] = useState<'qpso' | 'ga'>('qpso')
  const [result, setResult] = useState<OptimizationResult | null>(null)

  const { data: vessels = [] } = useQuery<Vessel[]>({
    queryKey: ['vessels'],
    queryFn: () => vesselApi.list().then((response) => response.data),
  })
  const { data: voyages = [] } = useQuery<Voyage[]>({
    queryKey: ['voyages'],
    queryFn: () => voyageApi.list().then((response) => response.data),
  })

  useEffect(() => {
    if (selectedVesselIds.length === 0 && vessels.length > 0) {
      setSelectedVesselIds([vessels[0].id])
    }
  }, [selectedVesselIds.length, vessels])

  const updateRoute = (index: number, field: keyof RouteInput, value: string) => {
    setRoutes((current) => current.map((route, routeIndex) =>
      routeIndex === index ? { ...route, [field]: value } : route
    ))
  }

  const loadVoyage = (voyageId: string) => {
    const voyage = voyages.find((item) => item.id === voyageId)
    if (!voyage) return
    setRoutes((current) => [{
      id: voyage.id,
      origin_port: voyage.origin_port,
      destination_port: voyage.destination_port,
      distance_nm: String(voyage.distance_nm ?? ''),
      cargo_weight_mt: String(voyage.cargo_weight_mt),
      fuel_price_per_mt: '600',
    }, ...current.slice(1)])
    if (voyage.vessel_id && !selectedVesselIds.includes(voyage.vessel_id)) {
      setSelectedVesselIds((current) => [...current, voyage.vessel_id])
    }
  }

  const validRoutes = routes.filter((route) => (
    route.origin_port && route.destination_port && Number(route.distance_nm) > 0 && Number(route.cargo_weight_mt) >= 0
  ))
  const parsedSpeeds = speeds.split(',').map((speed) => Number(speed.trim())).filter((speed) => Number.isFinite(speed))
  const primaryVessel = vessels.find((vessel) => selectedVesselIds.includes(vessel.id))
  const bunkerSpeed = parsedSpeeds[0] || 14
  const validInput = validRoutes.length > 0 && selectedVesselIds.length > 0 && parsedSpeeds.length > 0 && fuelTypes.length > 0

  const mutation = useMutation<OptimizationResult>({
    mutationFn: () => optimizationApi.runQpso({
      routes: validRoutes.map((route) => ({
        id: route.id,
        origin_port: route.origin_port,
        destination_port: route.destination_port,
        distance_nm: Number(route.distance_nm),
        cargo_weight_mt: Number(route.cargo_weight_mt),
        fuel_price_per_mt: Number(route.fuel_price_per_mt) || 600,
      })),
      vessel_ids: selectedVesselIds,
      speeds: parsedSpeeds,
      fuel_types: fuelTypes,
      method,
      iterations: 30,
      particles: 20,
    }).then((response) => response.data),
    onSuccess: (data) => {
      setResult(data)
      toast.success('QPSO optimization complete')
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'QPSO optimization failed'),
  })

  const toggleFuel = (fuel: string) => {
    setFuelTypes((current) => current.includes(fuel)
      ? current.filter((item) => item !== fuel)
      : [...current, fuel]
    )
  }

  return (
    <div className="page-shell space-y-8">
      <div className="gf-enter">
        <p className="eyebrow mb-2">Quantum decision support</p>
        <h1 className="page-title">Quantum Fleet Optimization</h1>
        <p className="muted mt-2">Optimize vessel, speed, and fuel assignments using the live GreenFleet prediction model.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-6">
        <section className="card space-y-5">
          <div className="flex items-center justify-between">
            <div><p className="label">Voyage inputs</p><h2 className="text-lg font-semibold">Routes to optimize</h2></div>
            <button className="btn-secondary gap-2 text-xs" onClick={() => setRoutes((current) => [...current, newRoute()])}><Plus size={15} /> Add route</button>
          </div>

          {voyages.length > 0 && (
            <div>
              <label className="label">Load an existing voyage</label>
              <select className="input" defaultValue="" onChange={(event) => loadVoyage(event.target.value)}>
                <option value="">Select a voyage to populate a route...</option>
                {voyages.map((voyage) => <option key={voyage.id} value={voyage.id}>{voyage.origin_port} to {voyage.destination_port}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-4">
            {routes.map((route, index) => (
              <div key={route.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#76dbe2]">Route {index + 1}</span>{routes.length > 1 && <button className="text-[#8d9b99] hover:text-[#ff7e83]" title="Remove route" onClick={() => setRoutes((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Origin port</label><select className="input" value={route.origin_port} onChange={(event) => { const origin = event.target.value; setRoutes((current) => current.map((item, routeIndex) => routeIndex === index ? { ...item, origin_port: origin, distance_nm: getIdealDistance(origin, item.destination_port) } : item)) }}><option value="">Select origin port...</option>{PORTS.map((port) => <option key={port.code} value={port.code}>{port.name} ({port.code})</option>)}</select></div>
                  <div><label className="label">Destination port</label><select className="input" value={route.destination_port} onChange={(event) => { const destination = event.target.value; setRoutes((current) => current.map((item, routeIndex) => routeIndex === index ? { ...item, destination_port: destination, distance_nm: getIdealDistance(item.origin_port, destination) } : item)) }}><option value="">Select destination port...</option>{PORTS.map((port) => <option key={port.code} value={port.code}>{port.name} ({port.code})</option>)}</select></div>
                  <div><label className="label">Distance (NM)</label><input type="number" className="input" value={route.distance_nm} placeholder="Select both ports" readOnly aria-readonly="true" /></div>
                  <div><label className="label">Cargo (MT)</label><input type="number" className="input" value={route.cargo_weight_mt} placeholder="45000" onChange={(event) => updateRoute(index, 'cargo_weight_mt', event.target.value)} /></div>
                  <div><label className="label">Estimated bunker (MT)</label><input type="number" className="input" value={primaryVessel ? getEstimatedBunker(route.distance_nm, route.cargo_weight_mt, bunkerSpeed, primaryVessel.engine_power_kw || 12000, primaryVessel.deadweight_tonnage || 75000).toFixed(2) : ''} placeholder="Select a vessel and complete route" readOnly aria-readonly="true" /></div>
                  <div><label className="label">Fuel price (USD/MT)</label><input type="number" className="input" value={route.fuel_price_per_mt} onChange={(event) => updateRoute(index, 'fuel_price_per_mt', event.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-5">
          <div><p className="label">Fleet search space</p><h2 className="text-lg font-semibold">Allowed assignments</h2></div>
          <div>
            <label className="label">Vessels</label>
            <div className="max-h-52 overflow-auto space-y-2 pr-1">
              {vessels.map((vessel) => <label key={vessel.id} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${selectedVesselIds.includes(vessel.id) ? 'border-[#55d58a]/40 bg-[#55d58a]/10' : 'border-white/10 bg-white/[0.02]'}`}><input type="checkbox" checked={selectedVesselIds.includes(vessel.id)} onChange={() => setSelectedVesselIds((current) => current.includes(vessel.id) ? current.filter((id) => id !== vessel.id) : [...current, vessel.id])} /><Ship size={16} className="text-[#76dbe2]" /><span className="min-w-0 flex-1"><span className="block text-sm truncate">{vessel.name}</span><span className="block text-xs text-[#62706f]">{vessel.vessel_type} | {vessel.design_speed_knots ?? 'speed n/a'} kn</span></span>{selectedVesselIds.includes(vessel.id) && <Check size={15} className="text-[#70e5a0]" />}</label>)}
              {vessels.length === 0 && <p className="text-sm text-[#8d9b99]">No active vessels available.</p>}
            </div>
          </div>
          <div><label className="label">Available speeds (knots, comma separated)</label><input className="input" value={speeds} onChange={(event) => setSpeeds(event.target.value)} /></div>
          <div><label className="label">Fuel types</label><div className="flex flex-wrap gap-2">{FUEL_TYPES.map((fuel) => <button key={fuel} className={`rounded-lg border px-3 py-2 text-xs transition-colors ${fuelTypes.includes(fuel) ? 'border-[#55d58a]/40 bg-[#55d58a]/10 text-[#70e5a0]' : 'border-white/10 text-[#8d9b99]'}`} onClick={() => toggleFuel(fuel)}><Fuel size={13} className="inline mr-1" />{fuel}</button>)}</div></div>
          <div><label className="label">Optimization method</label><div className="grid grid-cols-2 gap-2"><button className={`rounded-lg border px-3 py-2 text-sm ${method === 'qpso' ? 'border-[#53c8d2]/50 bg-[#53c8d2]/10 text-[#76dbe2]' : 'border-white/10 text-[#8d9b99]'}`} onClick={() => setMethod('qpso')}>QPSO</button><button className={`rounded-lg border px-3 py-2 text-sm ${method === 'ga' ? 'border-[#55d58a]/50 bg-[#55d58a]/10 text-[#70e5a0]' : 'border-white/10 text-[#8d9b99]'}`} onClick={() => setMethod('ga')}>Classical GA</button></div></div>
          <button className="btn-primary w-full gap-2" disabled={!validInput || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle size={17} className="animate-spin" /> : <Zap size={17} />}{mutation.isPending ? `Running ${method === 'ga' ? 'GA' : 'QPSO'} optimization...` : `Run ${method === 'ga' ? 'Classical GA' : 'QPSO'} Optimization`}</button>
          {!validInput && <p className="text-xs text-[#ffb46b]">Choose at least one valid route, vessel, speed, and fuel type.</p>}
        </section>
      </div>

      {result && <section className="card space-y-5 gf-enter">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#55d58a]/10 border border-[#55d58a]/20"><Atom size={20} className="text-[#70e5a0]" /></div><div><p className="eyebrow mb-1">{result.metrics.method === 'ga' ? 'Classical GA Result' : 'QPSO Result'}</p><h2 className="text-xl font-semibold">Recommended fleet plan</h2></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="label">Fuel consumption</p><p className="text-2xl font-semibold">{result.total_predicted_fuel_mt.toLocaleString()} MT</p></div><div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="label">Total cost</p><p className="text-2xl font-semibold text-[#70e5a0]">${result.total_cost_usd.toLocaleString()}</p></div><div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="label">CO2 emissions</p><p className="text-2xl font-semibold text-[#76dbe2]">{result.total_co2_tonnes.toLocaleString()} t</p></div></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[#62706f]"><tr><th className="py-3 pr-4">Route</th><th className="py-3 pr-4">Best vessel</th><th className="py-3 pr-4">Optimal speed</th><th className="py-3 pr-4">Fuel</th><th className="py-3 pr-4">Fuel consumption</th><th className="py-3">Cost</th></tr></thead><tbody>{result.assignments.map((assignment) => <tr key={assignment.route_id} className="border-b border-white/[0.06] last:border-0"><td className="py-3 pr-4">{assignment.origin_port} to {assignment.destination_port}</td><td className="py-3 pr-4">{assignment.vessel_name}</td><td className="py-3 pr-4">{assignment.speed_knots} kn</td><td className="py-3 pr-4 text-[#70e5a0]">{assignment.fuel_type}</td><td className="py-3 pr-4">{assignment.predicted_fuel_mt} MT</td><td className="py-3">${assignment.predicted_cost_usd.toLocaleString()}</td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap gap-4 text-xs text-[#8d9b99]"><span className="flex items-center gap-1.5"><Leaf size={14} className="text-[#70e5a0]" />{result.total_co2_tonnes.toLocaleString()} t CO2</span><span className="flex items-center gap-1.5"><RouteIcon size={14} className="text-[#76dbe2]" />{result.metrics.evaluations} candidate evaluations</span><span className="flex items-center gap-1.5"><Zap size={14} className="text-[#ffcf70]" />{result.metrics.method === 'ga' ? `${result.metrics.generations} generations` : `${result.metrics.iterations} QPSO iterations`}</span><span>{result.metrics.improvement_percent}% cost improvement</span>{result.metrics.runtime_ms ? <span>{result.metrics.runtime_ms} ms runtime</span> : null}</div>
      </section>}
    </div>
  )
}