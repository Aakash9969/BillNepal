import type { Invoice, MenuItem, PaymentMethod } from '@/types'
import { PAYMENT_META } from '@/types'
import { dayKey } from './nepali'
import { round2 } from './money'

const DAY_MS = 86_400_000

function startOfToday(now = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Valid = active (not voided) invoices. */
export function activeInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((i) => i.status === 'active')
}

export interface DayStat {
  dayStart: number
  dayKey: string
  date: Date
  revenue: number
  vat: number
  bills: number
}

export function revenueByDay(invoices: Invoice[], days: number, now = new Date()): DayStat[] {
  const valid = activeInvoices(invoices)
  const out: DayStat[] = []
  const today = startOfToday(now).getTime()
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = today - i * DAY_MS
    const next = dayStart + DAY_MS
    const dayInvoices = valid.filter((inv) => inv.issuedAt >= dayStart && inv.issuedAt < next)
    out.push({
      dayStart,
      dayKey: dayKey(new Date(dayStart)),
      date: new Date(dayStart),
      revenue: round2(dayInvoices.reduce((s, x) => s + x.total, 0)),
      vat: round2(dayInvoices.reduce((s, x) => s + x.vat, 0)),
      bills: dayInvoices.length,
    })
  }
  return out
}

export interface TodayStats {
  revenue: number
  vat: number
  bills: number
  guests: number
  avgBill: number
  revenueYesterday: number
  revenueLastWeekSameDay: number
  deltaYesterday: number // ratio, e.g. 0.12 = +12%
  deltaLastWeek: number
  weekRevenue: number
  weekBills: number
  digitalShare: number // 0..1 share of non-cash payments
}

export function todayStats(invoices: Invoice[], now = new Date()): TodayStats {
  const valid = activeInvoices(invoices)
  const today = startOfToday(now).getTime()
  const todays = valid.filter((i) => i.issuedAt >= today)
  const yesterdayStart = today - DAY_MS
  const yesterdays = valid.filter((i) => i.issuedAt >= yesterdayStart && i.issuedAt < today)
  const lastWeekStart = today - 7 * DAY_MS
  const lastWeekSames = valid.filter((i) => i.issuedAt >= lastWeekStart && i.issuedAt < lastWeekStart + DAY_MS)
  const weekStart = today - 6 * DAY_MS
  const weeks = valid.filter((i) => i.issuedAt >= weekStart)

  const sum = (arr: Invoice[]) => round2(arr.reduce((s, x) => s + x.total, 0))
  const revenue = sum(todays)
  const revenueYesterday = sum(yesterdays)
  const revenueLastWeekSameDay = sum(lastWeekSames)
  const guests = todays.reduce((s, i) => s + i.guests, 0)
  const digital = todays.reduce(
    (s, i) => s + i.payments.filter((p) => p.method !== 'cash').reduce((a, p) => a + p.amount, 0),
    0
  )

  return {
    revenue,
    vat: round2(todays.reduce((s, x) => s + x.vat, 0)),
    bills: todays.length,
    guests,
    avgBill: todays.length ? round2(revenue / todays.length) : 0,
    revenueYesterday,
    revenueLastWeekSameDay,
    deltaYesterday: revenueYesterday > 0 ? (revenue - revenueYesterday) / revenueYesterday : 0,
    deltaLastWeek: revenueLastWeekSameDay > 0 ? (revenue - revenueLastWeekSameDay) / revenueLastWeekSameDay : 0,
    weekRevenue: sum(weeks),
    weekBills: weeks.length,
    digitalShare: revenue > 0 ? digital / revenue : 0,
  }
}

export interface PayBreakdown {
  method: PaymentMethod
  amount: number
  count: number
}

export function paymentMix(invoices: Invoice[], sinceMs: number): PayBreakdown[] {
  const valid = activeInvoices(invoices).filter((i) => i.issuedAt >= sinceMs)
  const map = new Map<PaymentMethod, PayBreakdown>()
  for (const p of PAYMENT_META_ORDER) map.set(p, { method: p, amount: 0, count: 0 })
  for (const inv of valid) {
    for (const p of inv.payments) {
      const row = map.get(p.method)
      if (row) {
        row.amount = round2(row.amount + p.amount)
        row.count += 1
      }
    }
  }
  return [...map.values()].filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount)
}

const PAYMENT_META_ORDER: PaymentMethod[] = ['cash', 'esewa', 'khalti', 'fonepay', 'nepalqr', 'card']

export interface TopItem {
  itemId: string
  name: string
  qty: number
  revenue: number
}

export function topItems(invoices: Invoice[], sinceMs: number, items: MenuItem[], limit = 5): TopItem[] {
  const valid = activeInvoices(invoices).filter((i) => i.issuedAt >= sinceMs)
  const map = new Map<string, TopItem>()
  for (const inv of valid) {
    for (const l of inv.lines) {
      if (l.voided) continue
      const row = map.get(l.itemId) ?? { itemId: l.itemId, name: l.name, qty: 0, revenue: 0 }
      row.qty += l.qty
      row.revenue = round2(row.revenue + l.qty * l.unitPrice)
      map.set(l.itemId, row)
    }
  }
  void items
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

/** Newest-first slice of the invoice ledger. */
export function recentInvoices(invoices: Invoice[], limit = 6): Invoice[] {
  return [...invoices].sort((a, b) => b.issuedAt - a.issuedAt).slice(0, limit)
}

export function hourlyRevenue(invoices: Invoice[], now = new Date()): { hour: number; revenue: number }[] {
  const valid = activeInvoices(invoices)
  const today = startOfToday(now).getTime()
  const out: { hour: number; revenue: number }[] = []
  for (let h = 8; h <= 22; h++) out.push({ hour: h, revenue: 0 })
  for (const inv of valid) {
    if (inv.issuedAt < today) continue
    const h = new Date(inv.issuedAt).getHours()
    const row = out.find((x) => x.hour === h)
    if (row) row.revenue = round2(row.revenue + inv.total)
  }
  return out
}
