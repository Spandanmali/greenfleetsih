import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download } from 'lucide-react'
import { vesselApi } from '../lib/api'
import { Vessel } from '../types'
import toast from 'react-hot-toast'

export default function Reports() {
  const [selectedVessels, setSelectedVessels] = useState<string[]>([])
  const [reportType, setReportType] = useState('cii_annual')
  const [year, setYear] = useState(new Date().getFullYear().toString())

  const { data: vessels = [] } = useQuery<Vessel[]>({
    queryKey: ['vessels'],
    queryFn: () => vesselApi.list().then((r) => r.data),
  })

  function toggleVessel(id: string) {
    setSelectedVessels((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  function generateReport() {
    toast('Report generation requires backend PDF service — coming in Phase 1 completion.', { icon: 'ℹ️' })
  }

  const reportTypes = [
    { value: 'cii_annual', label: 'CII Annual Report (IMO MEPC.337(76))' },
    { value: 'marpol_dcs', label: 'MARPOL DCS Fuel Consumption Report' },
    { value: 'fuel_summary', label: 'Fleet Fuel Summary' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
      <p className="text-gray-500 text-sm mb-8">Generate IMO-compliant compliance and fuel reports</p>

      <div className="grid grid-cols-3 gap-6">
        {/* Report config */}
        <div className="col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">Report Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Report Type</label>
                <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  {reportTypes.map((rt) => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Reporting Year</label>
                <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
                  {[2026, 2025, 2024, 2023].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Select Vessels</label>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  <div
                    className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 text-sm text-ocean-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedVessels(selectedVessels.length === vessels.length ? [] : vessels.map((v) => v.id))}
                  >
                    {selectedVessels.length === vessels.length ? 'Deselect all' : 'Select all'}
                  </div>
                  {vessels.map((v) => (
                    <label key={v.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVessels.includes(v.id)}
                        onChange={() => toggleVessel(v.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{v.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">IMO {v.imo_number}</span>
                    </label>
                  ))}
                  {vessels.length === 0 && (
                    <div className="px-3 py-4 text-gray-400 text-sm">No vessels registered</div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{selectedVessels.length} vessel(s) selected</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={generateReport}
                disabled={selectedVessels.length === 0}
              >
                <Download size={16} />
                Generate PDF
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Report info panel */}
        <div className="space-y-4">
          <div className="card bg-ocean-50 border-ocean-100">
            <FileText size={24} className="text-ocean-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">CII Annual Report</h3>
            <p className="text-sm text-gray-600">
              Per IMO MEPC.337(76). Includes attained CII, required CII, grade (A–E),
              CO₂ emissions, and transport work for each vessel for the reporting year.
            </p>
            <div className="mt-4 space-y-1 text-xs text-gray-500">
              <p>✓ MARPOL Annex VI compliant</p>
              <p>✓ CII grades per vessel class boundaries</p>
              <p>✓ IMO 4th GHG Study emission factors</p>
              <p>✓ Well-to-Wake ready (Phase 2)</p>
            </div>
          </div>

          <div className="card border-amber-100 bg-amber-50">
            <p className="text-sm text-amber-800 font-medium">Phase 1 Status</p>
            <p className="text-xs text-amber-700 mt-1">
              PDF export requires ReportLab integration — ships with Phase 1 final build.
              CII calculation API is fully operational now.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
