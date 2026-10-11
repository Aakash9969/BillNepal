import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { useApp } from '@/store'
import { translate } from '@/i18n/useT'
import { nepDigits } from '@/lib/nepali'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Dashboard } from '@/features/Dashboard'
import { Tables } from '@/features/Tables'
import { OrderView } from '@/features/OrderView'
import { Kitchen } from '@/features/Kitchen'
import { Billing } from '@/features/Billing'
import { Invoices } from '@/features/Invoices'
import { MenuManager } from '@/features/MenuManager'
import { Settings } from '@/features/Settings'
import { Login } from '@/features/Login'
import { TaxInvoice } from '@/components/invoice/TaxInvoice'

/* ── Offline-first sync engine: drains the outbox one record per tick ── */
function useSyncEngine() {
  useEffect(() => {
    const id = setInterval(() => {
      const s = useApp.getState()
      if (!s.online) return
      const hasPending = s.syncQueue.some((r) => !r.syncedAt)
      if (!hasPending) return
      const remaining = s.syncStep()
      if (remaining === 0) {
        const after = useApp.getState()
        const cutoff = Date.now() - 15_000
        const n = after.syncQueue.filter((r) => r.syncedAt && r.syncedAt > cutoff).length
        if (n > 0) {
          after.toast(
            'success',
            translate(after.lang, 'sync.doneToast', { n: after.lang === 'ne' ? nepDigits(n) : n })
          )
        }
      }
    }, 1500)
    return () => clearInterval(id)
  }, [])
}

/* ── Real connection lifecycle (listen + reconcile simulated mode) ────── */
function useConnectionEvents() {
  useEffect(() => {
    const initial = useApp.getState()
    initial.setOnline(typeof navigator === 'undefined' ? true : navigator.onLine)

    const onOnline = () => {
      const s = useApp.getState()
      const was = s.online
      s.setOnline(true)
      const now = useApp.getState().online
      if (!was && now) {
        s.toast('info', translate(s.lang, 'top.online'), translate(s.lang, 'sync.onlineToast'))
      }
    }
    const onOffline = () => {
      const s = useApp.getState()
      const was = s.online
      s.setOnline(false)
      if (was) {
        s.toast('warning', translate(s.lang, 'top.offline'), translate(s.lang, 'sync.offlineToast'))
      }
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])
}

/* ── Print portal: only the invoice sheet enters print layout ─────────── */
export function PrintPortal() {
  const printId = useApp((s) => s.printingInvoiceId)
  const invoices = useApp((s) => s.invoices)
  const business = useApp((s) => s.business)
  const setPrinting = useApp((s) => s.setPrintingInvoice)

  useEffect(() => {
    if (!printId) return
    const timer = window.setTimeout(() => {
      window.print()
    }, 250)
    const done = () => setPrinting(null)
    window.addEventListener('afterprint', done)
    const fallback = window.setTimeout(done, 60_000)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(fallback)
      window.removeEventListener('afterprint', done)
    }
  }, [printId, setPrinting])

  if (!printId) return null
  const inv = invoices.find((i) => i.id === printId)
  if (!inv) return null

  return createPortal(
    <div className="print-portal">
      <TaxInvoice invoice={inv} business={business} />
    </div>,
    document.body
  )
}

export function AppShell() {
  useSyncEngine()
  useConnectionEvents()
  const view = useApp((s) => s.view)
  const orderId = useApp((s) => s.viewParams.orderId)
  const [navOpen, setNavOpen] = useState(false)

  /* the login screen is fullscreen — no sidebar/topbar shell around it */
  if (view === 'login') return <Login />

  const page = (() => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />
      case 'tables':
        return <Tables />
      case 'order':
        return <OrderView orderId={orderId ?? null} />
      case 'kitchen':
        return <Kitchen />
      case 'billing':
        return <Billing />
      case 'invoices':
        return <Invoices />
      case 'menu':
        return <MenuManager />
      case 'settings':
        return <Settings />
      default:
        return <Tables />
    }
  })()

  return (
    <div className="flex h-full bg-ink-950 text-fog-100">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={orderId ? `${view}-${orderId}` : view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
