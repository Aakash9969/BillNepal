import { nepDigits, type Lang } from './nepali'

/** Round to 2 decimals (paise). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const nf2 = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** South-Asian grouping: 1,23,456.75 (Nepali convention). */
function group2(n: number): string {
  return nf2.format(n)
}

/** "1,23,456" when whole, else "1,23,456.50". */
function groupAuto(n: number): string {
  const r = round2(n)
  return Number.isInteger(r) ? group2(r).replace(/\.00$/, '') : group2(r)
}

/** NPR amount without symbol: "1,234.50" / "१,२३४.५०" */
export function fmtNpr(n: number, lang: Lang = 'en'): string {
  const s = groupAuto(n)
  return lang === 'ne' ? nepDigits(s) : s
}

/** With currency prefix: "Rs. 1,234" / "रु. १,२३४" */
export function fmtNprSym(n: number, lang: Lang = 'en'): string {
  const sym = lang === 'ne' ? 'रु.' : 'Rs.'
  return `${sym} ${fmtNpr(n, lang)}`
}

/** Compact display for dashboard cards: "1.2K" / "12.4L" (Nepali lakh style). */
export function fmtNprCompact(n: number, lang: Lang = 'en'): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1).replace(/\.0$/, '')}${lang === 'ne' ? ' करोड' : ' Cr'}`
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}${lang === 'ne' ? ' लाख' : 'L'}`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}${lang === 'ne' ? 'K' : 'K'}`
  return fmtNpr(n, lang)
}

/* ── Amount in words (South-Asian system, English) ─────────── */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function under1000(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${under1000(n % 100)}` : ''}`
}

function intToWords(n: number): string {
  if (n === 0) return 'Zero'
  const parts: string[] = []
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000
  if (crore) parts.push(`${under1000(crore)} Crore`)
  if (lakh) parts.push(`${under1000(lakh)} Lakh`)
  if (thousand) parts.push(`${under1000(thousand)} Thousand`)
  if (rest) parts.push(under1000(rest))
  return parts.filter(Boolean).join(' ')
}

/** "Rupees Twelve Thousand Three Hundred and Forty Five Only" (with paisa). */
export function amountInWords(n: number): string {
  const v = round2(Math.abs(n))
  const rupees = Math.floor(v)
  const paisa = Math.round((v - rupees) * 100)
  let s = `Rupees ${intToWords(rupees)}`
  if (paisa > 0) s += ` and ${intToWords(paisa)} Paisa`
  return `${s} Only`
}
