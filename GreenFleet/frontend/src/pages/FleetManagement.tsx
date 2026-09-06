import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Ship, Search } from 'lucide-react'
import { vesselApi } from '../lib/api'
import { Vessel, VesselType } from '../types'
import CIIBadge from '../components/CIIBadge'
import { getStoredUser, canWrite } from '../lib/auth'
import toast from 'react-hot-toast'
import { FUEL_TYPES, fuelLabel } from '../lib/fuels'

const VESSEL_TYPES: VesselType[] = ['bulk_carrier', 'container_ship', 'tanker', 'general_cargo', 'roro', 'cruise', 'other']

function AddVesselModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    imo_number: '', name: '', vessel_type: 'bulk_carrier' as VesselType,
    flag_state: '', gross_tonnage: '', deadweight_tonnage: '',
    engine_power_kw: '', design_speed_knots: '', build_year: '', fuel_type: 'VLSFO',
  })

  const mutation = useMutation({
    mutationFn: () => vesselApi.create({
      ...form,
      gross_tonnage: form.gross_tonnage ? Number(form.gross_tonnage) : null,
      deadweight_tonnage: form.deadweight_tonnage ? Number(form.deadweight_tonnage) : null,
      engine_power_kw: form.engine_power_kw ? Number(form.engine_power_kw) : null,
      design_speed_knots: form.design_speed_knots ? Number(form.design_speed_knots) : null,
      build_year: form.build_year ? Number(form.build_year) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vessels'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Vessel added successfully')
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add vessel'),
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#151c1d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <p className="eyebrow mb-2">Fleet registry</p><h2 className="text-lg font-semibold mb-4">Add new vessel</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['IMO Number', 'imo_number', 'text', '1234567'],
            ['Vessel Name', 'name', 'text', 'MV Example'],
            ['Flag State', 'flag_state', 'text', 'PAN'],
            ['Fuel Type', 'fuel_type', 'select', 'VLSFO'],
            ['Gross Tonnage', 'gross_tonnage', 'number', ''],
            ['Deadweight Tonnage', 'deadweight_tonnage', 'number', ''],
            ['Engine Power (kW)', 'engine_power_kw', 'number', ''],
            ['Design Speed (kn)', 'design_speed_knots', 'number', ''],
            ['Build Year', 'build_year', 'number', ''],
          ].map(([label, key, type, placeholder]) => (
            <div key={key}>
              <label className="label">{label}</label>
              {type === 'select' ? (
                <select className="input" value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}>
                  {FUEL_TYPES.map((fuel) => <option key={fuel} value={fuel}>{fuelLabel(fuel)}</option>)}
                </select>
              ) : <input type={type} className="input" placeholder={placeholder} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />}
            </div>
          ))}
          <div>
            <label className="label">Vessel Type</label>
            <select
              className="input"
              value={form.vessel_type}
              onChange={(e) => setForm((f) => ({ ...f, vessel_type: e.target.value as VesselType }))}
            >
              {VESSEL_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary flex-1"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.imo_number || !form.name}
          >
            {mutation.isPending ? 'Adding…' : 'Add Vessel'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FleetManagement() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data: vessels = [], isLoading } = useQuery<Vessel[]>({
    queryKey: ['vessels'],
    queryFn: () => vesselApi.list().then((r) => r.data),
  })

  const filtered = vessels.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.imo_number.includes(search)
  )

  return (
    <div className="page-shell">
      {showAdd && <AddVesselModal onClose={() => setShowAdd(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow mb-2">Asset intelligence</p><h1 className="page-title">Fleet management</h1>
          <p className="muted mt-2">{vessels.length} vessels registered across your operating fleet</p>
        </div>
        {canWrite(user) && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            Add Vessel
          </button>
        )}
      </div>

      <div className="card mb-6 bg-[#111819]/80">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or IMO number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="muted text-center py-12">Loading vessels…</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.08]">
              <tr>
                {['Vessel', 'IMO', 'Type', 'DWT (MT)', 'Speed (kn)', 'CII Grade', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#71807e] uppercase tracking-[0.12em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#62706f]">
                    {search ? 'No vessels match your search' : 'No vessels yet — add your first vessel above'}
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => navigate(`/fleet/${v.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Ship size={16} className="text-[#53c8d2] shrink-0" />
                        <span className="font-medium text-[#e5eeeb]">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8d9b99]">{v.imo_number}</td>
                    <td className="px-4 py-3 capitalize text-[#8d9b99]">{v.vessel_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-[#8d9b99]">{v.deadweight_tonnage?.toLocaleString() ?? '–'}</td>
                    <td className="px-4 py-3 text-[#8d9b99]">{v.design_speed_knots ?? '–'}</td>
                    <td className="px-4 py-3"><CIIBadge grade={v.current_cii_grade} /></td>
                    <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${v.is_active ? 'bg-[#55d58a]/10 text-[#70e5a0] border-[#55d58a]/20' : 'bg-white/[0.04] text-[#8d9b99] border-white/10'}`}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#55d58a] text-xs font-medium">View →</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
