import { CIIGrade } from '../types'
import clsx from 'clsx'

const gradeStyles: Record<CIIGrade, string> = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  D: 'bg-orange-100 text-orange-800 border-orange-200',
  E: 'bg-red-100 text-red-800 border-red-200',
  unknown: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default function CIIBadge({ grade, size = 'sm' }: { grade: CIIGrade; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center border rounded font-bold',
        gradeStyles[grade],
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-lg px-3 py-1'
      )}
    >
      {grade === 'unknown' ? '–' : grade}
    </span>
  )
}
