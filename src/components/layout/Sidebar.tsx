import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Armchair,
  ChefHat,
  LayoutDashboard,
  BookOpen,
  LogOut,
  ReceiptText,
  Receipt,
  Wallet,
} from 'lucide-react'
import { useApp } from '@/store'
import { useT } from '@/i18n/useT'
import { ROLE_META, type Role, type View } from '@/types'
import { Logo, Wordmark } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'

interface NavItem {
  view: View
  icon: typeof Armchair
  key: 'nav.dashboard' | 'nav.tables' | 'nav.kitchen' | 'nav.billing' | 'nav.invoices' | 'nav.menu' | 'nav.settings'
  group: 'operations' | 'business'
  roles: Role[]
}

const NAV: NavItem[] = [
  { view: 'tables', icon: Armchair, key: 'nav.tables', group: 'operations', roles: ['owner', 'cashier', 'waiter'] },
  { view: 'kitchen', icon: ChefHat, key: 'nav.kitchen', group: 'operations', roles: ['owner', 'waiter', 'chef'] },
  { view: 'billing', icon: Wallet, key: 'nav.billing', group: 'operations', roles: ['owner', 'cashier'] },
  { view: 'invoices', icon: Receipt, key: 'nav.invoices', group: 'operations', roles: ['owner', 'cashier'] },
  { view: 'dashboard', icon: LayoutDashboard, key: 'nav.dashboard', group: 'business', roles: ['owner'] },
  { view: 'menu', icon: BookOpen, key: 'nav.menu', group: 'business', roles: ['owner', 'cashier'] },
  { view: 'settings', icon: ReceiptText, key: 'nav.settings', group: 'business', roles: ['owner'] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const view = useApp((s) => s.view)
  const userId = useApp((s) => s.userId)
  const staff = useApp((s) => s.staff)
  const navigate = useApp((s) => s.navigate)
  const logout = useApp((s) => s.logout)
  const { t, lang } = useT()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const user = staff.find((x) => x.id === userId)
  const role: Role = user?.role ?? 'waiter'
  const items = NAV.filter((i) => i.roles.includes(role))

  const groups = [
    { id: 'operations' as const, label: t('nav.group.operations') },
    { id: 'business' as const, label: t('nav.group.business') },
  ].filter((g) => items.some((i) => i.group === g.id))

  return (
    <>
      {/* mobile scrim */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 cursor-default bg-ink-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-line bg-ink-900 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-5 pb-5 pt-5">
          <Logo size={38} />
          <Wordmark />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((g) => (
            <div key={g.id} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-fog-500">{g.label}</p>
              <ul className="space-y-0.5">
                {items
                  .filter((i) => i.group === g.id)
                  .map((item) => {
                    const active = view === item.view
                    const Icon = item.icon
                    return (
                      <li key={item.view}>
                        <button
                          onClick={() => {
                            navigate(item.view)
                            onClose()
                          }}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
                            active ? 'text-white' : 'text-fog-400 hover:bg-ink-800 hover:text-fog-100'
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="nav-active"
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              className="absolute inset-0 rounded-xl border border-crimson-400/30 bg-crimson-500/15"
                            />
                          )}
                          <span className={cn('relative z-10', active && 'text-crimson-300')}>
                            <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                          </span>
                          <span className="relative z-10">{t(item.key)}</span>
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl bg-ink-850 px-3 py-2.5">
            <span
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-[13px] font-extrabold text-ink-950',
                user?.hue ?? 'from-fog-400 to-fog-500'
              )}
            >
              {user?.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-fog-100">{user?.name}</p>
              <p className="text-[11px] font-semibold text-fog-500">
                {lang === 'ne' ? ROLE_META[role].labelNe : ROLE_META[role].label}
              </p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              aria-label={t('nav.logout')}
              title={t('nav.logout')}
              className="shrink-0 cursor-pointer rounded-lg p-2 text-fog-500 transition-colors hover:bg-ink-750 hover:text-crimson-300"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* logout confirmation */}
      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title={t('nav.logout')}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmLogout(false)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmLogout(false)
                onClose()
                logout()
              }}
            >
              <LogOut size={15} />
              {t('common.confirm')}
            </Button>
          </div>
        }
      >
        <div className="px-6 py-5">
          <p className="text-[13px] text-fog-300">{t('top.signedInAs')}</p>
          <p className="mt-1 text-[15px] font-bold text-fog-100">
            {lang === 'ne' ? user?.nameNe : user?.name}
            <span className="ml-2 text-[12px] font-semibold text-fog-500">
              {lang === 'ne' ? ROLE_META[role].labelNe : ROLE_META[role].label}
            </span>
          </p>
        </div>
      </Modal>
    </>
  )
}
