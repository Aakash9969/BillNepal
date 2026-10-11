import { motion } from 'motion/react'
import type { PaymentMethod } from '@/types'
import { PAYMENT_META } from '@/types'

/** Payment-method donut — animated SVG arcs. */
export function Donut({
  segments,
  centerLabel,
  centerValue,
  size = 168,
}: {
  segments: { method: PaymentMethod; amount: number }[]
  centerLabel: string
  centerValue: string
  size?: number
}) {
  const total = segments.reduce((s, x) => s + x.amount, 0)
  const r = 54
  const C = 2 * Math.PI * r
  const COLORS: Record<PaymentMethod, string> = {
    cash: '#2fbe6e',
    esewa: '#60bb46',
    khalti: '#8b5cf6',
    fonepay: '#f58220',
    nepalqr: '#e8354e',
    card: '#54a9ff',
  }

  let offset = 0
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 140 140" className="shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1a2130" strokeWidth="17" />
        {segments.map((seg, i) => {
          const share = total > 0 ? seg.amount / total : 0
          const len = share * C
          const dash = `${Math.max(len - 3, 0)} ${C - Math.max(len - 3, 0)}`
          const off = -offset
          offset += len
          return (
            <motion.circle
              key={seg.method}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={COLORS[seg.method]}
              strokeWidth="17"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${C}`, strokeDashoffset: off }}
              animate={{ strokeDasharray: dash, strokeDashoffset: off }}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          )
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-fog-500">{centerLabel}</p>
          <p className="text-xl font-extrabold tracking-tight text-fog-100">{centerValue}</p>
        </div>
        <ul className="space-y-1.5">
          {segments.map((s) => {
            const meta = PAYMENT_META[s.method]
            return (
              <li key={s.method} className="flex items-center gap-2 text-[12.5px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[s.method] }} />
                <span className="truncate text-fog-300">{meta.label}</span>
                <span className="ml-auto shrink-0 font-semibold tabular text-fog-200">
                  {Math.round((s.amount / Math.max(total, 1)) * 100)}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
