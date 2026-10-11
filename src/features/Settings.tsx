import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { History, RefreshCw, ShieldCheck, Wifi, WifiOff } from 'lucide-react'
import { useApp, pendingSyncCount } from '@/store'
import { useT } from '@/i18n/useT'
import { fiscalYear, formatBS, formatTime, nepDigits } from '@/lib/nepali'
import type { SyncKind } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/cn'

type Tab = 'business' | 'sync' | 'audit' | 'about'

const SYNC_KEY: Record<SyncKind, 'sync.kot' | 'sync.invoice' | 'sync.invoiceVoid' | 'sync.menu' | 'sync.settings'> = {
  kot: 'sync.kot',
  invoice: 'sync.invoice',
  'invoice-void': 'sync.invoiceVoid',
  menu: 'sync.menu',
  settings: 'sync.settings',
}

const ROADMAP = [
  'roadmap.inventory',
  'roadmap.loyalty',
  'roadmap.payroll',
  'roadmap.accounting',
  'roadmap.qrOrder',
  'roadmap.website',
  'roadmap.whatsapp',
  'roadmap.reservations',
  'roadmap.delivery',
  'roadmap.hotel',
  'roadmap.multiOutlet',
  'roadmap.banquet',
  'roadmap.kds',
  'roadmap.reports',
  'roadmap.deliveryMgmt',
] as const

/* ── business & tax ──────────────────────────────────────────────────── */

function BusinessTab() {
  const { t, lang } = useT()
  const business = useApp((s) => s.business)
  const updateBusiness = useApp((s) => s.updateBusiness)

  const [form, setForm] = useState({
    name: business.name,
    nameNe: business.nameNe,
    address: business.address,
    addressNe: business.addressNe,
    phone: business.phone,
    email: business.email,
    pan: business.pan,
    billPrefix: business.billPrefix,
    idrdBranch: business.idrdBranch,
    scPct: String(business.serviceChargePct),
  })

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const save = () => {
    updateBusiness({
      name: form.name.trim() || business.name,
      nameNe: form.nameNe.trim() || form.name.trim() || business.nameNe,
      address: form.address.trim(),
      addressNe: form.addressNe.trim() || form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      pan: form.pan.trim(),
      billPrefix: form.billPrefix.trim() || 'GB',
      idrdBranch: form.idrdBranch.trim() || '01',
      serviceChargePct: Math.max(0, Math.min(100, parseFloat(form.scPct) || 0)),
    })
  }

  return (
    <section className="rounded-2xl border border-line-strong bg-ink-850 p-5">
      <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('settings.business')}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t('settings.businessName')}>
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label={t('settings.businessNameNe')}>
          <Input value={form.nameNe} onChange={(e) => set({ nameNe: e.target.value })} />
        </Field>
        <Field label={t('settings.address')}>
          <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
        </Field>
        <Field label={`${t('settings.address')} (नेपाली)`}>
          <Input value={form.addressNe} onChange={(e) => set({ addressNe: e.target.value })} />
        </Field>
        <Field label={t('settings.phone')}>
          <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label={t('settings.email')}>
          <Input value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label={t('settings.pan')}>
          <Input value={form.pan} onChange={(e) => set({ pan: e.target.value })} className="font-mono" />
        </Field>
        <Field label={t('settings.billPrefix')}>
          <Input value={form.billPrefix} onChange={(e) => set({ billPrefix: e.target.value })} className="font-mono" />
        </Field>
        <Field label={t('settings.branch')}>
          <Input value={form.idrdBranch} onChange={(e) => set({ idrdBranch: e.target.value })} className="font-mono" />
        </Field>
        <Field label={t('settings.serviceCharge')} hint={t('settings.vatNote')}>
          <Input inputMode="decimal" value={form.scPct} onChange={(e) => set({ scPct: e.target.value })} className="font-mono" />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[12.5px] text-fog-400">
          {t('settings.fy')}:{' '}
          <span className="font-mono font-bold text-gold-300">
            {lang === 'ne' ? nepDigits(fiscalYear(new Date())) : fiscalYear(new Date())}
          </span>
        </p>
        <Button variant="primary" onClick={save}>
          {t('common.save')}
        </Button>
      </div>
    </section>
  )
}

/* ── sync & CBMS ─────────────────────────────────────────────────────── */

function SyncTab() {
  const { t, lang, nd } = useT()
  const online = useApp((s) => s.online)
  const queue = useApp((s) => s.syncQueue)
  const pending = useApp((s) => pendingSyncCount(s))
  const toast = useApp((s) => s.toast)

  const forceSync = () => {
    const st = useApp.getState()
    if (!st.online) {
      toast('warning', t('top.offline'), t('sync.offlineToast'))
      return
    }
    const before = pendingSyncCount(st)
    let guard = 0
    while (st.syncStep() !== 0 && guard++ < 1000) {
      /* drain the outbox one record at a time */
    }
    const n = before - pendingSyncCount(useApp.getState())
    if (n > 0) toast('success', t('sync.doneToast', { n: nd(n) }))
  }

  const rows = [...queue].sort((a, b) => b.createdAt - a.createdAt).slice(0, 60)

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-strong bg-ink-850 p-5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'grid h-10 w-10 place-items-center rounded-xl border',
              online ? 'border-mint-400/30 bg-mint-400/10 text-mint-300' : 'border-crimson-500/40 bg-crimson-500/10 text-crimson-300'
            )}
          >
            {online ? <Wifi size={17} /> : <WifiOff size={17} />}
          </span>
          <div>
            <p className="text-[14px] font-bold text-fog-100">{t('settings.sync')}</p>
            <p className="text-[12px] text-fog-400">
              {t('settings.syncState')}: {online ? t('top.online') : t('top.offline')}
            </p>
          </div>
        </div>
        <Button variant="secondary" disabled={!online || pending === 0} onClick={forceSync}>
          <RefreshCw size={15} />
          {t('settings.forceSync')}
          {pending > 0 && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-mono text-[10.5px] font-bold text-amber-400">
              {nd(pending)}
            </span>
          )}
        </Button>
      </section>

      <section className="rounded-2xl border border-line-strong bg-ink-850">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('settings.queue')}</h2>
          {pending > 0 && (
            <Badge tone="amber" dot>
              {t('settings.pendingCount', { n: nd(pending) })}
            </Badge>
          )}
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={22} />} title={t('settings.queueEmpty')} />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', r.syncedAt ? 'bg-mint-400' : 'bg-amber-400 dot-pulse')} />
                <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-fog-200">
                  {t(SYNC_KEY[r.kind], { label: r.label })}
                </p>
                <p className="hidden shrink-0 text-[11px] tabular text-fog-500 sm:block">
                  {formatBS(new Date(r.createdAt), lang)} · {formatTime(new Date(r.createdAt), lang)}
                </p>
                {r.syncedAt ? (
                  <Badge tone="mint">{formatTime(new Date(r.syncedAt), lang)}</Badge>
                ) : (
                  <Badge tone="amber">{t('taxInv.pending')}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ── audit trail ─────────────────────────────────────────────────────── */

function AuditTab() {
  const { t, lang } = useT()
  const audit = useApp((s) => s.audit)

  return (
    <section className="overflow-hidden rounded-2xl border border-line-strong bg-ink-850">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('settings.audit')}</h2>
        <p className="mt-0.5 text-[12px] text-fog-500">{t('settings.auditHint')}</p>
      </div>
      {audit.length === 0 ? (
        <EmptyState icon={<History size={22} />} title={t('settings.noAudit')} />
      ) : (
        <ul className="max-h-[calc(100vh-340px)] divide-y divide-line overflow-y-auto">
          {audit.slice(0, 120).map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-5 py-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-750 text-[10px] font-extrabold text-fog-300">
                {e.actorName
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-fog-100">
                  {e.actorName} <span className="ml-1.5 font-mono text-[11px] font-semibold text-fog-500">{e.action}</span>
                </p>
                <p className="truncate text-[11.5px] text-fog-400">{e.detail}</p>
              </div>
              <p className="shrink-0 text-right text-[11px] tabular text-fog-500">
                {formatBS(new Date(e.at), lang)}
                <br />
                {formatTime(new Date(e.at), lang)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ── roadmap & demo reset ────────────────────────────────────────────── */

function AboutTab() {
  const { t } = useT()
  const resetDemo = useApp((s) => s.resetDemo)
  const toast = useApp((s) => s.toast)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line-strong bg-ink-850 p-5">
        <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('settings.roadmap')}</h2>
        <p className="mt-0.5 text-[12.5px] text-fog-400">{t('settings.roadmapHint')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {ROADMAP.map((k, i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.3 }}
              className="flex items-center justify-between gap-2 rounded-xl border border-line bg-ink-900/60 px-3.5 py-2.5"
            >
              <p className="truncate text-[12.5px] font-semibold text-fog-200">{t(k)}</p>
              <Badge tone="neutral" className="shrink-0">
                {t('common.planned')}
              </Badge>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-crimson-500/30 bg-crimson-500/[0.05] p-5">
        <h2 className="text-[15px] font-bold tracking-tight text-fog-100">{t('settings.reset')}</h2>
        <p className="mt-0.5 text-[12.5px] text-fog-400">{t('settings.resetHint')}</p>
        <Button variant="danger" className="mt-3" onClick={() => setConfirmOpen(true)}>
          {t('settings.reset')}
        </Button>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('settings.resetConfirm')}
        subtitle={t('settings.resetHint')}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemo()
                toast('success', t('settings.resetDone'))
                setConfirmOpen(false)
              }}
            >
              {t('common.confirm')}
            </Button>
          </div>
        }
      >
        <div className="px-6 py-5">
          <p className="text-[13px] text-fog-300">{t('settings.resetHint')}</p>
        </div>
      </Modal>
    </div>
  )
}

/* ── main view ───────────────────────────────────────────────────────── */

export function Settings() {
  const { t } = useT()
  const [tab, setTab] = useState<Tab>('business')

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[24px] font-extrabold tracking-tight text-fog-100">{t('settings.title')}</h1>
        <div className="max-w-full overflow-x-auto no-scrollbar">
          <Segmented<Tab>
            ariaLabel={t('settings.title')}
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'business', label: t('settings.tabBusiness') },
              { id: 'sync', label: t('settings.tabSync') },
              { id: 'audit', label: t('settings.tabAudit') },
              { id: 'about', label: t('settings.tabAbout') },
            ]}
          />
        </div>
      </div>
      {tab === 'business' && <BusinessTab />}
      {tab === 'sync' && <SyncTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'about' && <AboutTab />}
    </div>
  )
}
