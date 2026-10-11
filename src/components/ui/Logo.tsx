import { cn } from '@/lib/cn'

/** BillNepal mark — double-pennant Nepal-flag silhouette in a tile. */
export function Logo({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center rounded-xl border border-line-strong bg-ink-850', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width={size * 0.78} height={size * 0.78}>
        <defs>
          <linearGradient id="bn-flag" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F04B62" />
            <stop offset="1" stopColor="#C81F3C" />
          </linearGradient>
        </defs>
        <path d="M20 12 L47 24 L30 29 L47 36 L20 50 Z" fill="url(#bn-flag)" />
        <circle cx="27.5" cy="22.5" r="2.6" fill="#0A0D14" />
        <circle cx="26.5" cy="38.5" r="3.1" fill="#0A0D14" />
      </svg>
    </span>
  )
}

/** Wordmark — English with Devanagari sub-brand. */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={cn('font-extrabold tracking-tight text-fog-100', size === 'md' ? 'text-[17px]' : 'text-[22px]')}>
        Bill<span className="text-crimson-400">Nepal</span>
      </span>
      <span className={cn('mt-0.5 font-semibold text-gold-400', size === 'md' ? 'text-[10px] tracking-[0.18em]' : 'text-[12px] tracking-[0.22em]')}>
        बिलनेपाल · POS
      </span>
    </span>
  )
}
