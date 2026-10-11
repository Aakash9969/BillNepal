import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloudOff, Fingerprint, Languages, ShieldCheck } from 'lucide-react'
import { useApp } from '@/store'
import { useT } from '@/i18n/useT'
import { ROLE_META } from '@/types'
import { Button } from '@/components/ui/Button'
import { Logo, Wordmark } from '@/components/ui/Logo'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/cn'

function PinDots({ count, filled, error }: { count: number; filled: number; error: number }) {
  return (
    <motion.div
      key={error}
      animate={error > 0 ? { x: [0, -10, 10, -7, 7, 0] } : undefined}
      transition={{ duration: 0.4 }}
      className="flex justify-center gap-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ scale: i < filled ? 1 : 0.82 }}
          className={cn(
            'h-3.5 w-3.5 rounded-full border-2 transition-colors duration-150',
            error > 0
              ? 'border-crimson-400 bg-crimson-500/25'
              : i < filled
                ? 'border-crimson-400 bg-crimson-500'
                : 'border-line-strong bg-transparent'
          )}
        />
      ))}
    </motion.div>
  )
}

export function Login() {
  const { t, lang } = useT()
  const staff = useApp((s) => s.staff)
  const login = useApp((s) => s.login)
  const setLang = useApp((s) => s.setLang)
  const business = useApp((s) => s.business)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(0)

  const selected = useMemo(() => staff.find((s) => s.id === selectedId) ?? null, [staff, selectedId])

  const press = (d: string) => {
    if (!selected || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) {
      const ok = login(selected.id, next)
      if (!ok) {
        setTimeout(() => {
          setPin('')
          setError((e) => e + 1)
        }, 220)
      }
    }
  }
  const back = () => setPin((p) => p.slice(0, -1))

  /* physical keyboard: digits type the PIN, Backspace deletes, Escape deselects */
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') back()
      else if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, pin, press, back])

  const features: [React.ReactNode, string, string][] = [
    [<ShieldCheck key="s" size={17} className="text-mint-300" />, t('login.feature1'), t('login.feature1Sub')],
    [<CloudOff key="c" size={17} className="text-gold-300" />, t('login.feature2'), t('login.feature2Sub')],
    [<Languages key="l" size={17} className="text-sky-300" />, t('login.feature3'), t('login.feature3Sub')],
  ]

  return (
    <div className="relative flex min-h-full overflow-hidden">
      {/* photo background with a dark readability overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-ink-950/78" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/60" aria-hidden="true" />

      {/* ── brand pane ── */}
      <section className="relative z-10 hidden flex-1 flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-3.5">
          <Logo size={46} />
          <Wordmark size="lg" />
        </div>

        <div className="max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-[30px] font-extrabold leading-tight tracking-tight text-fog-100"
          >
            {t('login.tagline')}
          </motion.h1>
          <ul className="mt-8 space-y-4">
            {features.map(([icon, title, sub], i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-3.5"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-strong bg-ink-850">{icon}</span>
                <div>
                  <p className="text-[14.5px] font-bold text-fog-100">{title}</p>
                  <p className="text-[12.5px] text-fog-400">{sub}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="text-[11.5px] text-fog-500">
          {business.name} · Durbar Marg, Kathmandu · {t('top.fy')} 2083/84
        </p>
      </section>

      {/* ── auth card ── */}
      <section className="relative z-10 flex w-full items-center justify-center p-5 sm:p-8 lg:w-[520px] lg:flex-none">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="w-full max-w-[440px] rounded-3xl border border-line bg-ink-900/85 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 lg:hidden">
              <Logo size={36} />
              <Wordmark />
            </div>
            <div className="ml-auto">
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
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {!selected ? (
              <motion.div key="staff" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }} transition={{ duration: 0.24 }}>
                <p className="text-[13.5px] font-semibold text-fog-200">{t('login.chooseStaff')}</p>
                <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                  {staff.map((m, i) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedId(m.id)
                        setPin('')
                      }}
                      className="group cursor-pointer rounded-2xl border border-line-strong bg-ink-850 p-3 text-left transition-all hover:border-crimson-400/40 hover:bg-ink-800"
                    >
                      <span className={cn('grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-[14px] font-extrabold text-ink-950', m.hue)}>
                        {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </span>
                      <p className="mt-2 truncate text-[13.5px] font-bold text-fog-100">{lang === 'ne' ? m.nameNe : m.name}</p>
                      <p className="text-[11px] font-semibold text-fog-500">{lang === 'ne' ? ROLE_META[m.role].labelNe : ROLE_META[m.role].label}</p>
                      <p className="mt-1.5 inline-block rounded-md bg-ink-950 px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.2em] text-fog-500 group-hover:text-gold-300">
                        {m.pin.replace(/./g, '·')} {m.pin}
                      </p>
                    </motion.button>
                  ))}
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-fog-500">
                  <Fingerprint size={13} className="text-gold-400" />
                  {t('login.demoHint')}
                </p>
              </motion.div>
            ) : (
              <motion.div key="pin" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }} transition={{ duration: 0.24 }}>
                <button onClick={() => setSelectedId(null)} className="mb-4 cursor-pointer text-[12px] font-semibold text-fog-400 transition-colors hover:text-fog-100">
                  ← {t('common.back')}
                </button>
                <div className="mb-4 flex items-center gap-3">
                  <span className={cn('grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-[14.5px] font-extrabold text-ink-950', selected.hue)}>
                    {selected.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-fog-100">{lang === 'ne' ? selected.nameNe : selected.name}</p>
                    <p className="text-[12px] text-fog-500">{t('login.enterPin')}</p>
                  </div>
                </div>

                <PinDots count={4} filled={pin.length} error={error} />
                {error > 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center text-[12px] font-semibold text-crimson-300">
                    {t('login.wrongPin')}
                  </motion.p>
                )}

                <div className="mx-auto mt-5 grid max-w-[264px] grid-cols-3 gap-2.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((k, i) =>
                    k === '' ? (
                      <span key={i} aria-hidden="true" />
                    ) : k === 'back' ? (
                      <Button key={i} variant="ghost" size="lg" onClick={back} aria-label="Backspace" className="h-14 text-base">
                        ⌫
                      </Button>
                    ) : (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => press(k)}
                        className="h-14 cursor-pointer rounded-2xl border border-line-strong bg-ink-850 text-[19px] font-bold text-fog-100 transition-colors hover:border-crimson-400/40 hover:bg-ink-800 active:bg-ink-750"
                      >
                        {lang === 'ne' ? ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'][Number(k)] : k}
                      </motion.button>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  )
}
