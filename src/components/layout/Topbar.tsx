import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CloudOff, Menu, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useApp, pendingSyncCount, staffById } from '@/store'
import { useT } from '@/i18n/useT'
import { formatBSFull, formatTime, fiscalYear, nepDigits } from '@/lib/nepali'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/cn'

/** Live clock — BS date + Nepali fiscal year + local time. */
function LiveClock() {
  const { lang, t } = useT()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <p className="text-[13px] font-bold text-fog-100">{formatBSFull(now, lang)}</p>
        <p className="text-[11px] font-medium tabular text-fog-400">
          {t('top.fy')} {lang === 'ne' ? nepDigits(fiscalYear(now)) : fiscalYear(now)} · {formatTime(now, lang)}
          <span className="ml-1.5 text-fog-300">{lang === 'ne' ? nepDigits(String(now.getSeconds()).padStart(2, '0')) : String(now.getSeconds()).padStart(2, '0')}</span>
        </p>
      </div>
    </div>
  )
}

/** IRD CBMS connection/sync pill + offline simulator. */
export function ConnectionCluster() {
  const { t, nd } = useT()
  const online = useApp((s) => s.online)
  const simulated = useApp((s) => s.simulatedOffline)
  const setSimulated = useApp((s) => s.setSimulatedOffline)
  const navigate = useApp((s) => s.navigate)
  const pending = useApp((s) => pendingSyncCount(s))
  const userId = useApp((s) => s.userId)
  const role = useApp((s) => staffById(s, userId ?? '')?.role)

  const syncing = online && pending > 0

  return (
    <div className="flex items-center gap-2">
      <motion.button
        layout
        onClick={() => role === 'owner' && navigate('settings')}
        className={cn(
          'flex h-9 items-center gap-2 rounded-full border px-3.5 text-[12px] font-bold transition-colors',
          !online
            ? 'border-crimson-500/40 bg-crimson-500/12 text-crimson-300'
            : syncing
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
              : 'border-mint-400/30 bg-mint-400/10 text-mint-300'
        )}
      >
        {!online ? (
          <CloudOff size={14} />
        ) : syncing ? (
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}>
            <RefreshCw size={14} />
          </motion.span>
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="dot-pulse absolute inset-0 rounded-full bg-mint-400" />
          </span>
        )}
        <span>{!online ? t('top.offline') : syncing ? t('top.syncing') : t('top.online')}</span>
        {pending > 0 && (
          <span className="rounded-full bg-amber-400/20 px-1.5 py-px font-mono text-[10.5px] font-bold text-amber-400">
            {nd(pending)}
          </span>
        )}
      </motion.button>

      <button
        onClick={() => setSimulated(!simulated)}
        title={simulated ? t('top.restore') : t('top.simulate')}
        className={cn(
          'grid h-9 w-9 cursor-pointer place-items-center rounded-full border transition-colors',
          simulated
            ? 'border-crimson-500/40 bg-crimson-500/12 text-crimson-300'
            : 'border-line-strong bg-ink-850 text-fog-400 hover:border-ink-500 hover:text-fog-200'
        )}
      >
        {simulated ? <WifiOff size={15} /> : <Wifi size={15} />}
      </button>
    </div>
  )
}

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { t } = useT()
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between gap-4 border-b border-line bg-ink-900/80 px-4 backdrop-blur sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-line-strong bg-ink-850 text-fog-300 transition-colors hover:border-ink-500 hover:text-fog-100 lg:hidden"
        >
          <Menu size={16} />
        </button>
        <div className="hidden md:block">
          <LiveClock />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Segmented<'en' | 'ne'>
          ariaLabel={t('top.language')}
          size="sm"
          value={lang}
          onChange={setLang}
          options={[
            { id: 'en', label: 'EN' },
            { id: 'ne', label: 'नेपाली' },
          ]}
        />
        <span className="h-5 w-px bg-line-strong" />
        <ConnectionCluster />
      </div>
    </header>
  )
}
