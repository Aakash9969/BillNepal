import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  id: T
  label: React.ReactNode
}

/** Animated segmented control with a shared layout pill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ariaLabel,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-1 rounded-full border border-line-strong bg-ink-900 p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative cursor-pointer rounded-full font-semibold transition-colors',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-[13px]',
              active ? 'text-white' : 'text-fog-400 hover:text-fog-200'
            )}
          >
            {active && (
              <motion.span
                layoutId={cn('seg-pill', ariaLabel)}
                className="absolute inset-0 rounded-full bg-crimson-500"
                transition={{ type: 'spring', stiffness: 450, damping: 34 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
