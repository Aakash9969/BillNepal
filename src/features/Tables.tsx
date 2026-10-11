import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Armchair, ChefHat, Clock, Users } from 'lucide-react'
import { useApp, ordersForTable, staffById, tableStatusOf, type DerivedTableStatus } from '@/store'
import { useT } from '@/i18n/useT'
import { computeTotals } from '@/lib/billing'
import { formatTime } from '@/lib/nepali'
import { fmtNpr } from '@/lib/money'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { TableT, Zone } from '@/types'

const ZONES: Array<'all' | Zone> = ['all', 'indoor', 'terrace', 'garden']

const STATUS_TONE: Record<DerivedTableStatus, string> = {
  available: 'border-line-strong bg-ink-850',
  occupied: 'border-crimson-500/45 bg-crimson-500/[0.07]',
  billed: 'border-gold-400/50 bg-gold-400/[0.07]',
}

const STATUS_PILL: Record<DerivedTableStatus, { tone: 'neutral' | 'crimson' | 'gold'; key: 'tables.available' | 'tables.occupied' | 'tables.billed' }> = {
  available: { tone: 'neutral', key: 'tables.available' },
  occupied: { tone: 'crimson', key: 'tables.occupied' },
  billed: { tone: 'gold', key: 'tables.billed' },
}

/** Renders elapsed minutes live (re-render every 30s). */
function useElapsedTimer() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30_000)
    return () => clearInterval(id)
  }, [])
}

function elapsedLabel(sinceMs: number, nd: (x: number) => string): string {
  const mins = Math.max(0, Math.floor((Date.now() - sinceMs) / 60000))
  if (mins < 60) return `${nd(mins)}m`
  return `${nd(Math.floor(mins / 60))}h ${nd(mins % 60)}m`
}

function TableCard({ table, index }: { table: TableT; index: number }) {
  const { t, lang, nd } = useT()
  const s = useApp()
  useElapsedTimer()
  const status = tableStatusOf(s, table.id)
  const openOrders = ordersForTable(s, table.id)
  const primary = openOrders[0]
  const runningTotal = openOrders.reduce((sum, o) => sum + computeTotals(o, s.business).total, 0)
  const unsent = openOrders.reduce((sum, o) => sum + o.lines.filter((l) => !l.sentAt && !l.voided).length, 0)
  const waiter = primary ? staffById(s, primary.waiterId) : undefined
  const pill = STATUS_PILL[status]
  const role = s.staff.find((x) => x.id === s.userId)?.role ?? 'waiter'

  const handleClick = () => {
    if (role === 'cashier' && status !== 'available') {
      s.navigate('billing', { orderId: primary?.id })
      return
    }
    const id = s.openOrder(table.id)
    if (id) s.navigate('order', { orderId: id, tableId: table.id })
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={cn(
        'relative flex min-h-[148px] cursor-pointer flex-col rounded-2xl border p-4 text-left transition-shadow hover:shadow-xl hover:shadow-black/30',
        STATUS_TONE[status]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[20px] font-extrabold tracking-tight text-fog-100">{table.number}</p>
        <Badge tone={pill.tone} dot={status !== 'available'}>
          {t(pill.key)}
        </Badge>
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-fog-500">
        <Armchair size={12} />
        {t('tables.seats', { n: nd(table.seats) })}
      </div>

      {status !== 'available' && primary ? (
        <div className="mt-auto space-y-1.5 pt-3">
          <p className="font-mono text-[16px] font-extrabold tabular text-fog-100">Rs. {fmtNpr(runningTotal, lang)}</p>
          <div className="flex items-center justify-between text-[11px] text-fog-400">
            <span className="flex min-w-0 items-center gap-1">
              <Users size={11} />
              {t('tables.guestsCount', { n: nd(primary.guests) })}
              {waiter && <span className="truncate">· {lang === 'ne' ? waiter.nameNe : waiter.name}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Clock size={11} />
              {elapsedLabel(primary.openedAt, (x) => nd(String(x)))}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {openOrders.length > 1 && <Badge tone="sky">{t('tables.multipleBills', { n: nd(openOrders.length) })}</Badge>}
            {unsent > 0 && <Badge tone="amber">{t('tables.newItems', { n: nd(unsent) })}</Badge>}
            {status === 'billed' && <Badge tone="gold"><ChefHat size={10} /> bill?</Badge>}
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-3 text-[12px] font-semibold text-fog-500">
          {t('tables.startOrder')} →
        </div>
      )}

      {status === 'billed' && (
        <span className="absolute right-3 top-[60px] rounded-md bg-gold-400/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-300">
          {elapsedLabel(primary.billRequestedAt ?? primary.openedAt, (x) => nd(String(x)))}
        </span>
      )}
    </motion.button>
  )
}

export function Tables() {
  const { t, nd } = useT()
  const s = useApp()
  const [zone, setZone] = useState<'all' | Zone>('all')

  const filtered = useMemo(() => (zone === 'all' ? s.tables : s.tables.filter((tb) => tb.zone === zone)), [s.tables, zone])

  const counts = useMemo(() => {
    const c: Record<DerivedTableStatus, number> = { available: 0, occupied: 0, billed: 0 }
    for (const tb of s.tables) c[tableStatusOf(s, tb.id)]++
    return c
  }, [s])

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-fog-100">{t('tables.title')}</h1>
          <p className="mt-0.5 text-[13px] text-fog-400">
            {nd(counts.occupied + counts.billed)}/{nd(s.tables.length)} {t('tables.occupied')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-line-strong bg-ink-900 p-1">
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={cn(
                'cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                zone === z ? 'bg-crimson-500 text-white' : 'text-fog-400 hover:text-fog-100'
              )}
            >
              {t(z === 'all' ? 'tables.zone.all' : (`tables.zone.${z}` as 'tables.zone.indoor'))}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11.5px] text-fog-500">
        <Badge tone="neutral" dot>{t('tables.available')} · {nd(counts.available)}</Badge>
        <Badge tone="crimson" dot>{t('tables.occupied')} · {nd(counts.occupied)}</Badge>
        <Badge tone="gold" dot>{t('tables.billed')} · {nd(counts.billed)}</Badge>
      </div>

      <motion.div layout className="grid grid-cols-2 gap-3 pb-10 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {filtered.map((table, i) => (
          <TableCard key={table.id} table={table} index={i} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-fog-500">{t('tables.noTables')}</div>
      )}
    </div>
  )
}
