import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  footer?: ReactNode
  /** hide the default header (for custom visuals like success overlays) */
  bare?: boolean
  onExited?: () => void
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, subtitle, size = 'md', children, footer, bare, onExited }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  /* Escape closes; Tab is trapped inside the dialog */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      const inside = active instanceof Node && dialog.contains(active)
      if (e.shiftKey) {
        if (active === first || !inside) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !inside) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* move focus in on open (respecting autoFocus fields); restore it on close/unmount */
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const raf = requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog || (document.activeElement instanceof Node && dialog.contains(document.activeElement))) return
      dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    })
    return () => {
      cancelAnimationFrame(raf)
      restoreRef.current?.focus?.()
      restoreRef.current = null
    }
  }, [open])

  return (
    <AnimatePresence onExitComplete={onExited}>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.button
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default bg-ink-950/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-line-strong bg-ink-850 shadow-2xl shadow-black/60',
              SIZES[size]
            )}
          >
            {!bare && (title || subtitle) && (
              <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
                <div>
                  {title && <h2 className="text-[17px] font-bold tracking-tight text-fog-100">{title}</h2>}
                  {subtitle && <p className="mt-0.5 text-[13px] text-fog-400">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-fog-400 transition-colors hover:bg-ink-750 hover:text-fog-100"
                >
                  <X size={18} />
                </button>
              </header>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer && <footer className="border-t border-line bg-ink-900/60 px-6 py-4">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
