import { useQuery } from '@tanstack/react-query'
import { Ship, Fuel, Activity, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { dashboardApi } from '../lib/api'
import { DashboardSummary, CIIGrade } from '../types'
import KPITile from '../components/KPITile'
import CIIBadge from '../components/CIIBadge'

const CII_COLORS: Record<string, string> = {
  A: '#16a34a', B: '#059669', C: '#d97706', D: '#ea580c', E: '#dc2626'
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.summary().then((r) => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-gray-400">Loading fleet data…</div>
      </div>
    )
  }

  const ciiData = Object.entries(data?.cii_distribution ?? {}).map(([grade, count]) => ({
    name: `Grade ${grade}`,
    value: count,
    grade,
  })).filter((d) => d.value > 0)

  const atRiskVessels = (data?.cii_distribution?.D ?? 0) + (data?.cii_distribution?.E ?? 0)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time fleet performance overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KPITile
          title="Active Vessels"
          value={data?.total_vessels ?? 0}
          icon={Ship}
          color="blue"
        />
        <KPITile
          title="Grade A/B Vessels"
          value={(data?.cii_distribution?.A ?? 0) + (data?.cii_distribution?.B ?? 0)}
          subtitle="CII compliant"
          icon={Activity}
          color="green"
        />
        <KPITile
          title="At-Risk Vessels"
          value={atRiskVessels}
          subtitle="Grade D or E"
          icon={AlertTriangle}
          color={atRiskVessels > 0 ? 'red' : 'green'}
        />
        <KPITile
          title="Fuel Predictions"
          value="Active"
          subtitle="ML model v1.0"
          icon={Fuel}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* CII Distribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">CII Grade Distribution</h2>
          {ciiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ciiData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ grade, value }) => `${grade}: ${value}`}>
                  {ciiData.map((entry) => (
                    <Cell key={entry.grade} fill={CII_COLORS[entry.grade] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No vessels registered yet
            </div>
          )}
        </div>

        {/* Recent Voyages */}
        <div className="card col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Voyages</h2>
          {(data?.recent_voyages ?? []).length === 0 ? (
            <div className="text-gray-400 text-sm">No voyages recorded yet</div>
          ) : (
            <div className="space-y-3">
              {data!.recent_voyages.map((v) => {
                const variance = v.actual_fuel_mt && v.predicted_fuel_mt
                  ? ((v.actual_fuel_mt - v.predicted_fuel_mt) / v.predicted_fuel_mt * 100).toFixed(1)
                  : null
                return (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{v.origin} → {v.destination}</p>
                      <p className="text-xs text-gray-400">{v.created_at?.slice(0, 10)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === 'completed' ? 'bg-green-100 text-green-700' :
                        v.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{v.status}</span>
                      {variance && (
                        <p className={`text-xs mt-1 ${parseFloat(variance) > 5 ? 'text-red-500' : 'text-gray-500'}`}>
                          {parseFloat(variance) > 0 ? '+' : ''}{variance}% vs predicted
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fleet vessel cards */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-4">Fleet Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(data?.vessels ?? []).map((v) => (
            <div key={v.id} className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <Ship size={18} className="text-ocean-500 mt-0.5" />
                <CIIBadge grade={v.cii_grade as CIIGrade} />
              </div>
              <p className="font-semibold text-gray-800 text-sm truncate">{v.name}</p>
              <p className="text-xs text-gray-400">{v.imo_number}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{v.vessel_type.replace('_', ' ')}</p>
            </div>
          ))}
          {(data?.vessels ?? []).length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No vessels registered. Add your first vessel in Fleet Management.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
