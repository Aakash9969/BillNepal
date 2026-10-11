import type { BusinessSettings, Invoice, Lang } from '@/types'
import { PAYMENT_META } from '@/types'
import { amountInWords, fmtNpr } from '@/lib/money'
import { formatBS, formatTime } from '@/lib/nepali'
import { useT } from '@/i18n/useT'
import { Badge } from '@/components/ui/Badge'
import { PseudoQr } from './PseudoQr'
import { cn } from '@/lib/cn'

/**
 * IRD-format VAT tax invoice — B.S. dated, PAN-bearing, 13% VAT,
 * CBMS status stamped. Light "paper" even inside the dark shell.
 */
export function TaxInvoice({ invoice: inv, business }: { invoice: Invoice; business: BusinessSettings }) {
  const { t, lang } = useT()
  const ne = lang === 'ne'

  const bizName = ne ? business.nameNe : business.name
  const bizAddr = ne ? business.addressNe : business.address
  const issued = new Date(inv.issuedAt)

  return (
    <article
      className={cn(
        'paper relative mx-auto w-full max-w-[760px] rounded-xl px-7 py-7 shadow-2xl sm:px-9',
        inv.status === 'voided' && 'opacity-80'
      )}
    >
      {/* ── void stamp ── */}
      {inv.status === 'voided' && (
        <div className="pointer-events-none absolute right-8 top-16 rotate-[-14deg] rounded-lg border-4 border-[#b3122b] px-4 py-1 text-2xl font-black tracking-[0.3em] text-[#b3122b]/80">
          VOID · रद्द
        </div>
      )}

      {/* ── business header ── */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-[#10131c] pb-4">
        <div>
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-[#10131c]">{bizName}</h1>
          <p className="mt-0.5 text-[12.5px] text-[#3b4256]">{bizAddr}</p>
          <p className="text-[12.5px] text-[#3b4256]">
            {business.phone} · {business.email}
          </p>
        </div>
        <div className="shrink-0 rounded-lg bg-[#10131c] px-3.5 py-2 text-center text-white">
          <p className="text-[10px] font-bold tracking-[0.22em] text-[#f2ce7a]">PAN</p>
          <p className="font-mono text-[15px] font-bold tracking-wider">{ne ? neDigitsOf(business.pan) : business.pan}</p>
        </div>
      </header>

      {/* ── title ── */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-black tracking-[0.14em] text-[#b3122b]">
          {t('taxInv.title')} <span className="font-bold text-[#10131c]">· {t('taxInv.titleNe')}</span>
        </h2>
        <Badge tone={inv.cbmsStatus === 'synced' ? 'mint' : 'amber'} dot>
          {inv.cbmsStatus === 'synced' ? t('taxInv.synced') : t('taxInv.pending')}
        </Badge>
      </div>

      {/* ── meta ── */}
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg bg-[#10131c]/[0.04] px-4 py-3 text-[12px] sm:grid-cols-4">
        <div>
          <dt className="font-semibold text-[#6b7280]">{t('taxInv.invoiceNo')}</dt>
          <dd className="font-mono text-[13px] font-bold text-[#10131c]">{ne ? neDigitsOf(inv.number) : inv.number}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#6b7280]">{t('taxInv.dateBs')}</dt>
          <dd className="font-semibold text-[#10131c]">{formatBS(issued, lang)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#6b7280]">{t('taxInv.dateAd')}</dt>
          <dd className="text-[#10131c]">
            {issued.toLocaleDateString('en-GB')} {formatTime(issued, 'en')}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#6b7280]">{t('top.fy')}</dt>
          <dd className="text-[#10131c]">{ne ? neDigitsOf(inv.fiscalYear) : inv.fiscalYear}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#6b7280]">{t('taxInv.table')}</dt>
          <dd className="text-[#10131c]">{ne ? neDigitsOf(inv.tableNumber) : inv.tableNumber}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#6b7280]">{t('taxInv.cashier')}</dt>
          <dd className="text-[#10131c]">{inv.by}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#6b7280]">{t('taxInv.customer')}</dt>
          <dd className="text-[#10131c]">{inv.isB2b ? inv.customerName : t('inv.walkin')}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#6b7280]">{inv.isB2b ? t('taxInv.customerPan') : t('common.guests')}</dt>
          <dd className="font-mono text-[#10131c]">
            {inv.isB2b ? inv.customerPan : ne ? neDigitsOf(inv.guests) : inv.guests}
          </dd>
        </div>
      </dl>
      {inv.partLabel && (
        <p className="mt-2 text-[11px] font-semibold text-[#b3122b]">{t('taxInv.partLabel', { p: inv.partLabel })}</p>
      )}

      {/* ── items ── */}
      <table className="mt-4 w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-y-2 border-[#10131c] text-left">
            <th className="w-10 py-1.5 font-bold text-[#10131c]">{t('taxInv.sn')}</th>
            <th className="py-1.5 font-bold text-[#10131c]">{t('taxInv.particulars')}</th>
            <th className="w-14 py-1.5 text-center font-bold text-[#10131c]">{t('common.qty')}</th>
            <th className="w-24 py-1.5 text-right font-bold text-[#10131c]">{t('taxInv.rate')}</th>
            <th className="w-24 py-1.5 text-right font-bold text-[#10131c]">{t('taxInv.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l, i) => (
            <tr key={l.id} className="border-b border-[#10131c]/15 align-top">
              <td className="py-1.5 text-[#3b4256]">{ne ? neDigitsOf(i + 1) : i + 1}</td>
              <td className="py-1.5">
                <p className="font-semibold text-[#10131c]">{ne ? l.nameNe : l.name}</p>
                {l.modifiers.length > 0 && (
                  <p className="text-[11px] text-[#6b7280]">
                    + {l.modifiers.map((m) => (ne ? m.nameNe : m.name)).join(', ')}
                  </p>
                )}
                {l.notes && <p className="text-[11px] italic text-[#b3122b]">“{l.notes}”</p>}
              </td>
              <td className="py-1.5 text-center font-mono text-[#10131c]">{ne ? neDigitsOf(l.qty) : l.qty}</td>
              <td className="py-1.5 text-right font-mono text-[#10131c]">{fmtNpr(l.unitPrice, lang)}</td>
              <td className="py-1.5 text-right font-mono font-bold text-[#10131c]">{fmtNpr(l.qty * l.unitPrice, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── totals ── */}
      <div className="mt-4 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          <PseudoQr hash={inv.irdHash} size={86} />
          <div className="text-[10.5px] leading-relaxed text-[#6b7280]">
            <p className="font-semibold text-[#10131c]">{t('taxInv.qrHint')}</p>
            <p className="mt-1">
              {t('taxInv.copyQr')}: <span className="font-mono">{inv.irdHash}</span>
            </p>
            <p>
              {t('taxInv.cbms')}:{' '}
              <span className="font-mono">{inv.cbmsStatus === 'synced' ? (inv.cbmsSyncedAt ? 'SYNCED' : 'SYNCED') : 'QUEUED'}</span>
            </p>
          </div>
        </div>
        <dl className="w-full max-w-[300px] shrink-0 space-y-1 text-[12.5px]">
          <Row k={t('taxInv.taxable')} v={fmtNpr(inv.taxableAmount, lang)} />
          {inv.discountAmount > 0 && (
            <Row k={`${t('taxInv.discount')} (${inv.discount?.type === 'percent' ? `${inv.discount.value}%` : 'Rs.'})`} v={`− ${fmtNpr(inv.discountAmount, lang)}`} />
          )}
          {inv.serviceCharge > 0 && (
            <Row k={t('taxInv.sc', { p: ne ? neDigitsOf(inv.serviceChargePct) : inv.serviceChargePct })} v={fmtNpr(inv.serviceCharge, lang)} />
          )}
          <Row k={t('taxInv.vat')} v={fmtNpr(inv.vat, lang)} strong />
          <div className="!mt-2 flex items-center justify-between rounded-lg bg-[#10131c] px-3 py-2 text-white">
            <span className="text-[12px] font-bold uppercase tracking-wide">{t('taxInv.grand')}</span>
            <span className="font-mono text-[16px] font-extrabold">Rs. {fmtNpr(inv.total, 'en')}</span>
          </div>
        </dl>
      </div>

      <p className="mt-3 border-t border-dashed border-[#10131c]/25 pt-2.5 text-[11.5px] text-[#3b4256]">
        <span className="font-semibold">{t('taxInv.words')}:</span> {amountInWords(inv.total)}
      </p>

      {/* ── payment ── */}
      <div className="mt-2 flex flex-wrap gap-2">
        {inv.payments.map((p, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#10131c]/20 bg-[#10131c]/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#10131c]"
          >
            {PAYMENT_META[p.method].label}
            {p.reference && <span className="font-mono text-[10px] text-[#6b7280]">#{p.reference}</span>}
            <span className="font-mono">Rs. {fmtNpr(p.amount, 'en')}</span>
          </span>
        ))}
      </div>

      <footer className="mt-4 border-t-2 border-[#10131c] pt-2.5 text-center">
        <p className="text-[10.5px] leading-relaxed text-[#6b7280]">{t('taxInv.footer')}</p>
        <p className="mt-1 text-[12.5px] font-bold text-[#10131c]">{t('taxInv.thanks')}</p>
      </footer>
    </article>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-3">
      <span className={cn('text-[#3b4256]', strong && 'font-bold text-[#10131c]')}>{k}</span>
      <span className={cn('font-mono text-[#10131c]', strong && 'font-bold')}>{v}</span>
    </div>
  )
}

function neDigitsOf(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => '०१२३४५६७८९'[Number(d)])
}
