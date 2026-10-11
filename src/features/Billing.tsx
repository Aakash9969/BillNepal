import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BadgeCheck,
  Banknote,
  Check,
  CreditCard,
  Percent,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Split,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/store'
import { useT } from '@/i18n/useT'
import { activeLines, computeTotals, hashPayload, lineTotal, orderGross, paidTotal, remaining } from '@/lib/billing'
import { fmtNpr, round2 } from '@/lib/money'
import { refCode } from '@/lib/id'
import { formatTime } from '@/lib/nepali'
import type { BusinessSettings, Order, OrderLine, Payment, PaymentMethod } from '@/types'
import { PAYMENT_META, PAYMENT_METHODS } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Toggle } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { PseudoQr } from '@/components/invoice/PseudoQr'
import { VoidLineModal } from '@/features/OrderView'
import { cn } from '@/lib/cn'

/* ── helpers ─────────────────────────────────────────────────────────── */

function elapsedLabel(sinceMs: number, nd: (x: number) => string): string {
  const mins = Math.max(0, Math.floor((Date.now() - sinceMs) / 60000))
  if (mins < 60) return `${nd(mins)}m`
  return `${nd(Math.floor(mins / 60))}h ${nd(mins % 60)}m`
}

const QUICK_TENDER = [50, 100, 200, 500, 1000, 2000]

const METHOD_ICON: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  esewa: Smartphone,
  khalti: Smartphone,
  fonepay: QrCode,
  nepalqr: QrCode,
  card: CreditCard,
}

/** Gateway reference prefixes — same codes the invoice history uses. */
const REF_PREFIX: Record<Exclude<PaymentMethod, 'cash'>, string> = {
  esewa: 'ESW',
  khalti: 'KHT',
  fonepay: 'FON',
  nepalqr: 'NQR',
  card: 'CRD',
}

const partLabelKey = (p: 'A' | 'B') => (p === 'A' ? ('billing.partA' as const) : ('billing.partB' as const))

/* ── bills rail card ─────────────────────────────────────────────────── */

function BillCard({ order, active, onSelect }: { order: Order; active: boolean; onSelect: () => void }) {
  const { t, lang, nd } = useT()
  const business = useApp((s) => s.business)
  const table = useApp((s) => s.tables.find((x) => x.id === order.tableId))
  const waiter = useApp((s) => s.staff.find((x) => x.id === order.waiterId))
  const total = computeTotals(order, business).total

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onClick={onSelect}
      className={cn(
        'relative w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-colors',
        active
          ? 'border-crimson-400/50 bg-crimson-500/[0.08]'
          : 'border-line-strong bg-ink-850 hover:border-ink-500 hover:bg-ink-800'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[17px] font-extrabold tracking-tight text-fog-100">{table?.number ?? '—'}</p>
        {order.billRequestedAt ? (
          <Badge tone="gold" dot>{elapsedLabel(order.billRequestedAt, (x) => nd(x))}</Badge>
        ) : (
          <Badge tone="crimson" dot>{elapsedLabel(order.openedAt, (x) => nd(x))}</Badge>
        )}
      </div>
      <p className="mt-0.5 font-mono text-[11.5px] font-semibold text-fog-500">
        {order.number}
        {order.partLabel ? ` · ${t(partLabelKey(order.partLabel))}` : ''}
      </p>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-fog-400">
          <Users size={11} />
          <span className="truncate">{lang === 'ne' ? waiter?.nameNe : waiter?.name}</span>
        </p>
        <p className="shrink-0 font-mono text-[15px] font-extrabold tabular text-fog-100">Rs. {fmtNpr(total, lang)}</p>
      </div>
    </motion.button>
  )
}

/* ── bill line row ───────────────────────────────────────────────────── */

function BillLine({ line, onVoid }: { line: OrderLine; onVoid: () => void }) {
  const { t, lang, nd } = useT()
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 14 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="flex items-start justify-between gap-3 rounded-xl border border-line bg-ink-900/60 p-3"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-fog-100">{lang === 'ne' ? line.nameNe : line.name}</p>
        {line.modifiers.length > 0 && (
          <p className="truncate text-[11px] text-gold-300/90">
            + {line.modifiers.map((m) => (lang === 'ne' ? m.nameNe : m.name)).join(', ')}
          </p>
        )}
        {line.notes && <p className="mt-0.5 truncate text-[11px] italic text-crimson-300">“{line.notes}”</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[12px] font-bold text-fog-400">×{nd(line.qty)}</span>
        <span className="font-mono text-[13.5px] font-bold tabular text-fog-100">Rs. {fmtNpr(lineTotal(line), lang)}</span>
        <button
          onClick={onVoid}
          aria-label={t('billing.voidLine')}
          title={t('billing.voidLine')}
          className="rounded-lg p-1.5 text-fog-500 transition-colors hover:bg-ink-750 hover:text-crimson-300"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.li>
  )
}

/* ── discount modal ──────────────────────────────────────────────────── */

const DISCOUNT_REASONS = ['billing.discount.staff', 'billing.discount.loyalty', 'billing.discount.complaint'] as const

function DiscountModal({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const { t, lang, nd } = useT()
  const applyDiscount = useApp((s) => s.applyDiscount)
  const business = useApp((s) => s.business)

  const [type, setType] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setType(order.discount?.type ?? 'percent')
      setValue(order.discount ? String(order.discount.value) : '')
      setReason(order.discount?.reason ?? '')
    }
  }, [open, order.id])

  const gross = orderGross(order)
  const num = Math.max(0, parseFloat(value) || 0)
  const preview = type === 'percent' ? round2((gross * Math.min(num, 100)) / 100) : round2(Math.min(num, gross))
  const previewTotal = round2((gross - preview) * (1 + business.serviceChargePct / 100))

  const apply = () => {
    if (num <= 0 || gross <= 0) return
    applyDiscount(order.id, {
      type,
      value: type === 'percent' ? Math.min(Math.round(num), 100) : Math.min(round2(num), gross),
      reason: reason.trim() || t('common.discount'),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('billing.applyDiscount')}
      subtitle={`${t('common.subtotal')}: Rs. ${fmtNpr(gross, lang)}`}
      size="sm"
      footer={
        <div className="flex items-center justify-between gap-2">
          {order.discount ? (
            <Button variant="danger" onClick={() => { applyDiscount(order.id, null); onClose() }}>
              <X size={15} />
              {t('billing.discount.remove')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="primary" disabled={num <= 0 || gross <= 0} onClick={apply}>
              {t('common.apply')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <Segmented<'percent' | 'amount'>
          ariaLabel={t('billing.applyDiscount')}
          size="sm"
          value={type}
          onChange={setType}
          options={[
            { id: 'percent', label: t('billing.discountPercent') },
            { id: 'amount', label: t('billing.discountAmount') },
          ]}
        />
        <Field label={t('billing.discountValue')}>
          <Input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'percent' ? '10' : '100'}
            className="font-mono"
          />
        </Field>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('billing.discountReason')}</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {DISCOUNT_REASONS.map((k) => {
              const label = t(k)
              const active = reason === label
              return (
                <button
                  key={k}
                  onClick={() => setReason(active ? '' : label)}
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
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {num > 0 && gross > 0 && (
          <div className="flex items-baseline justify-between rounded-xl border border-gold-400/25 bg-gold-400/[0.06] px-3.5 py-2.5">
            <span className="text-[12px] font-semibold text-fog-300">{t('billing.grandTotal')}</span>
            <span className="font-mono text-[15px] font-extrabold tabular text-fog-100">
              Rs. {fmtNpr(previewTotal, lang)}
              <span className="ml-2 text-[11px] font-semibold text-gold-300">−{fmtNpr(preview, lang)}</span>
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ── split modal ─────────────────────────────────────────────────────── */

function SplitModal({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const { t, lang, nd } = useT()
  const splitOrder = useApp((s) => s.splitOrder)
  const [picked, setPicked] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (open) setPicked(new Set())
  }, [open, order.id])

  const lines = activeLines(order)
  const aSum = lines.filter((l) => picked.has(l.id)).reduce((a, l) => a + lineTotal(l), 0)
  const aTotal = round2(aSum)
  const bTotal = round2(lines.reduce((a, l) => a + lineTotal(l), 0) - aSum)
  const canSplit = picked.size > 0 && picked.size < lines.length

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('billing.split')}
      subtitle={t('billing.splitHint')}
      size="md"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[12px] font-semibold">
            <span className="text-crimson-300">
              {t('billing.partA')}: <span className="font-mono tabular">Rs. {fmtNpr(aTotal, lang)}</span>
            </span>
            <span className="text-fog-400">
              {t('billing.partB')}: <span className="font-mono tabular">Rs. {fmtNpr(bTotal, lang)}</span>
            </span>
          </div>
          <Button
            variant="primary"
            disabled={!canSplit}
            onClick={() => {
              splitOrder(order.id, [...picked])
              onClose()
            }}
          >
            {t('billing.splitCreate')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-3.5 py-2.5 text-[11.5px] font-semibold text-amber-400">
          {t('billing.cancelSplitWarn')}
        </p>
        <ul className="space-y-1.5">
          {lines.map((l) => {
            const on = picked.has(l.id)
            return (
              <li key={l.id}>
                <button
                  onClick={() => toggle(l.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors',
                    on ? 'border-crimson-400/50 bg-crimson-500/[0.08]' : 'border-line bg-ink-900/60 hover:border-ink-500'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                      on ? 'border-crimson-400 bg-crimson-500 text-white' : 'border-line-strong bg-ink-850 text-transparent'
                    )}
                  >
                    <Check size={13} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-fog-100">
                    {lang === 'ne' ? l.nameNe : l.name}
                  </span>
                  <span className="shrink-0 text-[12px] font-bold text-fog-400">×{nd(l.qty)}</span>
                  <span className="shrink-0 font-mono text-[12.5px] font-bold tabular text-fog-100">Rs. {fmtNpr(lineTotal(l), lang)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}

/* ── payment modal — collect → verify → settle → IRD invoice ─────────── */

function PaymentModal({
  order,
  tableNumber,
  business,
  open,
  onClose,
}: {
  order: Order | null
  tableNumber: string
  business: BusinessSettings
  open: boolean
  onClose: () => void
}) {
  const { t, lang, nd } = useT()
  const finalizeOrder = useApp((s) => s.finalizeOrder)
  const setPrintingInvoice = useApp((s) => s.setPrintingInvoice)
  const toast = useApp((s) => s.toast)

  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [tendered, setTendered] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [verify, setVerify] = useState<'idle' | 'verifying' | 'verified'>('idle')
  const [payments, setPayments] = useState<Payment[]>([])
  const [isB2b, setIsB2b] = useState(false)
  const [b2bName, setB2bName] = useState('')
  const [b2bPan, setB2bPan] = useState('')
  const verifyTimer = useRef<number | null>(null)

  const orderId = order?.id
  useEffect(() => {
    if (open) {
      setMethod('cash')
      setTendered('')
      setAmount('')
      setReference('')
      setVerify('idle')
      setPayments([])
      setIsB2b(false)
      setB2bName('')
      setB2bPan('')
    } else if (verifyTimer.current) {
      /* close cancels any in-flight gateway verification */
      window.clearTimeout(verifyTimer.current)
      verifyTimer.current = null
    }
  }, [open, orderId])

  /* switching gateway resets the verification entry and cancels the old check */
  useEffect(() => {
    setVerify('idle')
    setReference('')
    if (verifyTimer.current) {
      window.clearTimeout(verifyTimer.current)
      verifyTimer.current = null
    }
  }, [method])

  useEffect(() => {
    return () => {
      if (verifyTimer.current) window.clearTimeout(verifyTimer.current)
    }
  }, [])

  if (!order) return null

  const totals = computeTotals(order, business)
  const paid = paidTotal(payments)
  const bal = remaining(totals.total, payments)
  const lines = activeLines(order)

  const tenderedNum = Math.max(0, round2(parseFloat(tendered) || 0))
  const amountNum = amount === '' ? bal : Math.max(0, round2(parseFloat(amount) || 0))
  const applied = Math.min(method === 'cash' ? tenderedNum : amountNum, bal)
  const changeDue = method === 'cash' ? Math.max(0, round2(tenderedNum - applied)) : 0

  const meta = PAYMENT_META[method]
  const isQr = method === 'fonepay' || method === 'nepalqr'

  const startVerify = () => {
    if (verify === 'verifying' || method === 'cash') return
    if (verifyTimer.current) window.clearTimeout(verifyTimer.current)
    setVerify('verifying')
    verifyTimer.current = window.setTimeout(() => {
      setVerify('verified')
      setReference((r) => (r.trim() ? r : refCode(REF_PREFIX[method])))
    }, 900)
  }

  const addPayment = () => {
    if (applied <= 0 || bal <= 0) return
    const p: Payment = {
      method,
      amount: applied,
      at: Date.now(),
      ...(method === 'cash' ? { tendered: tenderedNum } : reference.trim() ? { reference: reference.trim() } : {}),
    }
    setPayments((prev) => [...prev, p])
    setTendered('')
    setAmount('')
    setReference('')
    setVerify('idle')
    if (verifyTimer.current) {
      window.clearTimeout(verifyTimer.current)
      verifyTimer.current = null
    }
  }

  const removePayment = (idx: number) => setPayments((prev) => prev.filter((_, i) => i !== idx))

  const canComplete =
    lines.length > 0 && bal <= 0 && payments.length > 0 && (!isB2b || b2bName.trim().length > 0)

  const complete = () => {
    const inv = finalizeOrder(order.id, payments, {
      isB2b,
      customerName: b2bName.trim(),
      customerPan: b2bPan.trim(),
    })
    if (!inv) return
    toast('success', t('billing.invoiceCreated', { no: inv.number }), t('billing.tableFreed', { t: inv.tableNumber }))
    setPrintingInvoice(inv.id)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('billing.payTitle')}
      subtitle={`${t('billing.billFor', { table: tableNumber })} · ${t('billing.grandTotal')} Rs. ${fmtNpr(totals.total, lang)}`}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-fog-500">{t('billing.balance')}</p>
            <p className={cn('font-mono text-[19px] font-extrabold tabular', bal > 0 ? 'text-gold-300' : 'text-mint-300')}>
              Rs. {fmtNpr(bal, lang)}
            </p>
            {bal > 0 && <p className="text-[10.5px] font-semibold text-amber-400">{t('billing.cantComplete')}</p>}
          </div>
          <Button variant="primary" size="lg" disabled={!canComplete} onClick={complete}>
            <Check size={17} />
            {t('billing.complete')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-6 py-5">
        {/* B2B customer capture */}
        <div className="rounded-xl border border-line bg-ink-900/60 px-4 py-3">
          <Toggle checked={isB2b} onChange={setIsB2b} label={t('billing.b2b')} />
          {isB2b && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('billing.b2bName')}>
                <Input autoFocus value={b2bName} onChange={(e) => setB2bName(e.target.value)} placeholder="Everest Tech Pvt. Ltd." />
              </Field>
              <Field label={t('billing.b2bPan')}>
                <Input
                  value={b2bPan}
                  onChange={(e) => setB2bPan(e.target.value)}
                  inputMode="numeric"
                  placeholder="301234567"
                  className="font-mono"
                />
              </Field>
            </div>
          )}
        </div>

        {/* payment methods */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('billing.payTitle')}</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = METHOD_ICON[m]
              const active = m === method
              const pm = PAYMENT_META[m]
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-all',
                    active ? pm.chip : 'border-line-strong bg-ink-900 text-fog-400 hover:border-ink-500 hover:text-fog-200'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-center text-[11.5px] font-bold leading-tight">{lang === 'ne' ? pm.labelNe : pm.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* method entry */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={method}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
            className="space-y-3 rounded-xl border border-line-strong bg-ink-900/60 p-4"
          >
            {method === 'cash' ? (
              <>
                <Field label={t('billing.tender')}>
                  <Input
                    autoFocus
                    inputMode="decimal"
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value)}
                    placeholder={fmtNpr(bal, 'en')}
                    className="font-mono"
                  />
                </Field>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('billing.cashQuick')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setTendered(String(bal))}
                      className="cursor-pointer rounded-md border border-mint-400/40 bg-mint-400/10 px-2.5 py-1 text-[11.5px] font-bold text-mint-300 transition-colors hover:bg-mint-400/20"
                    >
                      {t('billing.exact')}
                    </button>
                    {QUICK_TENDER.map((v) => (
                      <button
                        key={v}
                        onClick={() => setTendered(String(v))}
                        className="cursor-pointer rounded-md border border-line-strong px-2.5 py-1 font-mono text-[11.5px] font-semibold text-fog-300 transition-colors hover:border-ink-500 hover:text-fog-100"
                      >
                        {nd(v)}
                      </button>
                    ))}
                  </div>
                </div>
                {tenderedNum > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-ink-850 px-3 py-2 text-[12px]">
                    <span className="font-semibold text-fog-300">{t('billing.change')}</span>
                    <span className="font-mono font-bold tabular text-gold-300">Rs. {fmtNpr(changeDue, lang)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  {isQr && (
                    <PseudoQr hash={hashPayload({ method, orderId: order.id, amount: totals.total })} size={76} />
                  )}
                  <div className="min-w-0 flex-1 space-y-3">
                    <Field label={t('billing.reference')}>
                      <Input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={`${REF_PREFIX[method]}-XXXXXX`}
                        className="font-mono"
                      />
                    </Field>
                    <Field label={t('common.amount')}>
                      <Input
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={fmtNpr(bal, 'en')}
                        className="font-mono"
                      />
                    </Field>
                  </div>
                </div>
                <div>
                  <Button variant="secondary" size="sm" disabled={verify === 'verifying'} onClick={startVerify}>
                    {verify === 'verifying' ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        {t('billing.verifying', { gateway: lang === 'ne' ? meta.labelNe : meta.label })}
                      </>
                    ) : verify === 'verified' ? (
                      <>
                        <BadgeCheck size={14} className="text-mint-300" />
                        {t('billing.verified')}
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        {t('billing.verify')}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-fog-500">{t('billing.digitalHint')}</p>
              </>
            )}

            <Button variant="gold" className="w-full" disabled={applied <= 0 || bal <= 0} onClick={addPayment}>
              {t('billing.addPayment')} · Rs. {fmtNpr(applied, lang)}
            </Button>
          </motion.div>
        </AnimatePresence>

        {/* applied part-payments */}
        {payments.length > 0 && (
          <div className="rounded-xl border border-line bg-ink-900/60 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('billing.paid')}</p>
            <ul className="space-y-1.5">
              {payments.map((p, idx) => {
                const pm = PAYMENT_META[p.method]
                return (
                  <li
                    key={`${p.at}-${idx}`}
                    className="flex items-center gap-2.5 rounded-lg border border-line bg-ink-900/60 px-3 py-2"
                  >
                    <span className={cn('rounded-md border px-2 py-0.5 text-[10.5px] font-bold', pm.chip)}>
                      {lang === 'ne' ? pm.labelNe : pm.label}
                    </span>
                    <span className="truncate font-mono text-[11.5px] text-fog-500">
                      {p.reference ? `#${p.reference}` : p.tendered !== undefined ? `${t('billing.tender')} ${fmtNpr(p.tendered, lang)}` : ''}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[13px] font-bold tabular text-fog-100">
                      Rs. {fmtNpr(p.amount, lang)}
                    </span>
                    <button
                      onClick={() => removePayment(idx)}
                      aria-label={t('common.remove')}
                      className="shrink-0 rounded-md p-1 text-fog-500 transition-colors hover:bg-ink-750 hover:text-crimson-300"
                    >
                      <X size={13} />
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5 text-[12.5px]">
              <span className="font-semibold text-fog-400">{t('billing.remaining')}</span>
              <span className={cn('font-mono font-bold tabular', bal > 0 ? 'text-gold-300' : 'text-mint-300')}>
                Rs. {fmtNpr(bal, lang)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ── main view ───────────────────────────────────────────────────────── */

export function Billing() {
  const { t, lang, nd } = useT()
  const s = useApp()

  /* keep the elapsed labels on the rail fresh (re-render every 30s) */
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const bills = useMemo(
    () =>
      [...s.orders]
        .filter((o) => o.status === 'open' && o.lines.some((l) => !l.voided))
        .sort((a, b) => {
          const ar = a.billRequestedAt ? 1 : 0
          const br = b.billRequestedAt ? 1 : 0
          return br - ar || b.openedAt - a.openedAt
        }),
    [s.orders]
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(
    () => bills.find((o) => o.id === selectedId) ?? bills.find((o) => o.id === s.viewParams.orderId) ?? bills[0],
    [bills, selectedId, s.viewParams.orderId]
  )

  /* keep the selection valid as bills come and go */
  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [selected, selectedId])

  const [discountOpen, setDiscountOpen] = useState(false)
  const [splitOpen, setSplitOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [voidLine, setVoidLine] = useState<OrderLine | null>(null)

  const table = selected ? s.tables.find((x) => x.id === selected.tableId) : undefined
  const waiter = selected ? s.staff.find((x) => x.id === selected.waiterId) : undefined
  const totals = selected ? computeTotals(selected, s.business) : null
  const lines = selected ? activeLines(selected) : []
  const voidedLines = selected ? selected.lines.filter((l) => l.voided) : []

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink-900/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[17px] font-extrabold tracking-tight text-fog-100">{t('billing.title')}</h1>
          <Badge tone={bills.length > 0 ? 'crimson' : 'neutral'} dot={bills.length > 0}>
            {t('billing.activeBills')}: {nd(bills.length)}
          </Badge>
        </div>
        {selected && (
          <p className="text-[12px] font-semibold text-fog-400">
            {t('billing.orderNo', { no: selected.number })}
            {selected.partLabel ? ` · ${t(partLabelKey(selected.partLabel))}` : ''}
          </p>
        )}
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* mobile bill strip */}
        <div className="shrink-0 border-b border-line bg-ink-900/50 p-3 lg:hidden">
          {bills.length === 0 ? (
            <p className="text-[12.5px] font-semibold text-fog-500">{t('billing.noActiveBills')}</p>
          ) : (
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto">
              <AnimatePresence initial={false}>
                {bills.map((o) => (
                  <div key={o.id} className="w-[210px] shrink-0">
                    <BillCard order={o} active={o.id === selected?.id} onSelect={() => setSelectedId(o.id)} />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* bills rail (desktop) */}
        <aside className="no-scrollbar hidden w-[320px] shrink-0 overflow-y-auto border-r border-line bg-ink-900/50 p-3 lg:block">
          {bills.length === 0 ? (
            <EmptyState icon={<Wallet size={22} />} title={t('billing.noActiveBills')} className="py-10" />
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {bills.map((o) => (
                  <BillCard key={o.id} order={o} active={o.id === selected?.id} onSelect={() => setSelectedId(o.id)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </aside>

        {/* selected bill */}
        {selected && totals ? (
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink-900/40 px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-[16px] font-extrabold tracking-tight text-fog-100">
                  {t('billing.billFor', { table: table?.number ?? '' })}
                </h2>
                <p className="text-[11.5px] text-fog-500">
                  {t('billing.orderNo', { no: selected.number })} · {lang === 'ne' ? waiter?.nameNe : waiter?.name} ·{' '}
                  {t('tables.since', { time: formatTime(new Date(selected.openedAt), lang) })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.billRequestedAt && (
                  <Badge tone="gold" dot>
                    {t('tables.billed')}
                  </Badge>
                )}
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-fog-400">
                  <Users size={13} />
                  {nd(selected.guests)}
                </span>
              </div>
            </div>

            {/* lines */}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <EmptyState icon={<Printer size={20} />} title={t('billing.needOneLine')} className="py-10" />
              ) : (
                <ul className="mx-auto max-w-[560px] space-y-2">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <BillLine key={l.id} line={l} onVoid={() => setVoidLine(l)} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              {voidedLines.length > 0 && (
                <div className="mx-auto mt-4 max-w-[560px] border-t border-line pt-2.5">
                  {voidedLines.map((l) => (
                    <p
                      key={l.id}
                      className="flex justify-between gap-2 py-0.5 text-[11px] text-fog-600 line-through decoration-fog-500/60"
                    >
                      <span className="truncate">
                        {lang === 'ne' ? l.nameNe : l.name} ×{nd(l.qty)}
                      </span>
                      <span>{t('billing.voidedLine')}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* totals + actions */}
            <div className="shrink-0 border-t border-line-strong bg-ink-900/60 px-5 py-4">
              <div className="mx-auto max-w-[560px]">
                <dl className="space-y-1 text-[12.5px] text-fog-400">
                  <div className="flex justify-between">
                    <dt>{t('common.subtotal')}</dt>
                    <dd className="font-mono tabular">Rs. {fmtNpr(totals.gross, lang)}</dd>
                  </div>
                  {selected.discount && (
                    <div className="flex justify-between text-gold-300">
                      <dt>
                        {t('common.discount')}{' '}
                        {selected.discount.type === 'percent' ? `${nd(selected.discount.value)}%` : ''}
                      </dt>
                      <dd className="font-mono tabular">− Rs. {fmtNpr(totals.discountAmount, lang)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>{t('billing.sc', { p: nd(s.business.serviceChargePct) })}</dt>
                    <dd className="font-mono tabular">Rs. {fmtNpr(totals.serviceCharge, lang)}</dd>
                  </div>
                  <div className="flex justify-between text-fog-500">
                    <dt>
                      {t('billing.vatLine')} · {t('billing.taxable')}
                    </dt>
                    <dd className="font-mono tabular">Rs. {fmtNpr(totals.vat, lang)}</dd>
                  </div>
                </dl>
                <div className="mt-2.5 flex items-baseline justify-between border-t border-line pt-2.5">
                  <span className="text-[13px] font-bold uppercase tracking-wide text-fog-300">{t('billing.grandTotal')}</span>
                  <span className="font-mono text-[24px] font-extrabold tabular text-fog-100">Rs. {fmtNpr(totals.total, lang)}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setDiscountOpen(true)}>
                    <Percent size={15} />
                    {t('billing.applyDiscount')}
                  </Button>
                  <Button variant="outline" onClick={() => setSplitOpen(true)}>
                    <Split size={15} />
                    {t('billing.split')}
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className="col-span-2"
                    disabled={lines.length === 0}
                    onClick={() => setPayOpen(true)}
                  >
                    <Wallet size={16} />
                    {t('billing.charge')} — Rs. {fmtNpr(totals.total, lang)}
                  </Button>
                  {lines.length === 0 && (
                    <p className="col-span-2 text-center text-[11.5px] font-semibold text-crimson-300">
                      {t('billing.needOneLine')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-h-0 flex-1 items-center justify-center">
            <EmptyState icon={<Wallet size={26} />} title={t('billing.noActiveBills')} hint={t('billing.digitalHint')} />
          </section>
        )}
      </div>

      {/* modals */}
      <VoidLineModal
        order={selected ?? null}
        line={voidLine}
        open={Boolean(voidLine)}
        onClose={() => setVoidLine(null)}
      />
      {selected && (
        <>
          <DiscountModal order={selected} open={discountOpen} onClose={() => setDiscountOpen(false)} />
          <SplitModal order={selected} open={splitOpen} onClose={() => setSplitOpen(false)} />
        </>
      )}
      <PaymentModal
        order={selected ?? null}
        tableNumber={table?.number ?? ''}
        business={s.business}
        open={payOpen && Boolean(selected)}
        onClose={() => setPayOpen(false)}
      />
    </div>
  )
}
