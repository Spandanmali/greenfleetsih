import { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'red'
}

const colors = {
  blue:  'text-ocean-600 bg-ocean-50',
  green: 'text-fleet-green bg-green-50',
  amber: 'text-fleet-amber bg-amber-50',
  red:   'text-fleet-red bg-red-50',
}

export default function KPITile({ title, value, subtitle, icon: Icon, color = 'blue' }: Props) {
  return (
    <div className="card flex items-start gap-4">
      <div className={clsx('p-3 rounded-xl', colors[color])}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
