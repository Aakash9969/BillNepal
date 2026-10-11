import { useEffect, useMemo, useState } from 'react'
import { Ban, Copy, Printer, ReceiptText, Search } from 'lucide-react'
import { useApp } from '@/store'
import { useT } from '@/i18n/useT'
import { buildIrdPayload } from '@/lib/billing'
import { fmtNpr } from '@/lib/money'
import { formatBS, formatTime } from '@/lib/nepali'
import type { Invoice } from '@/types'
import { PAYMENT_META } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { TaxInvoice } from '@/components/invoice/TaxInvoice'

type Filter = 'all' | 'b2b' | 'voided'

/* ── void confirmation ───────────────────────────────────────────────── */

function VoidModal({ inv, onClose }: { inv: Invoice | null; onClose: () => void }) {
  const { t } = useT()
  const voidInvoice = useApp((s) => s.voidInvoice)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (inv) setReason('')
  }, [inv?.id])

  if (!inv) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={t('inv.voidTitle', { no: inv.number })}
      subtitle={t('inv.voidHint')}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            onClick={() => {
              voidInvoice(inv.id, reason.trim())
              onClose()
            }}
          >
            <Ban size={15} />
            {t('inv.void')}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-5">
        <p className="mb-1.5 text-[13px] font-semibold text-fog-200">{t('common.reason')}</p>
        <Input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('common.reason')} />
      </div>
    </Modal>
  )
}

/* ── main view ───────────────────────────────────────────────────────── */

export function Invoices() {
  const { t, lang, nd } = useT()
  const s = useApp()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [showPayload, setShowPayload] = useState(false)
  const [voidId, setVoidId] = useState<string | null>(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...s.invoices]
      .sort((a, b) => b.issuedAt - a.issuedAt)
      .filter((i) =>
        filter === 'voided' ? i.status === 'voided' : filter === 'b2b' ? i.isB2b && i.status === 'active' : true
      )
      .filter(
        (i) =>
          !q ||
          i.number.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.tableNumber.toLowerCase().includes(q) ||
          i.by.toLowerCase().includes(q)
      )
  }, [s.invoices, filter, query])

  const detail = detailId ? (s.invoices.find((i) => i.id === detailId) ?? null) : null
  const voidTarget = voidId ? (s.invoices.find((i) => i.id === voidId) ?? null) : null

  const closeDetail = () => {
    setDetailId(null)
    setShowPayload(false)
  }

  const copyPayload = () => {
    if (!detail) return
    navigator.clipboard
      .writeText(JSON.stringify(buildIrdPayload(detail, s.business), null, 2))
      .then(() => s.toast('success', t('common.copied')))
      .catch(() => undefined)
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 sm:py-6">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-fog-100">{t('inv.title')}</h1>
          <p className="mt-0.5 text-[13px] tabular text-fog-400">
            {nd(list.length)} / {nd(s.invoices.length)}
          </p>
        </div>
        <div className="max-w-full overflow-x-auto no-scrollbar">
          <Segmented<Filter>
            ariaLabel={t('inv.title')}
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: t('inv.filter.all') },
              { id: 'b2b', label: t('inv.filter.b2b') },
              { id: 'voided', label: t('inv.filter.voided') },
            ]}
          />
        </div>
      </div>

      {/* search */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-line-strong bg-ink-900 px-3">
        <Search size={15} className="shrink-0 text-fog-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('inv.searchPlaceholder')}
          className="h-10 w-full bg-transparent text-sm text-fog-100 placeholder:text-fog-500 focus:outline-none"
        />
      </div>

      {/* ledger */}
      {list.length === 0 ? (
        <EmptyState icon={<ReceiptText size={22} />} title={t('inv.noInvoices')} />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line-strong bg-ink-850">
          {list.map((inv) => (
            <li
              key={inv.id}
              onClick={() => setDetailId(inv.id)}
              className="flex cursor-pointer items-center gap-4 border-b border-line px-5 py-3 transition-colors last:border-0 hover:bg-ink-800"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-mono text-[12.5px] font-bold text-fog-100">
                  {inv.number}
                  {inv.partLabel && (
                    <span className="rounded bg-gold-400/15 px-1.5 text-[10px] font-bold text-gold-300">{inv.partLabel}</span>
                  )}
                </p>
                <p className="truncate text-[11.5px] text-fog-500">
                  {inv.tableNumber} · {inv.by} · {formatBS(new Date(inv.issuedAt), lang)}{' '}
                  {formatTime(new Date(inv.issuedAt), lang)}
                </p>
              </div>
              <p className="hidden w-44 shrink-0 truncate text-[12.5px] text-fog-300 md:block">
                {inv.isB2b ? inv.customerName : t('inv.walkin')}
              </p>
              <Badge tone="neutral" className="hidden lg:inline-flex">
                {PAYMENT_META[inv.payments[0]?.method ?? 'cash'].label}
                {inv.payments.length > 1 ? ` +${nd(inv.payments.length - 1)}` : ''}
              </Badge>
              <Badge tone={inv.status === 'voided' ? 'danger' : inv.cbmsStatus === 'synced' ? 'mint' : 'amber'}>
                {inv.status === 'voided' ? t('inv.voided') : inv.cbmsStatus === 'synced' ? t('taxInv.synced') : t('taxInv.pending')}
              </Badge>
              <span className="w-28 shrink-0 text-right font-mono text-[13px] font-bold tabular text-fog-100">
                Rs. {fmtNpr(inv.total, lang)}
              </span>
              <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => s.setPrintingInvoice(inv.id)}
                  aria-label={t('common.print')}
                  title={t('common.print')}
                  className="rounded-lg p-2 text-fog-500 transition-colors hover:bg-ink-750 hover:text-fog-100"
                >
                  <Printer size={15} />
                </button>
                {inv.status === 'active' && (
                  <button
                    onClick={() => setVoidId(inv.id)}
                    aria-label={t('inv.void')}
                    title={t('inv.void')}
                    className="rounded-lg p-2 text-fog-500 transition-colors hover:bg-ink-750 hover:text-crimson-300"
                  >
                    <Ban size={15} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* detail modal — the real IRD sheet */}
      <Modal open={Boolean(detail)} onClose={closeDetail} bare size="lg"
        footer={
          detail ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {detail.status === 'active' && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setVoidId(detail.id)
                      closeDetail()
                    }}
                  >
                    <Ban size={15} />
                    {t('inv.void')}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setShowPayload((v) => !v)}>
                  <ReceiptText size={15} />
                  {t('inv.viewPayload')}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={() => s.setPrintingInvoice(detail.id)}>
                  <Printer size={15} />
                  {t('common.print')}
                </Button>
                <Button onClick={closeDetail}>{t('common.close')}</Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-3 p-4 sm:p-5">
            <TaxInvoice invoice={detail} business={s.business} />
            {showPayload && (
              <div className="overflow-hidden rounded-xl border border-line-strong bg-ink-900">
                <div className="flex items-center justify-between border-b border-line px-4 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-fog-400">{t('inv.viewPayload')}</p>
                  <button
                    onClick={copyPayload}
                    aria-label={t('common.copy')}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold text-fog-400 transition-colors hover:bg-ink-750 hover:text-fog-100"
                  >
                    <Copy size={13} />
                    {t('common.copy')}
                  </button>
                </div>
                <pre className="max-h-64 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-mint-300">
                  {JSON.stringify(buildIrdPayload(detail, s.business), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      <VoidModal inv={voidTarget} onClose={() => setVoidId(null)} />
    </div>
  )
}
