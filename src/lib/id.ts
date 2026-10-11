/** Compact, collision-safe id generator (no dependency). */
export function uid(prefix?: string): string {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`
}

/** Pseudo-random reference, e.g. gateway transaction ids. */
export function refCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `${prefix}-${s}`
}
