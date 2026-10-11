import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChefHat, CloudOff, History, Play, RotateCcw, Check, StickyNote } from 'lucide-react'
import { useApp, staffById, tableById } from '@/store'
import { useT } from '@/i18n/useT'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import type { Kot, KotStatus } from '@/types'

function useTick(ms = 15_000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

function elapsedText(fromMs: number, nd: (x: string | number) => string): string {
  const mins = Math.max(0, Math.floor((Date.now() - fromMs) / 60000))
  if (mins < 1) return nd(0) + ' ' + 'min'
  if (mins < 60) return nd(mins) + 'm'
  return `${nd(Math.floor(mins / 60))}h ${nd(mins % 60)}m`
}

function urgency(fromMs: number): 'ok' | 'warn' | 'late' {
  const mins = (Date.now() - fromMs) / 60000
  if (mins > 12) return 'late'
  if (mins > 6) return 'warn'
  return 'ok'
}

const URGENCY_CLASSES = {
  ok: 'text-fog-400 border-line-strong',
  warn: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
  late: 'text-crimson-300 border-crimson-500/40 bg-crimson-500/10',
} as const

function KotCard({ kot }: { kot: Kot }) {
  const { t, lang, nd } = useT()
  const s = useApp()
  useTick()
  const table = tableById(s, kot.tableId)
  const waiter = staffById(s, kot.waiterId)
  const urg = kot.status === 'ready' || kot.status === 'served' ? 'ok' : urgency(kot.createdAt)

  return (
    <motion.div
      layout="position"
      layoutId={kot.id}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="rounded-2xl border border-line-strong bg-ink-850 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[16px] font-extrabold tracking-tight text-fog-100">
            KOT #{nd(kot.number)}
            <span className="ml-2 font-sans text-[13px] font-bold text-crimson-300">{table?.number}</span>
          </p>
          <p className="mt-0.5 text-[11.5px] text-fog-500">
            {t('kitchen.waiter')}: {lang === 'ne' ? waiter?.nameNe : waiter?.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={urg === 'ok' ? 'neutral' : urg === 'warn' ? 'amber' : 'danger'} className={cn(urg !== 'ok' && URGENCY_CLASSES[urg])}>
            {urg === 'late' ? t('kitchen.overdue', { t: elapsedText(kot.createdAt, nd) }) : elapsedText(kot.createdAt, nd)}
          </Badge>
          {kot.syncState === 'pending' && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <CloudOff size={11} /> {t('kitchen.syncPending')}
            </span>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {kot.lines.map((l) => (
          <li key={l.lineId}>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[13px] font-black text-gold-300">{nd(l.qty)}×</span>
              <span className="min-w-0 truncate text-[13px] font-semibold text-fog-100">{lang === 'ne' ? l.nameNe : l.name}</span>
            </div>
            {l.modifiers.length > 0 && (
              <p className="ml-8 truncate text-[11px] text-fog-500">+ {l.modifiers.map((m) => (lang === 'ne' ? m.nameNe : m.name)).join(', ')}</p>
            )}
            {l.notes && (
              <p className="ml-8 mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold italic text-crimson-300">
                <StickyNote size={10} />{l.notes}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3.5 flex gap-2 border-t border-line pt-3">
        {kot.status === 'queued' && (
          <Button variant="primary" size="sm" className="flex-1" onClick={() => s.setKotStatus(kot.id, 'preparing')}>
            <Play size={13} /> {t('kitchen.start')}
          </Button>
        )}
        {kot.status === 'preparing' && (
          <Button variant="success" size="sm" className="flex-1" onClick={() => s.setKotStatus(kot.id, 'ready')}>
            <Check size={13} /> {t('kitchen.markReady')}
          </Button>
        )}
        {kot.status === 'ready' && (
          <>
            <Button variant="outline" size="sm" onClick={() => s.setKotStatus(kot.id, 'preparing')}>
              <RotateCcw size={13} /> {t('kitchen.recall')}
            </Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={() => s.setKotStatus(kot.id, 'served')}>
              <Check size={13} /> {t('kitchen.markServed')}
            </Button>
          </>
        )}
      </div>
    </motion.div>
  )
}

const COLUMNS: Array<{ status: KotStatus; key: 'kitchen.queued' | 'kitchen.preparing' | 'kitchen.ready'; tone: 'amber' | 'sky' | 'mint' }> = [
  { status: 'queued', key: 'kitchen.queued', tone: 'amber' },
  { status: 'preparing', key: 'kitchen.preparing', tone: 'sky' },
  { status: 'ready', key: 'kitchen.ready', tone: 'mint' },
]

export function Kitchen() {
  const { t, nd } = useT()
  const s = useApp()

  const grouped = useMemo(() => {
    const map: Record<KotStatus, Kot[]> = { queued: [], preparing: [], ready: [], served: [] }
    for (const kot of s.kots) map[kot.status].push(kot)
    map.queued.sort((a, b) => a.createdAt - b.createdAt)
    map.preparing.sort((a, b) => a.createdAt - b.createdAt)
    map.ready.sort((a, b) => a.createdAt - b.createdAt)
    map.served.sort((a, b) => b.createdAt - a.createdAt)
    return map
  }, [s.kots])

  const allEmpty = grouped.queued.length === 0 && grouped.preparing.length === 0 && grouped.ready.length === 0

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-[24px] font-extrabold tracking-tight text-fog-100">
            <ChefHat size={22} className="text-amber-400" />
            {t('kitchen.title')}
          </h1>
          <p className="mt-0.5 text-[13px] text-fog-400">
            {t('dash.openKots', { n: nd(grouped.queued.length + grouped.preparing.length + grouped.ready.length) })}
          </p>
        </div>
        {grouped.served.length > 0 && (
          <div className="flex items-center gap-1.5 text-[12px] text-fog-500">
            <History size={14} />
            {grouped.served.slice(0, 4).map((k) => (
              <span key={k.id} className="rounded-md bg-ink-800 px-1.5 py-0.5 font-mono text-[11px] text-fog-500">#{nd(k.number)}</span>
            ))}
            <span className="ml-1">{t('kitchen.servedCol')}</span>
          </div>
        )}
      </div>

      {allEmpty ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-ink-900/40">
          <EmptyState icon={<ChefHat size={24} />} title={t('kitchen.empty')} />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <section key={col.status} className="rounded-2xl border border-line bg-ink-900/60 p-3">
              <header className="mb-3 flex items-center justify-between px-1.5">
                <Badge tone={col.tone} dot>{t(col.key)}</Badge>
                <span className="font-mono text-[12px] font-bold text-fog-500">{nd(grouped[col.status].length)}</span>
              </header>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {grouped[col.status].map((kot) => (
                    <KotCard key={kot.id} kot={kot} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
