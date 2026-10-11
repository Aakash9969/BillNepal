import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type Tone = 'neutral' | 'crimson' | 'gold' | 'mint' | 'amber' | 'sky' | 'violet' | 'danger'

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-750 text-fog-300 border-line-strong',
  crimson: 'bg-crimson-500/12 text-crimson-300 border-crimson-500/30',
  gold: 'bg-gold-400/12 text-gold-300 border-gold-400/30',
  mint: 'bg-mint-400/12 text-mint-300 border-mint-400/30',
  amber: 'bg-amber-400/12 text-amber-400 border-amber-400/30',
  sky: 'bg-sky-500/12 text-sky-300 border-sky-500/30',
  violet: 'bg-violet-500/12 text-violet-300 border-violet-500/30',
  danger: 'bg-crimson-700/25 text-crimson-300 border-crimson-500/40',
}

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 tracking-tight',
        TONES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
