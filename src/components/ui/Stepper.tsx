import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { nepDigits } from '@/lib/nepali'

/** Quantity stepper with a bump animation on change. */
export function Stepper({
  qty,
  onChange,
  min = 0,
  max = 99,
  lang = 'en',
  size = 'md',
  className,
}: {
  qty: number
  onChange: (v: number) => void
  min?: number
  max?: number
  lang?: 'en' | 'ne'
  size?: 'sm' | 'md'
  className?: string
}) {
  const dec = () => onChange(Math.max(min, qty - 1))
  const inc = () => onChange(Math.min(max, qty + 1))
  const big = size === 'md'
  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-xl border border-line-strong bg-ink-900',
        big ? 'h-10' : 'h-8',
        className
      )}
    >
      <button
        aria-label="Decrease quantity"
        onClick={dec}
        disabled={qty <= min}
        className={cn(
          'grid place-items-center text-fog-300 transition-colors hover:bg-ink-750 hover:text-fog-100 disabled:opacity-30',
          big ? 'h-10 w-10' : 'h-8 w-8'
        )}
      >
        <Minus size={big ? 16 : 13} />
      </button>
      <span className={cn('relative grid w-9 place-items-center font-bold tabular', big ? 'text-sm' : 'text-xs')}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={qty}
            initial={{ y: 10, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="text-fog-100"
          >
            {lang === 'ne' ? nepDigits(qty) : qty}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        aria-label="Increase quantity"
        onClick={inc}
        disabled={qty >= max}
        className={cn(
          'grid place-items-center text-fog-300 transition-colors hover:bg-ink-750 hover:text-fog-100 disabled:opacity-30',
          big ? 'h-10 w-10' : 'h-8 w-8'
        )}
      >
        <Plus size={big ? 16 : 13} />
      </button>
    </div>
  )
}
