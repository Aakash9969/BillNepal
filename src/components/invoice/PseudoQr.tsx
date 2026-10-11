/**
 * Deterministic QR-style verification glyph rendered from the invoice's
 * local IRD payload hash — with proper finder squares so it scans visually
 * as a verification tile. (Demo visual — not a decodable QR.)
 */
export function PseudoQr({ hash, size = 92 }: { hash: string; size?: number }) {
  const N = 21
  const cells: boolean[] = []
  // derive a stable bit stream from the hash
  let h = 0x811c9dc5
  for (let i = 0; i < hash.length; i++) h = Math.imul(h ^ hash.charCodeAt(i), 16777619) >>> 0
  const rnd = (i: number) => {
    const x = Math.imul(h ^ (i * 2654435761), 2246822519) >>> 0
    return ((x >>> 13) & 1) === 1
  }
  for (let i = 0; i < N * N; i++) cells.push(rnd(i))

  const isFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7
    const ring = (r0: number, c0: number) => {
      const lr = r - r0
      const lc = c - c0
      const onBorder = lr === 0 || lr === 6 || lc === 0 || lc === 6
      const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
      return onBorder || core
    }
    if (inBox(0, 0)) return ring(0, 0)
    if (inBox(0, N - 7)) return ring(0, N - 7)
    if (inBox(N - 7, 0)) return ring(N - 7, 0)
    return null
  }

  const unit = size / N
  const rects: JSX.Element[] = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const f = isFinder(r, c)
      const on = f === null ? cells[r * N + c] : f
      // clear a quiet band around finders
      const nearFinder =
        (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8)
      if (!on) continue
      if (nearFinder && f === null) continue
      rects.push(<rect key={`${r}-${c}`} x={c * unit} y={r * unit} width={unit} height={unit} rx={unit * 0.24} />)
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="IRD verification code">
      <rect x={0} y={0} width={size} height={size} rx={6} fill="#fdfdfb" />
      <g fill="#10131c">{rects}</g>
    </svg>
  )
}
