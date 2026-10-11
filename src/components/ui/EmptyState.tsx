import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Gentle empty state with floating icon. */
export function EmptyState({
  icon,
  title,
  hint,
  className,
  children,
}: {
  icon: ReactNode
  title: string
  hint?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      <div className="float-soft grid h-16 w-16 place-items-center rounded-2xl border border-line-strong bg-ink-800 text-fog-400">
        {icon}
      </div>
      <p className="text-[15px] font-semibold text-fog-200">{title}</p>
      {hint && <p className="max-w-xs text-[13px] text-fog-500">{hint}</p>}
      {children}
    </div>
  )
}
