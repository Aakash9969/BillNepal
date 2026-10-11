/**
 * Bikram Sambat calendar utilities.
 *
 * Table = days in each BS month (Baishakh..Chaitra) for BS years 2040–2099,
 * following the reference data used by standard Nepali calendar libraries.
 * Anchor: 2082-01-01 BS = 2025-04-14 AD (Monday).
 */

const BS_DAYS: Record<number, [number, number, number, number, number, number, number, number, number, number, number, number]> = {
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2042: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2043: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2044: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2045: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2046: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2047: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2050: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2054: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2057: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2058: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2059: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2060: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2061: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2062: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2065: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2066: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2069: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2070: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2071: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2072: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2073: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2074: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2075: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2076: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2077: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2078: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2080: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2084: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2088: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2089: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2090: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2091: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2092: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2093: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2094: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2095: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2096: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2097: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2098: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2099: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
}

export const BS_MONTHS_EN = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
]

export const BS_MONTHS_NE = [
  'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत',
]

export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAYS_NE = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार']

const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

const DAY_MS = 86_400_000
/** 2082-01-01 BS (Baishakh 1) === 2025-04-14 AD, Monday. */
const ANCHOR_AD_UTC = Date.UTC(2025, 3, 14)
const ANCHOR_BS = { y: 2082, m: 1, d: 1 }

function monthDays(y: number, m: number): number {
  const row = BS_DAYS[y]
  if (!row) throw new RangeError(`BS year ${y} outside supported calendar 2040–2099`)
  return row[m - 1]
}

function utcMidnight(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

export interface BsDate {
  y: number
  m: number // 1..12
  d: number // 1..32
}

/** AD Date → Bikram Sambat. Throws RangeError outside the supported table. */
export function toBS(date: Date): BsDate {
  const target = utcMidnight(date)
  let cur = ANCHOR_AD_UTC
  const { y: ay, m: am } = ANCHOR_BS
  let y = ay
  let m = am

  if (target >= cur) {
    for (;;) {
      const md = monthDays(y, m)
      if (target < cur + md * DAY_MS) {
        return { y, m, d: Math.round((target - cur) / DAY_MS) + 1 }
      }
      cur += md * DAY_MS
      m++
      if (m > 12) {
        m = 1
        y++
      }
    }
  } else {
    for (;;) {
      m--
      if (m < 1) {
        m = 12
        y--
      }
      cur -= monthDays(y, m) * DAY_MS
      if (target >= cur) {
        return { y, m, d: Math.round((target - cur) / DAY_MS) + 1 }
      }
    }
  }
}

/** Convert 0-9 digits in a string to Devanagari numerals. */
export function nepDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => NE_DIGITS[Number(d)])
}

export type Lang = 'en' | 'ne'

/** "21 Ashwin 2083" / "२१ असोज २०८३" */
export function formatBS(date: Date, lang: Lang): string {
  try {
    const { y, m, d } = toBS(date)
    const s = `${d} ${lang === 'ne' ? BS_MONTHS_NE[m - 1] : BS_MONTHS_EN[m - 1]} ${y}`
    return lang === 'ne' ? nepDigits(s) : s
  } catch {
    return date.toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-GB')
  }
}

/** "Wednesday, 21 Ashwin 2083" / "बुधबार, २१ असोज २०८३" */
export function formatBSFull(date: Date, lang: Lang): string {
  try {
    const { y, m, d } = toBS(date)
    const wd = lang === 'ne' ? WEEKDAYS_NE[date.getDay()] : WEEKDAYS_EN[date.getDay()]
    const s = `${wd}, ${d} ${lang === 'ne' ? BS_MONTHS_NE[m - 1] : BS_MONTHS_EN[m - 1]} ${y}`
    return lang === 'ne' ? nepDigits(s) : s
  } catch {
    return date.toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  }
}

/**
 * Nepali fiscal year label. FY starts on Shrawan 1 (≈ July 16/17).
 * Ashwin 2083 → "2083/84" · Poush 2083 → "2082/83"
 */
export function fiscalYear(date: Date): string {
  const { y, m } = toBS(date)
  const short = (n: number) => String(n % 100).padStart(2, '0')
  return m >= 4 ? `${y}/${short(y + 1)}` : `${y - 1}/${short(y)}`
}

/** "2083/84" → "2083-84" (used inside IRD bill numbers). */
export function fyCode(fy: string): string {
  return fy.replace('/', '-')
}

/** Time of day — 12h for English, 24h with Devanagari digits for Nepali. */
export function formatTime(date: Date, lang: Lang): string {
  if (lang === 'ne') return nepDigits(
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  )
  const h = date.getHours() % 12 || 12
  const ampm = date.getHours() < 12 ? 'AM' : 'PM'
  return `${h}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`
}

/** Local calendar-day key, e.g. "2026-10-07" (used for daily KOT sequences). */
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "21 Ashwin" style short label for charts/tables. */
export function formatBSShort(date: Date, lang: Lang): string {
  try {
    const { m, d } = toBS(date)
    const s = `${d} ${(lang === 'ne' ? BS_MONTHS_NE : BS_MONTHS_EN)[m - 1].slice(0, lang === 'ne' ? 3 : 3)}`
    return lang === 'ne' ? nepDigits(s) : s
  } catch {
    return `${date.getDate()}/${date.getMonth() + 1}`
  }
}
