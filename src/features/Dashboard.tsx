import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  Armchair,
  CircleDollarSign,
  ChefHat,
  Receipt,
  ReceiptText,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useApp, staffById, tableById } from '@/store'
import { useT } from '@/i18n/useT'
import { fmtNpr, fmtNprCompact } from '@/lib/money'
import { paymentMix, recentInvoices, revenueByDay, todayStats, topItems } from '@/lib/stats'
import { formatBSShort, WEEKDAYS_EN, WEEKDAYS_NE, formatTime } from '@/lib/nepali'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Counter } from '@/components/charts/Counter'
import { BarChart } from '@/components/charts/BarChart'
import { Donut } from '@/components/charts/Donut'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PAYMENT_META, ROLE_META, type Role, type StaffMember } from '@/types'
import { cn } from '@/lib/cn'

function Delta({ value, label }: { value: number; label: string }) {
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-bold', up ? 'text-mint-300' : 'text-crimson-300')}>
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {Math.abs(Math.round(value * 100))}% <span className="font-medium text-fog-500">{label}</span>
    </span>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-line-strong bg-ink-850 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold uppercase tracking-wider text-fog-500">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-750 text-fog-400">{icon}</span>
      </div>
      <p className="mt-2 text-[26px] font-extrabold tracking-tight text-fog-100">{value}</p>
      {sub && <div className="mt-1.5">{sub}</div>}
    </motion.div>
  )
}

export function Dashboard() {
  const { t, lang, nd } = useT()
  const s = useApp()
  const invoices = s.invoices
  const user = staffById(s, s.userId ?? '')
  const navigate = s.navigate

  const today = useMemo(() => todayStats(invoices), [invoices])
  const days7 = useMemo(() => revenueByDay(invoices, 7), [invoices])
  const mix = useMemo(() => paymentMix(invoices, Date.now() - 24 * 3600 * 1000), [invoices])
  const top = useMemo(() => topItems(invoices, Date.now() - 24 * 3600 * 1000, s.items, 5), [invoices, s.items])
  const recent = useMemo(() => recentInvoices(invoices, 6), [invoices])

  const occupiedTables = useMemo(
    () => s.tables.filter((tb) => s.orders.some((o) => o.tableId === tb.id && o.status === 'open')),
    [s.tables, s.orders]
  )
  const openKots = useMemo(() => s.kots.filter((k) => k.status !== 'served'), [s.kots])

  const bars = useMemo(
    () =>
      days7.map((d, i) => ({
        label: (lang === 'ne' ? WEEKDAYS_NE : WEEKDAYS_EN)[d.date.getDay()].slice(0, lang === 'ne' ? 4 : 3),
        sublabel: formatBSShort(d.date, lang),
        value: d.revenue,
        highlight: i === days7.length - 1,
      })),
    [days7, lang]
  )
  const maxBar = Math.max(...bars.map((b) => b.value), 1)

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 sm:py-6">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-fog-100">
            {t('dash.greetingOwner', { name: (lang === 'ne' ? user?.nameNe : user?.name) ?? '' })}
          </h1>
          <p className="mt-0.5 text-[13.5px] text-fog-400">{t('dash.subtitle', { business: lang === 'ne' ? s.business.nameNe : s.business.name })}</p>
        </div>
        <Badge tone="gold" dot>{t('dash.remoteNote')}</Badge>
      </motion.div>

      {/* live strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="mb-6 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line-strong bg-ink-900 px-4 py-3"
      >
        <span className="relative mr-1 flex h-2.5 w-2.5">
          <span className="dot-pulse absolute inset-0 rounded-full bg-crimson-400" />
        </span>
        <span className="text-[13px] font-bold text-fog-100">{t('dash.liveNow')}</span>
        <button onClick={() => navigate('tables')} className="rounded-lg px-2 py-0.5 text-[12.5px] font-semibold text-fog-300 transition-colors hover:bg-ink-800 hover:text-fog-100">
          <Armchair size={13} className="mr-1 inline -translate-y-px" />
          {t('dash.tablesOccupied', { n: nd(occupiedTables.length) })}
        </button>
        <button onClick={() => navigate('kitchen')} className="rounded-lg px-2 py-0.5 text-[12.5px] font-semibold text-fog-300 transition-colors hover:bg-ink-800 hover:text-fog-100">
          <ChefHat size={13} className="mr-1 inline -translate-y-px" />
          {t('dash.openKots', { n: nd(openKots.length) })}
        </button>
      </motion.div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={<CircleDollarSign size={16} />}
          label={t('dash.todayRevenue')}
          value={<Counter value={today.revenue} format={(v) => (lang === 'ne' ? `रु. ${fmtNpr(v, 'ne')}` : `Rs. ${fmtNprCompact(v)}`)} />}
          sub={<Delta value={today.deltaYesterday} label={t('dash.vsYesterdayShort')} />}
          delay={0.05}
        />
        <StatCard
          icon={<Receipt size={16} />}
          label={t('dash.billsToday')}
          value={<Counter value={today.bills} format={(v) => nd(Math.round(v))} />}
          sub={<span className="text-[11.5px] text-fog-500">{t('dash.weekBills', { n: nd(today.weekBills) })}</span>}
          delay={0.1}
        />
        <StatCard
          icon={<Users size={16} />}
          label={t('dash.avgBill')}
          value={<Counter value={today.avgBill} format={(v) => fmtNprCompact(v, lang)} />}
          sub={<span className="text-[11.5px] text-fog-500">{t('dash.guestsToday')}: {nd(today.guests)}</span>}
          delay={0.15}
        />
        <StatCard
          icon={<ReceiptText size={16} />}
          label={t('dash.vatCollected')}
          value={<Counter value={today.vat} format={(v) => fmtNpr(v, lang)} />}
          sub={<Delta value={today.deltaLastWeek} label={t('dash.vsLastWeek', { weekday: (lang === 'ne' ? WEEKDAYS_NE : WEEKDAYS_EN)[new Date(Date.now() - 7 * 86400000).getDay()] })} />}
          delay={0.2}
        />
      </div>

      {/* charts row */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="rounded-2xl border border-line-strong bg-ink-850 p-5 xl:col-span-7"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('dash.last7days')}</h2>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fog-500">{t('dash.weekTotal')}</p>
              <p className="font-mono text-[15px] font-extrabold text-gold-300">{fmtNprCompact(today.weekRevenue, lang)}</p>
            </div>
          </div>
          <BarChart data={bars} max={maxBar} lang={lang} formatValue={(v) => fmtNpr(v, lang)} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col justify-center rounded-2xl border border-line-strong bg-ink-850 p-5 xl:col-span-5"
        >
          <h2 className="mb-4 text-[15px] font-bold tracking-tight text-fog-100">{t('dash.payMix')}</h2>
          {mix.length > 0 ? (
            <Donut
              segments={mix.map((m) => ({ method: m.method, amount: m.amount }))}
              centerLabel={t('dash.todayRevenue')}
              centerValue={`Rs. ${fmtNprCompact(today.revenue)}`}
            />
          ) : (
            <EmptyState icon={<CircleDollarSign size={22} />} title={t('dash.noData')} />
          )}
        </motion.section>
      </div>

      {/* bottom row */}
      <div className="mt-4 grid grid-cols-1 gap-4 pb-8 xl:grid-cols-12">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="rounded-2xl border border-line-strong bg-ink-850 p-5 xl:col-span-5"
        >
          <h2 className="mb-4 text-[15px] font-bold tracking-tight text-fog-100">{t('dash.topItems')}</h2>
          {top.length === 0 ? (
            <EmptyState icon={<Receipt size={22} />} title={t('dash.noData')} />
          ) : (
            <ul className="space-y-3">
              {top.map((item, i) => {
                const max = top[0].revenue
                return (
                  <li key={item.itemId} className="group">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-fog-200">
                        <span className={cn('font-mono text-[11px] font-bold', i === 0 ? 'text-gold-300' : 'text-fog-500')}>{nd(i + 1)}</span>
                        <span className="truncate">{item.name}</span>
                      </p>
                      <p className="shrink-0 font-mono text-[12.5px] font-bold tabular text-fog-100">
                        {nd(item.qty)} <span className="text-fog-500">· Rs. {fmtNpr(item.revenue)}</span>
                      </p>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-900">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.revenue / max) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className={cn('h-full rounded-full', i === 0 ? 'bg-gold-grad' : 'bg-ink-600')}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="overflow-hidden rounded-2xl border border-line-strong bg-ink-850 xl:col-span-7"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('dash.recentInvoices')}</h2>
            <button onClick={() => navigate('invoices')} className="text-[12px] font-bold text-crimson-300 transition-colors hover:text-crimson-400">
              {t('inv.title')} →
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={<ReceiptText size={22} />} title={t('dash.noData')} />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((inv) => (
                <li key={inv.id}>
                  <button
                    onClick={() => navigate('invoices')}
                    className="flex w-full cursor-pointer items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-ink-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[12.5px] font-bold text-fog-100">{inv.number}</p>
                      <p className="text-[11.5px] text-fog-500">
                        {tableById(s, inv.tableId)?.number} · {inv.by} · {formatTime(new Date(inv.issuedAt), lang)}
                      </p>
                    </div>
                    <Badge tone="neutral">{PAYMENT_META[inv.payments[0]?.method ?? 'cash'].label}{inv.payments.length > 1 ? ` +${nd(inv.payments.length - 1)}` : ''}</Badge>
                    <Badge tone={inv.status === 'voided' ? 'danger' : inv.cbmsStatus === 'synced' ? 'mint' : 'amber'}>
                      {inv.status === 'voided' ? t('inv.voided') : inv.cbmsStatus === 'synced' ? t('taxInv.synced') : t('taxInv.pending')}
                    </Badge>
                    <span className="shrink-0 font-mono text-[13px] font-bold tabular text-fog-100">Rs. {fmtNpr(inv.total, lang)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* staff & PINs (owner) */}
      <StaffSection />
    </div>
  )
}

/* ── staff & PINs (owner) ────────────────────────────────────────────── */

function StaffSection() {
  const { t, lang } = useT()
  const s = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.48 }}
      className="mt-4 overflow-hidden rounded-2xl border border-line-strong bg-ink-850"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('staff.title')}</h2>
          <p className="mt-0.5 text-[11.5px] text-fog-500">{t('login.demoHint')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus size={14} />
          {t('staff.add')}
        </Button>
      </div>
      <ul className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {s.staff.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-ink-900/60 p-3">
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-ink-950',
                m.hue
              )}
            >
              {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-fog-100">{lang === 'ne' ? m.nameNe : m.name}</p>
              <p className="text-[11px] font-semibold text-fog-500">
                {lang === 'ne' ? ROLE_META[m.role].labelNe : ROLE_META[m.role].label}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-ink-950 px-2 py-0.5 font-mono text-[11px] tracking-[0.2em] text-gold-300">
              {m.pin}
            </span>
            <button
              onClick={() => setRemoveTarget(m)}
              disabled={m.id === s.userId}
              aria-label={t('common.remove')}
              title={m.id === s.userId ? t('staff.cantRemoveSelf') : t('common.remove')}
              className="shrink-0 rounded-lg p-1.5 text-fog-500 transition-colors enabled:cursor-pointer enabled:hover:bg-ink-750 enabled:hover:text-crimson-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      <AddStaffModal open={addOpen} onClose={() => setAddOpen(false)} />
      <RemoveStaffModal member={removeTarget} onClose={() => setRemoveTarget(null)} />
    </motion.section>
  )
}

function AddStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const addStaff = useApp((s) => s.addStaff)
  const staff = useApp((s) => s.staff)
  const toast = useApp((s) => s.toast)

  const [name, setName] = useState('')
  const [nameNe, setNameNe] = useState('')
  const [role, setRole] = useState<Role>('waiter')
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setNameNe('')
      setRole('waiter')
      setPin('')
    }
  }, [open])

  const save = () => {
    const p = pin.trim()
    if (!name.trim() || !/^\d{4}$/.test(p)) {
      toast('error', t('staff.needDetails'))
      return
    }
    if (staff.some((m) => m.pin === p)) {
      toast('error', t('staff.pinTaken'))
      return
    }
    addStaff({ name: name.trim(), nameNe: nameNe.trim() || name.trim(), role, pin: p })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('staff.add')}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save}>
            {t('common.add')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[15px] font-extrabold text-ink-950',
              ROLE_META[role].hue
            )}
          >
            {name.trim()
              ? name
                  .trim()
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : '?'}
          </span>
          <Field label={t('common.name')} className="flex-1">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Sita Karki" />
          </Field>
        </div>
        <Field label={`${t('common.name')} (नेपाली)`}>
          <Input value={nameNe} onChange={(e) => setNameNe(e.target.value)} />
        </Field>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('staff.role')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(['owner', 'cashier', 'waiter', 'chef'] as Role[]).map((r) => {
              const active = role === r
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors',
                    active
                      ? 'border-crimson-400/60 bg-crimson-500/20 text-crimson-200'
                      : 'border-line-strong bg-ink-900 text-fog-400 hover:text-fog-200'
                  )}
                >
                  {lang === 'ne' ? ROLE_META[r].labelNe : ROLE_META[r].label}
                </button>
              )
            })}
          </div>
        </div>
        <Field label={t('staff.pin')} hint={t('login.demoHint')}>
          <Input
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="font-mono tracking-[0.3em]"
          />
        </Field>
      </div>
    </Modal>
  )
}

function RemoveStaffModal({ member, onClose }: { member: StaffMember | null; onClose: () => void }) {
  const { t, lang } = useT()
  const removeStaff = useApp((s) => s.removeStaff)
  if (!member) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={t('staff.removeConfirm', { name: lang === 'ne' ? member.nameNe : member.name })}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            onClick={() => {
              removeStaff(member.id)
              onClose()
            }}
          >
            <Trash2 size={15} />
            {t('common.remove')}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-5">
        <p className="text-[13px] text-fog-300">
          {lang === 'ne' ? ROLE_META[member.role].labelNe : ROLE_META[member.role].label} ·{' '}
          <span className="font-mono">{member.pin}</span>
        </p>
      </div>
    </Modal>
  )
}
