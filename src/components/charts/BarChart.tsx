import { motion } from 'motion/react'
import { formatBSShort } from '@/lib/nepali'
import type { Lang } from '@/types'
import { cn } from '@/lib/cn'

export interface BarDatum {
  label: string // weekday short
  sublabel: string // BS date short
  value: number
  highlight?: boolean
}

/** 7-day revenue bar chart — CSS columns with animated growth. */
export function BarChart({ data, max, lang, formatValue }: { data: BarDatum[]; max: number; lang: Lang; formatValue: (n: number) => string }) {
  const safeMax = Math.max(max, 1)
  void formatBSShort
  void lang
  return (
    <div className="flex h-44 items-end gap-2.5 sm:gap-3">
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / safeMax) * 100)
        const isToday = d.highlight
        return (
          <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full whitespace-nowrap rounded-lg border border-line-strong bg-ink-850 px-2.5 py-1.5 text-[11px] font-semibold text-fog-100 shadow-xl group-hover:block">
              <span className="tabular">{formatValue(d.value)}</span>
              <span className="ml-1.5 text-fog-500">{d.sublabel}</span>
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ type: 'spring', stiffness: 190, damping: 22, delay: 0.05 + i * 0.05 }}
              className={cn(
                'w-full max-w-10 rounded-t-lg border-t transition-colors',
                isToday
                  ? 'bg-gradient-to-t from-crimson-600/80 to-crimson-400 border-crimson-300/60'
                  : 'bg-gradient-to-t from-ink-700 to-ink-600 border-line-strong group-hover:from-ink-600 group-hover:to-ink-500'
              )}
            />
            <div className="text-center">
              <p className={cn('text-[11px] font-bold', isToday ? 'text-crimson-300' : 'text-fog-400')}>{d.label}</p>
              <p className="text-[10px] text-fog-500">{d.sublabel}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
