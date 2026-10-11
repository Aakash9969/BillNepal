import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ChevronsUp, Flame, Leaf, Printer, Search, Send, ShoppingCart, StickyNote, Trash2 } from 'lucide-react'
import { orderById, tableById, useApp } from '@/store'
import { useT } from '@/i18n/useT'
import { computeTotals, orderGross } from '@/lib/billing'
import { fmtNpr } from '@/lib/money'
import type { Category, Daypart, LineModifier, MenuItem, Order, OrderLine } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Stepper } from '@/components/ui/Stepper'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/lib/cn'

/* ── helpers ─────────────────────────────────────────────────────────── */

function activeDaypart(d = new Date()): Daypart {
  const h = d.getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  return 'dinner'
}

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const QUICK_NOTES: Array<'order.qn.noOnion' | 'order.qn.lessSpicy' | 'order.qn.extraSpicy' | 'order.qn.noCilantro' | 'order.qn.jholSide' | 'order.qn.noIce' | 'order.qn.lessSalt'> = [
  'order.qn.noOnion',
  'order.qn.lessSpicy',
  'order.qn.extraSpicy',
  'order.qn.noCilantro',
  'order.qn.jholSide',
  'order.qn.noIce',
  'order.qn.lessSalt',
]

/* ── modifier modal ──────────────────────────────────────────────────── */

function ModifierModal({
  item,
  open,
  onClose,
  onAdd,
}: {
  item: MenuItem | null
  open: boolean
  onClose: () => void
  onAdd: (mods: LineModifier[], qty: number, notes: string) => void
}) {
  const { t, lang } = useT()
  const groups = useApp((s) => s.modifierGroups)
  const [selected, setSelected] = useState<Record<string, LineModifier>>({})
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setSelected({})
      setQty(1)
      setNotes('')
    }
  }, [open, item?.id])

  const itemGroups = useMemo(
    () => (item ? groups.filter((g) => item.modifierGroupIds.includes(g.id)) : []),
    [groups, item]
  )
  if (!item) return null

  const modSum = Object.values(selected).reduce((a, m) => a + m.price, 0)
  const unit = item.price + modSum

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ne' ? item.nameNe : item.name}
      subtitle={`Rs. ${fmtNpr(item.price, lang)} — ${t('order.modifiers')}`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Stepper qty={qty} onChange={(v) => setQty(Math.max(1, v))} min={1} lang={lang} />
          <Button variant="primary" size="lg" className="flex-1" onClick={() => { onAdd(Object.values(selected), qty, notes); onClose() }}>
            {t('common.add')} · Rs. {fmtNpr(unit * qty, lang)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-6 py-5">
        {itemGroups.map((group) => {
          const anySelected = group.options.some((o) => selected[o.id])
          void anySelected
          return (
            <div key={group.id}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">
                {lang === 'ne' ? group.nameNe : group.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const active = Boolean(selected[opt.id])
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelected((prev) => {
                          const next = { ...prev }
                          if (next[opt.id]) delete next[opt.id]
                          else next[opt.id] = { optionId: opt.id, name: opt.name, nameNe: opt.nameNe, price: opt.price }
                          return next
                        })
                      }
                      className={cn(
                        'cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all',
                        active
                          ? 'border-crimson-400/60 bg-crimson-500/20 text-crimson-200'
                          : 'border-line-strong bg-ink-900 text-fog-300 hover:border-ink-500'
                      )}
                    >
                      {lang === 'ne' ? opt.nameNe : opt.name}
                      {opt.price > 0 && <span className="ml-1.5 font-mono text-[11px] text-gold-300">+{fmtNpr(opt.price, lang)}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('order.specialNotes')}</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((k) => {
              const label = t(k)
              const active = notes === label
              return (
                <button
                  key={k}
                  onClick={() => setNotes(active ? '' : label)}
                  className={cn(
                    'cursor-pointer rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors',
                    active ? 'border-gold-400/50 bg-gold-400/15 text-gold-300' : 'border-line-strong text-fog-400 hover:text-fog-200'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('order.noteFor', { item: lang === 'ne' ? item.nameNe : item.name })}
            className="h-10 w-full rounded-xl border border-line-strong bg-ink-900 px-3.5 text-sm text-fog-100 placeholder:text-fog-500 focus:border-crimson-400/60 focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  )
}

/* ── notes modal per cart line ────────────────────────────────────────── */
function NotesModal({ order, line, open, onClose }: { order: Order | null; line: OrderLine | null; open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const setLineNotes = useApp((s) => s.setLineNotes)
  const [notes, setNotes] = useState('')
  useEffect(() => {
    if (open) setNotes(line?.notes ?? '')
  }, [open, line?.notes])
  if (!order || !line) return null
  return (
    <Modal open={open} onClose={onClose} title={t('order.noteFor', { item: lang === 'ne' ? line.nameNe : line.name })}>
      <div className="space-y-4 px-6 py-5">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_NOTES.map((k) => {
            const label = t(k)
            return (
              <button
                key={k}
                onClick={() => setNotes(label)}
                className={cn(
                  'cursor-pointer rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors',
                  notes === label ? 'border-gold-400/50 bg-gold-400/15 text-gold-300' : 'border-line-strong text-fog-400 hover:text-fog-200'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <input autoFocus value={notes} onChange={(e) => setNotes(e.target.value)} className="h-10 w-full rounded-xl border border-line-strong bg-ink-900 px-3.5 text-sm text-fog-100 focus:border-crimson-400/60 focus:outline-none" />
        <Button variant="primary" className="w-full" onClick={() => { setLineNotes(order.id, line.id, notes); onClose() }}>
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  )
}

/* ── void confirm ─────────────────────────────────────────────────────── */
export function VoidLineModal({ order, line, open, onClose }: { order: Order | null; line: OrderLine | null; open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const removeLine = useApp((s) => s.removeLine)
  const [reason, setReason] = useState('order.voidReason.cancelled' as 'order.voidReason.cancelled' | 'order.voidReason.wrong' | 'order.voidReason.unavailable')
  if (!order || !line) return null
  return (
    <Modal open={open} onClose={onClose} title={t('order.voidLineTitle')} subtitle={t('order.voidLineHint')} size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => { removeLine(order.id, line.id, t(reason)); onClose() }}>
            {t('common.remove')}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-5">
        <p className="mb-1 truncate text-[15px] font-bold text-fog-100">{lang === 'ne' ? line.nameNe : line.name} ×{line.qty}</p>
        <p className="mb-4 text-xs text-fog-500">Rs. {fmtNpr(line.unitPrice * line.qty, lang)}</p>
        <div className="flex flex-wrap gap-1.5">
          {(['order.voidReason.cancelled', 'order.voidReason.wrong', 'order.voidReason.unavailable'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setReason(k)}
              className={cn(
                'cursor-pointer rounded-md border px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
                reason === k ? 'border-crimson-400/60 bg-crimson-500/20 text-crimson-200' : 'border-line-strong text-fog-400 hover:text-fog-200'
              )}
            >
              {t(k)}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/* ── item card ────────────────────────────────────────────────────────── */
function ItemCard({ item, cat, index, dimmed, onPick }: { item: MenuItem; cat: Category | undefined; index: number; dimmed: boolean; onPick: () => void }) {
  const { t, lang } = useT()
  const off = dimmed || !item.available
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
      whileTap={off ? undefined : { scale: 0.96 }}
      onClick={() => !off && onPick()}
      disabled={off}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line-strong bg-ink-850 text-left transition-all',
        off ? 'cursor-not-allowed opacity-45 saturate-0' : 'hover:border-crimson-400/40 hover:shadow-lg hover:shadow-black/25'
      )}
    >
      {/* category-coloured band with monogram */}
      <div className={cn('relative flex h-[58px] shrink-0 items-center justify-center bg-gradient-to-br', cat?.hue ?? 'from-fog-400 to-fog-500')}>
        <span className="text-[21px] font-extrabold tracking-tight text-ink-950/85">{monogram(item.name)}</span>
        <span className="absolute right-2 top-2 flex items-center gap-1">
          {item.veg && (
            <span className="grid h-[18px] w-[18px] place-items-center rounded-md bg-ink-950/40 text-mint-200">
              <Leaf size={11} aria-label={t('order.veg')} />
            </span>
          )}
          {item.spice > 0 && (
            <span className="flex h-[18px] items-center gap-px rounded-md bg-ink-950/40 px-1">
              {Array.from({ length: item.spice }).map((_, i) => (
                <Flame key={i} size={10} className="text-crimson-200" aria-hidden="true" />
              ))}
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-1 text-[13px] font-bold leading-snug text-fog-100">
          {lang === 'ne' ? item.nameNe : item.name}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-fog-500">
          {lang === 'ne' ? item.descNe : item.desc}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="rounded-lg border border-gold-400/25 bg-gold-400/10 px-2 py-0.5 font-mono text-[12.5px] font-bold tabular text-gold-300">
            Rs. {fmtNpr(item.price, lang)}
          </span>
          {item.modifierGroupIds.length > 0 && !off && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-fog-500">+ {t('order.modifiers')}</span>
          )}
        </div>
      </div>

      {off && (
        <span className="absolute right-2 top-16 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-fog-400">
          {t(!item.available ? 'order.unavailable' : 'order.daypartUnavailable')}
        </span>
      )}
    </motion.button>
  )
}

/* ── main view ────────────────────────────────────────────────────────── */
export function OrderView({ orderId }: { orderId: string | null }) {
  const { t, lang, nd } = useT()
  const s = useApp()
  const order = orderId ? orderById(s, orderId) : undefined
  const navigate = s.navigate

  const [catId, setCatId] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [modItem, setModItem] = useState<MenuItem | null>(null)
  const [notesLine, setNotesLine] = useState<OrderLine | null>(null)
  const [voidLine, setVoidLine] = useState<OrderLine | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  /* the order disappeared (paid / void) → back to the floor */
  useEffect(() => {
    if (!order) navigate('tables')
  }, [order, navigate])

  const now = new Date()
  const daypart = activeDaypart(now)

  const categories = useMemo(
    () => [...s.categories].sort((a, b) => a.sort - b.sort),
    [s.categories]
  )

  const items = useMemo(() => {
    return s.items
      .filter((i) => !i.archived && (catId === 'all' || i.categoryId === catId))
      .filter((i) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return i.name.toLowerCase().includes(q) || i.nameNe.includes(query)
      })
  }, [s.items, catId, query])

  if (!order) return null
  const table = tableById(s, order.tableId)
  const totals = computeTotals(order, s.business)
  const gross = orderGross(order)
  const newLines = order.lines.filter((l) => !l.voided && !l.sentAt)
  const sentLines = order.lines.filter((l) => !l.voided && l.sentAt)
  const voidedLines = order.lines.filter((l) => l.voided)

  const pick = (item: MenuItem) => {
    if (item.modifierGroupIds.length > 0) setModItem(item)
    else s.addItemToOrder(order.id, item.id, [])
  }

  const sendNow = () => {
    const kot = s.sendToKitchen(order.id)
    if (kot) s.toast('success', t('order.kotSent', { n: nd(kot.number) }))
  }

  const totalLines = newLines.length + sentLines.length

  /* cart content — shared between the desktop panel and the mobile sheet */
  const cartLines = (
    <>
      {/* new items */}
      <div className="border-b border-line px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-crimson-300">{t('order.newItems')}</p>
          {newLines.length > 0 && <Badge tone="crimson">{nd(newLines.length)}</Badge>}
        </div>
        <AnimatePresence initial={false}>
          {newLines.length === 0 && sentLines.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState icon={<Send size={20} />} title={t('order.empty')} hint={t('order.emptyHint')} className="py-8" />
            </motion.div>
          ) : newLines.length === 0 ? (
            <p className="py-2 text-[12px] text-fog-500">{t('order.nothingToSend')}</p>
          ) : (
            <ul className="space-y-2">
              {newLines.map((l) => (
                <LineRow key={l.id} line={l} order={order} isNew onNotes={() => setNotesLine(l)} onVoid={() => setVoidLine(l)} />
              ))}
            </ul>
          )}
        </AnimatePresence>
      </div>

      {/* sent items */}
      {sentLines.length > 0 && (
        <div className="px-4 py-3">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-fog-500">{t('order.sentItems')}</p>
          <ul className="space-y-2">
            {sentLines.map((l) => (
              <LineRow key={l.id} line={l} order={order} onVoid={() => setVoidLine(l)} />
            ))}
          </ul>
        </div>
      )}

      {voidedLines.length > 0 && (
        <div className="border-t border-line px-4 py-2.5">
          {voidedLines.map((l) => (
            <p key={l.id} className="flex justify-between gap-2 py-0.5 text-[11px] text-fog-600 line-through decoration-fog-500/60">
              <span className="truncate">{lang === 'ne' ? l.nameNe : l.name} ×{nd(l.qty)}</span>
              <span>{t('billing.voidedLine')}</span>
            </p>
          ))}
        </div>
      )}
    </>
  )

  const cartTotals = (
    <>
      <dl className="space-y-1 text-[12.5px] text-fog-400">
        <div className="flex justify-between"><dt>{t('common.subtotal')}</dt><dd className="font-mono tabular">Rs. {fmtNpr(gross, lang)}</dd></div>
        {order.discount && (
          <div className="flex justify-between text-gold-300">
            <dt>{t('common.discount')} {order.discount.type === 'percent' ? `${nd(order.discount.value)}%` : ''}</dt>
            <dd className="font-mono tabular">− Rs. {fmtNpr(totals.discountAmount, lang)}</dd>
          </div>
        )}
        <div className="flex justify-between"><dt>{t('billing.sc', { p: nd(s.business.serviceChargePct) })}</dt><dd className="font-mono tabular">Rs. {fmtNpr(totals.serviceCharge, lang)}</dd></div>
        <div className="flex justify-between text-fog-500"><dt>{t('billing.vatLine')} · {t('billing.taxable')}</dt><dd className="font-mono tabular">Rs. {fmtNpr(totals.vat, lang)}</dd></div>
      </dl>
      <div className="mt-2.5 flex items-baseline justify-between border-t border-line pt-2.5">
        <span className="text-[13px] font-bold uppercase tracking-wide text-fog-300">{t('billing.grandTotal')}</span>
        <span className="font-mono text-[22px] font-extrabold tabular text-fog-100">Rs. {fmtNpr(totals.total, lang)}</span>
      </div>

      {sentLines.length > 0 && !order.billRequestedAt && (
        <Button variant="gold" size="md" className="mt-3 w-full" onClick={() => s.requestBill(order.id)}>
          <Printer size={15} />
          {t('tables.collectBill')}
        </Button>
      )}
    </>
  )

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink-900/60 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('tables')}>
            <ArrowLeft size={15} />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-[17px] font-extrabold tracking-tight text-fog-100">
              {t('order.title', { table: table?.number ?? '' })}
              <span className="ml-2 font-mono text-[12px] font-semibold text-fog-500">{order.number}</span>
            </h1>
            <p className="text-[11.5px] text-fog-500">
              {t(`tables.zone.${table?.zone ?? 'indoor'}` as 'tables.zone.indoor')} ·{' '}
              {lang === 'ne' ? s.staff.find((x) => x.id === order.waiterId)?.nameNe : s.staff.find((x) => x.id === order.waiterId)?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="crimson">{t('order.now')}: {t(`order.daypart.${daypart}` as 'order.daypart.lunch')}</Badge>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-fog-400">{t('order.guests')}</span>
            <Stepper size="sm" qty={order.guests} onChange={(v) => s.setGuests(order.id, v)} min={1} lang={lang} />
          </div>
        </div>
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        {/* categories rail (desktop) */}
        <nav className="no-scrollbar hidden w-[104px] shrink-0 space-y-1 overflow-y-auto border-r border-line bg-ink-900/50 p-2 lg:block">
          {[{ id: 'all', name: t('common.all'), nameNe: t('common.all'), icon: 'UtensilsCrossed', hue: 'from-fog-400 to-fog-500', sort: 0 } as Category, ...categories].map((c) => {
            const active = catId === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                className={cn(
                  'flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors',
                  active ? 'bg-crimson-500/15 text-crimson-300' : 'text-fog-400 hover:bg-ink-800 hover:text-fog-200'
                )}
              >
                <CategoryIcon name={c.icon} size={19} />
                <span className="w-full truncate text-[11px] font-bold leading-tight">{lang === 'ne' ? c.nameNe : c.name}</span>
              </button>
            )
          })}
        </nav>

        {/* category chips (mobile) */}
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-line bg-ink-900/50 px-4 py-2 lg:hidden">
          {[{ id: 'all', name: t('common.all'), nameNe: t('common.all'), icon: 'UtensilsCrossed', hue: 'from-fog-400 to-fog-500', sort: 0 } as Category, ...categories].map((c) => {
            const active = catId === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                  active ? 'border-crimson-400/60 bg-crimson-500/20 text-crimson-200' : 'border-line-strong bg-ink-900 text-fog-400 hover:text-fog-200'
                )}
              >
                <CategoryIcon name={c.icon} size={14} />
                {lang === 'ne' ? c.nameNe : c.name}
              </button>
            )
          })}
        </nav>

        {/* items grid */}
        <div className="min-w-0 flex-1 overflow-y-auto p-4 pb-28 lg:pb-4">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-line-strong bg-ink-900 px-3">
            <Search size={15} className="shrink-0 text-fog-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'ne' ? 'परिकार खोज्नुहोस्…' : 'Search dishes…'}
              className="h-10 w-full bg-transparent text-sm text-fog-100 placeholder:text-fog-500 focus:outline-none"
            />
          </div>
          {items.length === 0 ? (
            <EmptyState icon={<Search size={22} />} title={t('order.emptyMenu')} />
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
              {items.map((item, i) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  cat={s.categories.find((c) => c.id === item.categoryId)}
                  index={i}
                  dimmed={item.dayparts.length > 0 && !item.dayparts.includes(daypart)}
                  onPick={() => pick(item)}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* order panel (desktop) */}
        <aside className="hidden w-[360px] shrink-0 flex-col border-l border-line bg-ink-900 lg:flex">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{cartLines}</div>
          <div className="shrink-0 border-t border-line-strong bg-ink-850 p-4">{cartTotals}</div>
        </aside>
      </div>

      {/* floating send-to-kitchen (desktop) — always reachable without scrolling the menu */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 hidden justify-center lg:flex">
        <AnimatePresence>
          {newLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto"
            >
              <Button
                variant="primary"
                size="lg"
                className="shadow-2xl shadow-crimson-500/40 ring-1 ring-crimson-400/30"
                onClick={sendNow}
              >
                <Send size={16} />
                {t('order.sendToKitchen')}
                <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-bold">{nd(newLines.length)}</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* mobile bottom bar — cart & send always reachable (waiter-optimized) */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-line-strong bg-ink-900/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setCartOpen(true)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-line-strong bg-ink-850 px-3 py-2 text-left transition-colors hover:border-ink-500"
        >
          <span className="relative shrink-0 p-0.5 text-fog-300">
            <ShoppingCart size={17} />
            {totalLines > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-crimson-500 px-1 text-[9px] font-bold text-white">
                {nd(totalLines)}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10.5px] font-semibold uppercase tracking-wide text-fog-500">{t('order.runningTotal')}</span>
            <span className="block truncate font-mono text-[14px] font-bold tabular text-fog-100">Rs. {fmtNpr(totals.total, lang)}</span>
          </span>
          <ChevronsUp size={15} className="shrink-0 text-fog-500" />
        </button>
        {newLines.length > 0 && (
          <Button variant="primary" size="md" className="shrink-0" onClick={sendNow}>
            <Send size={15} />
            {t('order.sendToKitchen')}
          </Button>
        )}
      </div>

      {/* modals */}
      {/* mobile cart sheet */}
      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={t('order.title', { table: table?.number ?? '' })}
        subtitle={order.number}
        size="md"
        footer={<div className="w-full">{cartTotals}</div>}
      >
        {cartLines}
      </Modal>
      <ModifierModal
        item={modItem}
        open={Boolean(modItem)}
        onClose={() => setModItem(null)}
        onAdd={(mods, qty, notes) => {
          if (!modItem) return
          s.addItemToOrder(order.id, modItem.id, mods, qty)
          if (notes) {
            // attach note to the newest matching line
            const latest = useApp.getState().orders.find((o) => o.id === order.id)?.lines.filter((l) => !l.voided).at(-1)
            if (latest) s.setLineNotes(order.id, latest.id, notes)
          }
        }}
      />
      <NotesModal order={order} line={notesLine} open={Boolean(notesLine)} onClose={() => setNotesLine(null)} />
      <VoidLineModal order={order} line={voidLine} open={Boolean(voidLine)} onClose={() => setVoidLine(null)} />
    </div>
  )
}

function LineRow({
  line,
  order,
  isNew,
  onNotes,
  onVoid,
}: {
  line: OrderLine
  order: Order
  isNew?: boolean
  onNotes?: () => void
  onVoid: () => void
}) {
  const { t, lang, nd } = useT()
  const s = useApp()
  const kot = s.kots.find((k) => k.id === line.kotId)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 14 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn(
        'rounded-xl border p-2.5',
        isNew ? 'border-crimson-400/25 bg-crimson-500/[0.06]' : 'border-line bg-ink-900/60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[13px] font-bold', isNew ? 'text-fog-100' : 'text-fog-300')}>
            {lang === 'ne' ? line.nameNe : line.name}
          </p>
          {line.modifiers.length > 0 && (
            <p className="truncate text-[11px] text-gold-300/90">+ {line.modifiers.map((m) => (lang === 'ne' ? m.nameNe : m.name)).join(', ')}</p>
          )}
          {line.notes && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] italic text-crimson-300">
              <StickyNote size={10} />
              {line.notes}
            </p>
          )}
        </div>
        <span className="shrink-0 font-mono text-[12.5px] font-bold tabular text-fog-100">Rs. {fmtNpr(line.unitPrice * line.qty, lang)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {isNew ? (
          <Stepper
            size="sm"
            qty={line.qty}
            lang={lang}
            min={0}
            onChange={(v) => {
              if (v === 0) onVoid()
              else s.setLineQty(order.id, line.id, v)
            }}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-bold text-fog-400">×{nd(line.qty)}</span>
            {kot && <Badge tone="mint">KOT #{nd(kot.number)}</Badge>}
          </div>
        )}
        <div className="flex items-center gap-0.5">
          {isNew && onNotes && (
            <button onClick={onNotes} aria-label={t('order.addNote')} className="rounded-lg p-1.5 text-fog-500 transition-colors hover:bg-ink-750 hover:text-gold-300">
              <StickyNote size={14} />
            </button>
          )}
          <button onClick={onVoid} aria-label={t('billing.voidLine')} className="rounded-lg p-1.5 text-fog-500 transition-colors hover:bg-ink-750 hover:text-crimson-300">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.li>
  )
}
