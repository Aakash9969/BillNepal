import type { BusinessSettings, Discount, Invoice, Order, OrderLine, OrderTotals, Payment } from '@/types'
import { VAT_RATE } from '@/types'
import { round2 } from './money'
import { fiscalYear, fyCode } from './nepali'
import { uid } from './id'

/** Sum of active (non-voided) lines — VAT-inclusive gross. */
export function orderGross(order: Order): number {
  return round2(
    order.lines
      .filter((l) => !l.voided)
      .reduce((s, l) => s + l.qty * l.unitPrice, 0)
  )
}

export function lineTotal(l: OrderLine): number {
  return round2(l.qty * l.unitPrice)
}

/**
 * Full bill math for an order under current settings.
 * Menu prices are VAT-inclusive; VAT is back-extracted (13/113).
 */
export function computeTotals(
  order: Order,
  business: Pick<BusinessSettings, 'serviceChargePct'>
): OrderTotals {
  const gross = orderGross(order)
  let discountAmount = 0
  if (order.discount && order.discount.value > 0) {
    discountAmount =
      order.discount.type === 'percent'
        ? round2((gross * Math.min(order.discount.value, 100)) / 100)
        : round2(Math.min(order.discount.value, gross))
  }
  const net = round2(gross - discountAmount)
  const serviceChargePct = business.serviceChargePct
  const serviceCharge = round2((net * serviceChargePct) / 100)
  const total = round2(net + serviceCharge)
  const vat = round2((total * VAT_RATE) / (100 + VAT_RATE))
  const taxableAmount = round2(total - vat)
  return { gross, discountAmount, net, serviceCharge, total, taxableAmount, vat, vatPct: VAT_RATE, serviceChargePct }
}

export function activeLines(order: Order): OrderLine[] {
  return order.lines.filter((l) => !l.voided)
}

/** Total already paid on an invoice. */
export function paidTotal(payments: Payment[]): number {
  return round2(payments.reduce((s, p) => s + p.amount, 0))
}

/** IRD bill number: PREFIX-BRANCH-FY-seq6, e.g. "GB-01-2083-84-000214" */
export function makeInvoiceNumber(business: BusinessSettings, fy: string, seq: number): string {
  return `${business.billPrefix}-${business.idrdBranch}-${fyCode(fy)}-${String(seq).padStart(6, '0')}`
}

/** djb2-style stable hash → hex string, used as the local IRD payload hash. */
export function hashPayload(obj: unknown): string {
  const s = JSON.stringify(obj)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (((h2 >>> 0) * 4294967296 + (h1 >>> 0)) % 0xffffffffffff).toString(16).toUpperCase().padStart(12, '0')
}

/** The JSON payload a CBMS agent would push to IRD for this invoice. */
export function buildIrdPayload(inv: Invoice, business: BusinessSettings) {
  return {
    invoiceNumber: inv.number,
    fiscalYear: inv.fiscalYear,
    irdBranch: business.idrdBranch,
    sellerPan: business.pan,
    sellerName: business.name,
    buyerName: inv.isB2b ? inv.customerName : 'Walk-in Customer',
    buyerPan: inv.isB2b ? inv.customerPan : '',
    invoiceDateBs: inv.issuedAt,
    currency: 'NPR',
    taxableAmount: inv.taxableAmount,
    vat: inv.vat,
    totalAmount: inv.total,
    discount: inv.discountAmount,
    serviceCharge: inv.serviceCharge,
    paymentMethod: inv.payments.map((p) => p.method),
    digitalPayment: inv.payments.some((p) => p.method !== 'cash'),
    voided: inv.status === 'voided',
    items: inv.lines.map((l) => ({
      name: l.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      total: lineTotal(l),
    })),
  }
}

export function fiscalYearFor(date: Date): string {
  return fiscalYear(date)
}

/** Apply discount safely (percent capped 0-100, amount capped at gross). */
export function normalizeDiscount(discount: Discount | undefined, gross: number): Discount | null {
  if (!discount || discount.value <= 0) return null
  if (discount.type === 'percent') {
    return { ...discount, value: Math.min(Math.round(discount.value), 100) }
  }
  return { ...discount, value: Math.min(round2(discount.value), gross) }
}

/** Split payments → how much remains to settle a bill. */
export function remaining(total: number, payments: Payment[]): number {
  return round2(total - paidTotal(payments))
}

/* ── Invoice factory (shared by live flow & seed) ─────────── */

export interface CreateInvoiceOpts {
  tableNumber: string
  business: BusinessSettings
  cashierId: string
  cashierName: string
  fy: string
  seq: number
  issuedAt: number
  payments: Payment[]
  isB2b?: boolean
  customerName?: string
  customerPan?: string
  partLabel?: 'A' | 'B'
  syncPending: boolean
}

/** Build a complete IRD-ready VAT invoice from an order. Pure. */
export function createInvoiceFromOrder(order: Order, opts: CreateInvoiceOpts): Invoice {
  const totals = computeTotals(order, opts.business)
  const number = makeInvoiceNumber(opts.business, opts.fy, opts.seq)
  const lines = activeLines(order).map((l) => ({ ...l }))
  const base: Invoice = {
    id: uid('inv'),
    number,
    fiscalYear: opts.fy,
    orderId: order.id,
    orderNumber: order.number,
    tableId: order.tableId,
    tableNumber: opts.tableNumber,
    waiterId: order.waiterId,
    cashierId: opts.cashierId,
    lines,
    guests: order.guests,
    gross: totals.gross,
    discount: order.discount ?? null,
    discountAmount: totals.discountAmount,
    net: totals.net,
    serviceChargePct: totals.serviceChargePct,
    serviceCharge: totals.serviceCharge,
    taxableAmount: totals.taxableAmount,
    vat: totals.vat,
    total: totals.total,
    isB2b: Boolean(opts.isB2b && opts.customerName),
    customerName: opts.isB2b ? opts.customerName ?? '' : '',
    customerPan: opts.isB2b ? opts.customerPan ?? '' : '',
    payments: opts.payments,
    issuedAt: opts.issuedAt,
    by: opts.cashierName,
    cbmsStatus: opts.syncPending ? 'pending' : 'synced',
    cbmsSyncedAt: opts.syncPending ? undefined : opts.issuedAt,
    irdHash: '',
    partLabel: opts.partLabel,
    status: 'active',
  }
  base.irdHash = hashPayload(buildIrdPayload(base, opts.business))
  return base
}
