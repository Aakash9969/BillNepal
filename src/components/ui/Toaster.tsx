import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheckBig, CircleAlert, Info, X } from 'lucide-react'
import { useApp } from '@/store'
import type { ToastMsg } from '@/types'
import { cn } from '@/lib/cn'

const ICONS = {
  success: <CircleCheckBig size={18} className="text-mint-300" />,
  error: <CircleAlert size={18} className="text-crimson-300" />,
  warning: <CircleAlert size={18} className="text-amber-400" />,
  info: <Info size={18} className="text-sky-300" />,
}

const EDGES = {
  success: 'border-mint-400/30',
  error: 'border-crimson-500/40',
  warning: 'border-amber-400/30',
  info: 'border-sky-500/30',
}

function Toast({ msg }: { msg: ToastMsg }) {
  const dismiss = useApp((s) => s.dismissToast)
  useEffect(() => {
    const id = setTimeout(() => dismiss(msg.id), 4200)
    return () => clearTimeout(id)
  }, [msg.id, dismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 80 || info.velocity.x > 500) dismiss(msg.id)
      }}
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border bg-ink-850/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur',
        EDGES[msg.kind]
      )}
    >
      <span className="mt-0.5 shrink-0">{ICONS[msg.kind]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold leading-snug text-fog-100">{msg.title}</p>
        {msg.desc && <p className="mt-0.5 text-xs leading-snug text-fog-400">{msg.desc}</p>}
      </div>
      <button
        aria-label="Dismiss notification"
        onClick={() => dismiss(msg.id)}
        className="shrink-0 rounded-md p-1 text-fog-500 transition-colors hover:bg-ink-750 hover:text-fog-200"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function Toaster() {
  const toasts = useApp((s) => s.toasts)
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2.5"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} msg={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
