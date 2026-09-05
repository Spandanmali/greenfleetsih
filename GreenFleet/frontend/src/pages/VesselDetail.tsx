import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Ship } from 'lucide-react'
import { vesselApi, ciiApi, voyageApi } from '../lib/api'
import { Vessel, Voyage } from '../types'
import CIIBadge from '../components/CIIBadge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function VesselDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: vessel } = useQuery<Vessel>({
    queryKey: ['vessel', id],
    queryFn: () => vesselApi.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: ciiHistory = [] } = useQuery({
    queryKey: ['cii-history', id],
    queryFn: () => ciiApi.history(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: voyages = [] } = useQuery<Voyage[]>({
    queryKey: ['voyages', id],
    queryFn: () => voyageApi.list(id).then((r) => r.data),
    enabled: !!id,
  })

  if (!vessel) return <div className="p-8 text-gray-400">Loading vessel…</div>

  const specs = [
    ['IMO Number', vessel.imo_number],
    ['Vessel Type', vessel.vessel_type.replace('_', ' ')],
    ['Flag State', vessel.flag_state ?? '–'],
    ['Gross Tonnage', vessel.gross_tonnage?.toLocaleString() ?? '–'],
    ['Deadweight Tonnage', vessel.deadweight_tonnage?.toLocaleString() ?? '–'],
    ['Engine Power', vessel.engine_power_kw ? `${vessel.engine_power_kw.toLocaleString()} kW` : '–'],
    ['Design Speed', vessel.design_speed_knots ? `${vessel.design_speed_knots} kn` : '–'],
    ['Primary Fuel', vessel.fuel_type],
    ['Build Year', vessel.build_year ?? '–'],
  ]

  return (
    <div className="p-8">
      <button onClick={() => navigate('/fleet')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft size={16} /> Back to Fleet
      </button>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ocean-100 rounded-xl flex items-center justify-center">
            <Ship size={24} className="text-ocean-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vessel.name}</h1>
            <p className="text-gray-500 text-sm">IMO {vessel.imo_number}</p>
          </div>
        </div>
        <CIIBadge grade={vessel.current_cii_grade} size="lg" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Vessel specs */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Vessel Specifications</h2>
          <dl className="space-y-2">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-800 capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* CII history chart */}
        <div className="card col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">CII History</h2>
          {ciiHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ciiHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line dataKey="attained_cii" name="Attained CII" stroke="#0284c7" dot />
                <Line dataKey="required_cii" name="Required CII" stroke="#d97706" strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No CII records yet. Calculate CII after adding voyage data.
            </div>
          )}
        </div>

        {/* Recent voyages */}
        <div className="card col-span-3">
          <h2 className="font-semibold text-gray-800 mb-4">Voyage History</h2>
          {voyages.length === 0 ? (
            <div className="text-gray-400 text-sm">No voyages recorded for this vessel</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  {['Route', 'Cargo (MT)', 'Speed (kn)', 'Predicted Fuel', 'Actual Fuel', 'Variance', 'Status'].map((h) => (
                    <th key={h} className="text-left pb-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {voyages.map((v) => {
                  const variance = v.actual_fuel_consumed_mt && v.predicted_fuel_consumed_mt
                    ? ((v.actual_fuel_consumed_mt - v.predicted_fuel_consumed_mt) / v.predicted_fuel_consumed_mt * 100).toFixed(1)
                    : null
                  return (
                    <tr key={v.id}>
                      <td className="py-2 font-medium">{v.origin_port} → {v.destination_port}</td>
                      <td className="py-2">{v.cargo_weight_mt.toLocaleString()}</td>
                      <td className="py-2">{v.cruising_speed_knots ?? '–'}</td>
                      <td className="py-2">{v.predicted_fuel_consumed_mt ?? '–'} MT</td>
                      <td className="py-2">{v.actual_fuel_consumed_mt ?? '–'} MT</td>
                      <td className={`py-2 ${variance && parseFloat(variance) > 5 ? 'text-red-500' : 'text-gray-500'}`}>
                        {variance ? `${parseFloat(variance) > 0 ? '+' : ''}${variance}%` : '–'}
                      </td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          v.status === 'completed' ? 'bg-green-100 text-green-700' :
                          v.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
