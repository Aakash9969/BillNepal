import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

const baseField =
  'w-full rounded-xl border border-line-strong bg-ink-900 px-3.5 text-sm text-fog-100 placeholder:text-fog-500 transition-colors focus:border-crimson-400/60 focus:outline-none focus:ring-2 focus:ring-crimson-500/20'

export function Field({ label, hint, children, className }: { label?: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-fog-400">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-fog-500">{hint}</span>}
    </label>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, 'h-10', className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(baseField, 'min-h-[76px] resize-y py-2.5', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseField, 'h-10 cursor-pointer appearance-none bg-ink-900', className)} {...rest}>
      {children}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <span className="inline-flex items-center gap-2.5">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-crimson-400/50 bg-crimson-500/80' : 'border-line-strong bg-ink-700',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow',
            checked ? 'right-1 bg-white' : 'left-1 bg-fog-300'
          )}
        />
      </button>
      {label && (
        <label htmlFor={id} className={cn('cursor-pointer select-none text-sm text-fog-200', disabled && 'opacity-50')}>
          {label}
        </label>
      )}
    </span>
  )
}
