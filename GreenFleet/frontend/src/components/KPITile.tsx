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
  blue:  'text-[#53c8d2] bg-[#53c8d2]/10 border-[#53c8d2]/20',
  green: 'text-[#55d58a] bg-[#55d58a]/10 border-[#55d58a]/20',
  amber: 'text-[#e7b86a] bg-[#e7b86a]/10 border-[#e7b86a]/20',
  red:   'text-[#ff7e83] bg-[#ff7e83]/10 border-[#ff7e83]/20',
}

export default function KPITile({ title, value, subtitle, icon: Icon, color = 'blue' }: Props) {
  return (
    <div className="card flex items-start gap-4 transition-transform hover:-translate-y-0.5">
      <div className={clsx('p-3 rounded-xl border', colors[color])}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-[#8d9b99]">{title}</p>
        <p className="text-2xl font-semibold tracking-tight text-[#f4f7f6] mt-1">{value}</p>
        {subtitle && <p className="text-xs text-[#62706f] mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
