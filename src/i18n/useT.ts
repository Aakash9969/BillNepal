import { useCallback } from 'react'
import type { Lang } from '@/types'
import { useApp } from '@/store'
import { en, ne, type DictKey } from './dict'
import { nepDigits } from '@/lib/nepali'

export type TFn = (key: DictKey, vars?: Record<string, string | number>) => string

/** Plain translate — usable outside React (store actions, engine). */
export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  let str = (lang === 'ne' ? ne[key] : en[key]) ?? en[key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v))
    }
  }
  return str
}

/**
 * Language hook. `t()` interpolates {var} placeholders;
 * `nd()` renders numbers in Devanagari digits when Nepali is active.
 */
export function useT(): { t: TFn; lang: Lang; nd: (s: string | number) => string } {
  const lang = useApp((s) => s.lang)
  const t = useCallback<TFn>((key, vars) => translate(lang, key, vars), [lang])
  const nd = useCallback((s: string | number) => (lang === 'ne' ? nepDigits(s) : String(s)), [lang])
  return { t, lang, nd }
}
