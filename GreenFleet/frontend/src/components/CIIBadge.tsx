import { CIIGrade } from '../types'
import clsx from 'clsx'

const gradeStyles: Record<CIIGrade, string> = {
  A: 'bg-[#55d58a]/10 text-[#70e5a0] border-[#55d58a]/25',
  B: 'bg-[#53c8d2]/10 text-[#76dbe2] border-[#53c8d2]/25',
  C: 'bg-[#e7b86a]/10 text-[#e7b86a] border-[#e7b86a]/25',
  D: 'bg-[#e98967]/10 text-[#e98967] border-[#e98967]/25',
  E: 'bg-[#ff7e83]/10 text-[#ff9296] border-[#ff7e83]/25',
  unknown: 'bg-white/[0.04] text-[#8d9b99] border-white/10',
}

export default function CIIBadge({ grade, size = 'sm' }: { grade: CIIGrade; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center border rounded-lg font-bold',
        gradeStyles[grade],
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-lg px-3 py-1'
      )}
    >
      {grade === 'unknown' ? '–' : grade}
    </span>
  )
}
