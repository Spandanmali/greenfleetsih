import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Activity, Gauge, LineChart as LineChartIcon, LoaderCircle, Ship, Timer } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import { optimizationApi, vesselApi } from '../lib/api'
import { Vessel } from '../types'
import { PORTS, getIdealDistance } from '../lib/ports'
import { FUEL_TYPES } from '../lib/fuels'
import { formatUsd } from '../lib/format'

type RouteInput = {
  id: string
  origin_port: string
  destination_port: string
  distance_nm: string
  cargo_weight_mt: string
  fuel_price_per_mt: string
}

type BenchmarkResult = {
  qpso: { final_cost_usd: number; convergence: number[]; runtime_ms: number; initialization_signature: string }
  ga: { final_cost_usd: number; convergence: number[]; runtime_ms: number; initialization_signature: string }
  iterations: number
  particles: number
}

const defaultRoute: RouteInput = {
  id: 'benchmark-route',
  origin_port: 'SGSIN',
  destination_port: 'NLRTM',
  distance_nm: String(getIdealDistance('SGSIN', 'NLRTM')),
  cargo_weight_mt: '45000',
  fuel_price_per_mt: '600',
}

const demoVesselNames = [
  'MV Aurora 01',
  'MV Blue Horizon 03',
  'MV Coral Wave 09',
  'MV Emerald Tide 04',
  'MV Green Meridian 08',
  'MV North Star 05',
  'MV Ocean Crest 02',
  'MV Pacific Dawn 06',
]

export default function AlgorithmBenchmark() {
  const [route, setRoute] = useState<RouteInput>(defaultRoute)
  const [selectedVesselIds, setSelectedVesselIds] = useState<string[]>([])
  const [speeds, setSpeeds] = useState('10, 12, 14, 16')
  const [fuelTypes, setFuelTypes] = useState(FUEL_TYPES)
  const [result, setResult] = useState<BenchmarkResult | null>(null)

  const { data: vessels = [] } = useQuery<Vessel[]>({
    queryKey: ['vessels'],
    queryFn: () => vesselApi.list().then((response) => response.data),
  })

  useEffect(() => {
    if (selectedVesselIds.length === 0 && vessels.length > 0) {
      const demoVessels = vessels.filter((vessel) => demoVesselNames.includes(vessel.name))
      setSelectedVesselIds((demoVessels.length > 0 ? demoVessels : vessels.slice(0, 1)).map((vessel) => vessel.id))
    }
  }, [selectedVesselIds.length, vessels])

  const parsedSpeeds = speeds.split(',').map((value) => Number(value.trim())).filter(Number.isFinite)
  const validInput = Boolean(route.origin_port && route.destination_port && Number(route.distance_nm) > 0 && Number(route.cargo_weight_mt) >= 0 && selectedVesselIds.length && parsedSpeeds.length && fuelTypes.length)

  const mutation = useMutation<BenchmarkResult>({
    mutationFn: () => optimizationApi.benchmark({
        routes: [{ ...route, distance_nm: Number(route.distance_nm), cargo_weight_mt: Number(route.cargo_weight_mt) }],
      vessel_ids: selectedVesselIds,
      speeds: parsedSpeeds,
      fuel_types: fuelTypes,
      iterations: 30,
      particles: 20,
    }).then((response) => response.data),
    onSuccess: (data) => { setResult(data); toast.success('Algorithm benchmark complete') },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Algorithm benchmark failed'),
  })

  const qpso_history = result?.qpso.convergence ?? []
  const ga_history = result?.ga.convergence ?? []

  const chartData = qpso_history.map((qpsoCost, iteration) => ({ iteration, qpso: qpsoCost, ga: ga_history[iteration] }))
  const costDifference = result ? Math.abs(result.qpso.final_cost_usd - result.ga.final_cost_usd) : 0
  const better = result ? (costDifference < 1 ? 'Tie / Equivalent' : result.qpso.final_cost_usd < result.ga.final_cost_usd ? 'QPSO' : 'GA') : ''

  const updatePort = (field: 'origin_port' | 'destination_port', value: string) => {
    const next = { ...route, [field]: value }
    next.distance_nm = String(getIdealDistance(next.origin_port, next.destination_port))
    setRoute(next)
  }

  return (
    <div className="page-shell space-y-8">
      <div className="gf-enter">
        <p className="eyebrow mb-2">Optimization lab</p>
        <h1 className="page-title">Algorithm Benchmark</h1>
        <p className="muted mt-2">Compare QPSO and GA on the same fleet, routes, objective, and optimization settings.</p>
      </div>

      <section className="card space-y-5">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#53c8d2]/10 border border-[#53c8d2]/20"><LineChartIcon size={20} className="text-[#76dbe2]" /></div><div><p className="label mb-1">Identical test configuration</p><h2 className="text-lg font-semibold">Benchmark inputs</h2></div></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div><label className="label">Origin port</label><select className="input" value={route.origin_port} onChange={(event) => updatePort('origin_port', event.target.value)}>{PORTS.map((port) => <option key={port.code} value={port.code}>{port.name} ({port.code})</option>)}</select></div>
          <div><label className="label">Destination port</label><select className="input" value={route.destination_port} onChange={(event) => updatePort('destination_port', event.target.value)}>{PORTS.map((port) => <option key={port.code} value={port.code}>{port.name} ({port.code})</option>)}</select></div>
          <div><label className="label">Cargo (MT)</label><input className="input" type="number" value={route.cargo_weight_mt} onChange={(event) => setRoute({ ...route, cargo_weight_mt: event.target.value })} /></div>
        </div>
        <div>
          <label className="label">Vessels included in both runs</label>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {vessels.map((vessel) => <label key={vessel.id} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${selectedVesselIds.includes(vessel.id) ? 'border-[#55d58a]/40 bg-[#55d58a]/10' : 'border-white/10 bg-white/[0.02]'}`}><input type="checkbox" checked={selectedVesselIds.includes(vessel.id)} onChange={() => setSelectedVesselIds((current) => current.includes(vessel.id) ? current.filter((id) => id !== vessel.id) : [...current, vessel.id])} /><Ship size={15} className="text-[#76dbe2]" /><span className="text-sm truncate">{vessel.name}</span></label>)}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="label">Available speeds</label><input className="input" value={speeds} onChange={(event) => setSpeeds(event.target.value)} /></div><div><label className="label">Fuel types</label><div className="flex flex-wrap gap-2">{FUEL_TYPES.map((fuel) => <button type="button" key={fuel} className={`rounded-lg border px-3 py-2 text-xs ${fuelTypes.includes(fuel) ? 'border-[#55d58a]/40 bg-[#55d58a]/10 text-[#70e5a0]' : 'border-white/10 text-[#8d9b99]'}`} onClick={() => setFuelTypes((current) => current.includes(fuel) ? current.filter((item) => item !== fuel) : [...current, fuel])}>{fuel}</button>)}</div></div></div>
        <button className="btn-primary gap-2" disabled={!validInput || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle size={17} className="animate-spin" /> : <Activity size={17} />}{mutation.isPending ? 'Running both algorithms...' : 'Run benchmark'}</button>
      </section>

      {result && <>
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 gf-enter">
          {[['QPSO final cost', formatUsd(result.qpso.final_cost_usd)], ['GA final cost', formatUsd(result.ga.final_cost_usd)], ['QPSO time', `${result.qpso.runtime_ms} ms`], ['GA time', `${result.ga.runtime_ms} ms`], ['Better cost', better]].map(([label, value]) => <div key={label} className="card !p-4"><p className="label">{label}</p><p className="text-xl font-semibold text-[#70e5a0]">{value}</p></div>)}
        </section>
        <section className="card gf-enter gf-delay-1">
          <div className="flex items-center justify-between mb-5"><div><p className="label mb-1">Convergence history</p><h2 className="text-lg font-semibold">Best cost by iteration</h2></div><div className="flex items-center gap-2 text-xs text-[#8d9b99]"><Gauge size={15} />{result.iterations} iterations per algorithm</div></div>
          <div className="h-[360px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 18, left: 8, bottom: 8 }}><CartesianGrid stroke="rgba(255,255,255,.08)" strokeDasharray="3 3" /><XAxis dataKey="iteration" stroke="#71807e" tick={{ fill: '#8d9b99', fontSize: 11 }} label={{ value: 'Iteration', position: 'insideBottom', offset: -2, fill: '#8d9b99' }} /><YAxis stroke="#71807e" tick={{ fill: '#8d9b99', fontSize: 11 }} tickFormatter={(value) => formatUsd(Number(value))} label={{ value: 'Best Cost', angle: -90, position: 'insideLeft', fill: '#8d9b99' }} /><Tooltip contentStyle={{ background: '#101718', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10 }} formatter={(value: number) => [formatUsd(value), '']} /><Legend /><Line type="monotone" dataKey="qpso" name="QPSO" stroke="#76dbe2" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="ga" name="GA" stroke="#70e5a0" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div>
          <p className="mt-3 flex items-center gap-2 text-xs text-[#8d9b99]"><Timer size={14} />Both algorithms received the same route, vessel set, speeds, fuels, objective, iteration count, population size, and seed.</p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-[#8d9b99]"><Timer size={14} />Independent initial states: QPSO {result.qpso.initialization_signature} | GA {result.ga.initialization_signature}</p>
        </section>
      </>}
    </div>
  )
}
