import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState,
  AuditEntry,
  Category,
  Discount,
  Invoice,
  Kot,
  KotStatus,
  LineModifier,
  MenuItem,
  Order,
  OrderLine,
  Payment,
  Role,
  StaffMember,
  SyncKind,
  SyncRecord,
  TableT,
  ToastMsg,
  View,
} from '@/types'
import { ROLE_META } from '@/types'
import { buildSeedState } from '@/data/seed'
import { uid } from '@/lib/id'
import { activeLines, createInvoiceFromOrder } from '@/lib/billing'
import { dayKey, fiscalYear } from '@/lib/nepali'
import { translate } from '@/i18n/useT'
import type { DictKey } from '@/i18n/dict'

export interface Store extends AppState {
  /* runtime (not persisted) */
  view: View
  viewParams: { tableId?: string; orderId?: string; invoiceId?: string }
  userId: string | null
  online: boolean
  simulatedOffline: boolean
  toasts: ToastMsg[]
  printingInvoiceId: string | null

  /* auth & nav */
  login: (staffId: string, pin: string) => boolean
  logout: () => void
  navigate: (view: View, params?: Store['viewParams']) => void
  setLang: (lang: AppState['lang']) => void

  /* connection & sync */
  setSimulatedOffline: (offline: boolean) => void
  setOnline: (online: boolean) => void
  syncStep: () => number

  /* orders */
  openOrder: (tableId: string) => string | null
  setGuests: (orderId: string, guests: number) => void
  addItemToOrder: (orderId: string, itemId: string, mods: LineModifier[], qty?: number) => void
  setLineQty: (orderId: string, lineId: string, qty: number) => void
  removeLine: (orderId: string, lineId: string, reason: string) => void
  setLineNotes: (orderId: string, lineId: string, notes: string) => void
  sendToKitchen: (orderId: string) => Kot | null
  requestBill: (orderId: string) => void
  applyDiscount: (orderId: string, discount: Discount | null) => void
  splitOrder: (orderId: string, partALineIds: string[]) => string | null

  /* billing */
  finalizeOrder: (
    orderId: string,
    payments: Payment[],
    opts?: { isB2b?: boolean; customerName?: string; customerPan?: string }
  ) => Invoice | null

  /* staff */
  addStaff: (member: { name: string; nameNe: string; role: Role; pin: string }) => void
  removeStaff: (id: string) => boolean

  /* kitchen */
  setKotStatus: (kotId: string, status: KotStatus) => void

  /* invoices */
  voidInvoice: (invoiceId: string, reason: string) => void

  /* menu */
  upsertItem: (item: MenuItem) => void
  toggleItemAvailable: (itemId: string) => void
  setItemArchived: (itemId: string, archived: boolean) => void
  upsertCategory: (category: Category) => void
  deleteCategory: (categoryId: string) => boolean

  /* settings */
  updateBusiness: (patch: Partial<AppState['business']>) => void
  resetDemo: () => void

  /* internals */
  toast: (kind: ToastMsg['kind'], title: string, desc?: string) => void
  dismissToast: (id: string) => void
  setPrintingInvoice: (invoiceId: string | null) => void
  enqueue: (kind: SyncKind, refId: string, label: string) => void
  log: (action: string, detail: string) => void
}

export const DEFAULT_VIEW: Record<Role, View> = {
  owner: 'dashboard',
  cashier: 'billing',
  waiter: 'tables',
  chef: 'kitchen',
}

const seed = buildSeedState()

export const useApp = create<Store>()(
  persist(
    (set, get) => {
      /* helpers that need `get`/`set` closure */
      const log = (action: string, detail: string) => {
        const s = get()
        const u = s.staff.find((x) => x.id === s.userId)
        const entry: AuditEntry = {
          id: uid('au'),
          at: Date.now(),
          actorId: u?.id ?? 'system',
          actorName: u?.name ?? 'System',
          action,
          detail,
        }
        set({ audit: [entry, ...s.audit].slice(0, 600) })
      }

      const toast = (kind: ToastMsg['kind'], title: string, desc?: string) => {
        const msg: ToastMsg = { id: uid('ts'), kind, title, desc }
        set({ toasts: [msg, ...get().toasts].slice(0, 4) })
      }

      const enqueue = (kind: SyncKind, refId: string, label: string) => {
        const rec: SyncRecord = { id: uid('sq'), kind, refId, label, createdAt: Date.now() }
        set({ syncQueue: [rec, ...get().syncQueue].slice(0, 300) })
      }

      const tr = (key: DictKey, vars?: Record<string, string | number>) => translate(get().lang, key, vars)

      return {
        ...seed,

        /* ── runtime defaults ── */
        view: 'login',
        viewParams: {},
        userId: null,
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        simulatedOffline: false,
        toasts: [],
        printingInvoiceId: null,

        /* ── auth & nav ── */
        login: (staffId, pin) => {
          const s = get()
          const staff = s.staff.find((x) => x.id === staffId)
          if (!staff || staff.pin !== pin) return false
          set({ userId: staff.id })
          log('auth.login', `${staff.name} · ${staff.role}`)
          set({ view: DEFAULT_VIEW[staff.role], viewParams: {} })
          return true
        },

        logout: () => {
          const u = get().staff.find((x) => x.id === get().userId)
          if (u) log('auth.logout', `${u.name} signed out`)
          set({ userId: null, view: 'login', viewParams: {} })
        },

        navigate: (view, params) => set({ view, viewParams: params ?? {} }),

        setLang: (lang) => set({ lang }),

        /* ── connection & sync ── */
        setSimulatedOffline: (offline) => {
          set({ simulatedOffline: offline, online: !offline && (typeof navigator === 'undefined' || navigator.onLine) })
          toast(
            offline ? 'warning' : 'info',
            offline ? tr('top.offline') : tr('top.online'),
            offline ? tr('sync.offlineToast') : tr('sync.onlineToast')
          )
          log(offline ? 'connection.offline' : 'connection.online', offline ? 'Simulated connection loss' : 'Connection restored')
        },

        setOnline: (online) => set({ online: online && !get().simulatedOffline }),

        /** Process one queued record; returns remaining pending count. */
        syncStep: () => {
          const s = get()
          const next = [...s.syncQueue].reverse().find((r) => !r.syncedAt)
          if (!next) return 0
          const now = Date.now()
          const syncQueue = s.syncQueue.map((r) => (r.id === next.id ? { ...r, syncedAt: now } : r))
          let invoices = s.invoices
          if (next.kind === 'invoice' || next.kind === 'invoice-void') {
            invoices = s.invoices.map((i) =>
              i.id === next.refId ? { ...i, cbmsStatus: 'synced' as const, cbmsSyncedAt: now } : i
            )
          }
          let kots = s.kots
          if (next.kind === 'kot') {
            kots = s.kots.map((k) => (k.id === next.refId ? { ...k, syncState: 'synced' as const } : k))
          }
          set({ syncQueue, invoices, kots })
          return syncQueue.filter((r) => !r.syncedAt).length
        },

        /* ── orders ── */
        openOrder: (tableId) => {
          const s = get()
          const existing = s.orders.find((o) => o.tableId === tableId && o.status === 'open')
          if (existing) return existing.id
          const num = s.orderSeq + 1
          const order: Order = {
            id: uid('od'),
            tableId,
            number: `#${num}`,
            guests: 2,
            waiterId: s.userId ?? s.staff.find((x) => x.role === 'waiter')!.id,
            openedAt: Date.now(),
            status: 'open',
            lines: [],
          }
          set({ orders: [...s.orders, order], orderSeq: num })
          log('order.open', `${order.number} · ${s.tables.find((t) => t.id === tableId)?.number}`)
          return order.id
        },

        setGuests: (orderId, guests) => {
          set({
            orders: get().orders.map((o) => (o.id === orderId ? { ...o, guests: Math.max(1, Math.min(20, guests)) } : o)),
          })
        },

        addItemToOrder: (orderId, itemId, mods, qty = 1) => {
          const s = get()
          const item = s.items.find((i) => i.id === itemId)
          if (!item || item.archived || !item.available) return
          const modSum = mods.reduce((a, m) => a + m.price, 0)
          set({
            orders: s.orders.map((o) => {
              if (o.id !== orderId) return o
              const existing = o.lines.find(
                (l) => !l.voided && l.itemId === itemId && l.notes === '' && sameMods(l.modifiers, mods)
              )
              if (existing) {
                return { ...o, lines: o.lines.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + qty } : l)) }
              }
              const line: OrderLine = {
                id: uid('ln'),
                itemId,
                name: item.name,
                nameNe: item.nameNe,
                qty,
                unitPrice: item.price + modSum,
                modifiers: mods,
                notes: '',
              }
              return { ...o, lines: [...o.lines, line] }
            }),
          })
        },

        setLineQty: (orderId, lineId, qty) => {
          const clamped = Math.max(1, Math.min(99, qty))
          set({
            orders: get().orders.map((o) =>
              o.id === orderId ? { ...o, lines: o.lines.map((l) => (l.id === lineId && !l.sentAt ? { ...l, qty: clamped } : l)) } : o
            ),
          })
        },

        removeLine: (orderId, lineId, reason) => {
          const s = get()
          const order = s.orders.find((o) => o.id === orderId)
          const line = order?.lines.find((l) => l.id === lineId)
          set({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? { ...o, lines: o.lines.map((l) => (l.id === lineId ? { ...l, voided: true, voidReason: reason } : l)) }
                : o
            ),
          })
          if (order && line) log('order.line.void', `${order.number} · ${line.name} — ${reason}`)
        },

        setLineNotes: (orderId, lineId, notes) => {
          set({
            orders: get().orders.map((o) =>
              o.id === orderId ? { ...o, lines: o.lines.map((l) => (l.id === lineId ? { ...l, notes } : l)) } : o
            ),
          })
        },

        sendToKitchen: (orderId) => {
          const s = get()
          const order = s.orders.find((o) => o.id === orderId)
          if (!order) return null
          const fresh = order.lines.filter((l) => !l.sentAt && !l.voided)
          if (fresh.length === 0) return null

          const dk = dayKey(new Date())
          const number = (s.kotSeqByDay[dk] ?? 0) + 1
          const kot: Kot = {
            id: uid('kt'),
            number,
            orderId: order.id,
            tableId: order.tableId,
            waiterId: order.waiterId,
            createdAt: Date.now(),
            status: 'queued',
            lines: fresh.map((l) => ({
              lineId: l.id,
              name: l.name,
              nameNe: l.nameNe,
              qty: l.qty,
              notes: l.notes,
              modifiers: l.modifiers,
            })),
            syncState: 'pending',
          }
          const now = Date.now()
          set({
            kots: [kot, ...s.kots],
            kotSeqByDay: { ...s.kotSeqByDay, [dk]: number },
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    lines: o.lines.map((l) => {
                      const hit = fresh.find((f) => f.id === l.id)
                      return hit ? { ...l, sentAt: now, kotId: kot.id } : l
                    }),
                  }
                : o
            ),
          })
          enqueue('kot', kot.id, String(number))
          log('kot.send', `KOT #${number} · ${s.tables.find((t) => t.id === order.tableId)?.number} · ${fresh.length} item(s)`)
          return kot
        },

        requestBill: (orderId) => {
          const s = get()
          const order = s.orders.find((o) => o.id === orderId)
          if (!order) return
          set({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, billRequestedAt: Date.now() } : o)) })
          log('bill.request', `${order.number} · cashier notified`)
          toast('info', tr('billing.payTitle'), `${order.number} → cashier`)
        },

        applyDiscount: (orderId, discount) => {
          const s = get()
          const order = s.orders.find((o) => o.id === orderId)
          if (!order) return
          set({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, discount: discount ?? undefined } : o)) })
          if (discount) {
            log('bill.discount', `${order.number} · ${discount.type === 'percent' ? discount.value + '%' : 'Rs. ' + discount.value} — ${discount.reason}`)
          } else {
            log('bill.discount.remove', order.number)
          }
        },

        splitOrder: (orderId, partALineIds) => {
          const s = get()
          const order = s.orders.find((o) => o.id === orderId)
          if (!order) return null
          const live = activeLines(order)
          const partA = order.lines.filter((l) => partALineIds.includes(l.id) && !l.voided)
          const partB = order.lines.filter((l) => !partALineIds.includes(l.id))
          if (partA.length === 0 || partB.filter((l) => !l.voided).length === 0) return null

          const num = s.orderSeq + 1
          const newOrder: Order = {
            id: uid('od'),
            tableId: order.tableId,
            number: `#${num}`,
            guests: Math.max(1, Math.round(order.guests / 2)),
            waiterId: order.waiterId,
            openedAt: Date.now(),
            status: 'open',
            lines: partA.map((l) => ({ ...l, id: uid('ln') })),
            partLabel: 'A',
          }
          set({
            orderSeq: num,
            orders: [
              ...s.orders.map((o) =>
                o.id === orderId
                  ? { ...o, lines: partB, discount: undefined, billRequestedAt: undefined, partLabel: 'B' as const }
                  : o
              ),
              newOrder,
            ],
          })
          log('bill.split', `${order.number} → ${order.number} (B) + ${newOrder.number} (A)`)
          toast('success', tr('billing.splitDone'))
          return newOrder.id
        },

        /* ── billing ── */
        finalizeOrder: (orderId, payments, opts) => {
          const s = get()
          const order = s.orders.find((o) => o.id === orderId)
          if (!order || activeLines(order).length === 0) return null
          const table = s.tables.find((t) => t.id === order.tableId)
          if (!table) return null
          const user = s.staff.find((x) => x.id === s.userId) ?? s.staff[0]
          const fy = fiscalYear(new Date())
          const seq = (s.invoiceSeqByFy[fy] ?? 0) + 1

          const inv = createInvoiceFromOrder(order, {
            tableNumber: table.number,
            business: s.business,
            cashierId: user.id,
            cashierName: user.name,
            fy,
            seq,
            issuedAt: Date.now(),
            payments,
            isB2b: opts?.isB2b,
            customerName: opts?.customerName,
            customerPan: opts?.customerPan,
            partLabel: order.partLabel,
            syncPending: true,
          })

          set({
            invoices: [inv, ...s.invoices],
            invoiceSeqByFy: { ...s.invoiceSeqByFy, [fy]: seq },
            orders: s.orders.filter((o) => o.id !== orderId),
          })
          enqueue('invoice', inv.id, inv.number)
          log('invoice.create', `${inv.number} · ${table.number} · Rs. ${inv.total}${inv.partLabel ? ` · part ${inv.partLabel}` : ''}`)
          return inv
        },

        /* ── staff ── */
        addStaff: (member) => {
          const staff: StaffMember = { id: uid('st'), hue: ROLE_META[member.role].hue, ...member }
          set({ staff: [...get().staff, staff] })
          log('staff.add', `${staff.name} · ${staff.role}`)
          toast('success', tr('staff.added', { name: staff.name }))
        },

        removeStaff: (id) => {
          const s = get()
          const m = s.staff.find((x) => x.id === id)
          if (!m) return false
          if (id === s.userId) {
            toast('error', tr('staff.cantRemoveSelf'))
            return false
          }
          set({ staff: s.staff.filter((x) => x.id !== id) })
          log('staff.remove', `${m.name} · ${m.role}`)
          toast('success', tr('staff.removed', { name: m.name }))
          return true
        },

        /* ── kitchen ── */
        setKotStatus: (kotId, status) => {
          const s = get()
          const kot = s.kots.find((k) => k.id === kotId)
          set({ kots: s.kots.map((k) => (k.id === kotId ? { ...k, status } : k)) })
          if (kot) log(`kot.${status}`, `KOT #${kot.number} · ${s.tables.find((t) => t.id === kot.tableId)?.number}`)
        },

        /* ── invoices ── */
        voidInvoice: (invoiceId, reason) => {
          const s = get()
          const inv = s.invoices.find((i) => i.id === invoiceId)
          if (!inv || inv.status === 'voided') return
          set({ invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'voided', voidReason: reason } : i)) })
          enqueue('invoice-void', inv.id, inv.number)
          log('invoice.void', `${inv.number} — ${reason}`)
          toast('warning', tr('inv.voidDone', { no: inv.number }))
        },

        /* ── menu ── */
        upsertItem: (item) => {
          const s = get()
          const exists = s.items.some((i) => i.id === item.id)
          set({ items: exists ? s.items.map((i) => (i.id === item.id ? { ...i, ...item } : i)) : [...s.items, item] })
          enqueue('menu', item.id, item.name)
          log(exists ? 'menu.item.update' : 'menu.item.create', `${item.name} · Rs. ${item.price}`)
          toast('success', tr('menu.saved'))
        },

        toggleItemAvailable: (itemId) => {
          const s = get()
          const item = s.items.find((i) => i.id === itemId)
          if (!item) return
          const available = !item.available
          set({ items: s.items.map((i) => (i.id === itemId ? { ...i, available } : i)) })
          enqueue('menu', itemId, item.name)
          log('menu.item.available', `${item.name} → ${available ? 'available' : 'unavailable'}`)
          toast('info', available ? tr('menu.availToast', { item: item.name }) : tr('menu.unavailToast', { item: item.name }))
        },

        setItemArchived: (itemId, archived) => {
          const s = get()
          const item = s.items.find((i) => i.id === itemId)
          if (!item) return
          set({ items: s.items.map((i) => (i.id === itemId ? { ...i, archived, available: archived ? false : i.available } : i)) })
          enqueue('menu', itemId, item.name)
          log(archived ? 'menu.item.archive' : 'menu.item.restore', item.name)
          toast('info', archived ? tr('menu.archivedToast', { item: item.name }) : tr('menu.restoredToast', { item: item.name }))
        },

        upsertCategory: (category) => {
          const s = get()
          const exists = s.categories.some((c) => c.id === category.id)
          set({
            categories: exists
              ? s.categories.map((c) => (c.id === category.id ? { ...c, ...category } : c))
              : [...s.categories, { ...category, sort: s.categories.length + 1 }],
          })
          enqueue('menu', category.id, category.name)
          log(exists ? 'menu.category.update' : 'menu.category.create', category.name)
          toast('success', tr('menu.catSaved'))
        },

        deleteCategory: (categoryId) => {
          const s = get()
          const used = s.items.some((i) => i.categoryId === categoryId)
          if (used) {
            toast('error', tr('menu.catDeleteBlocked'))
            return false
          }
          const cat = s.categories.find((c) => c.id === categoryId)
          set({ categories: s.categories.filter((c) => c.id !== categoryId) })
          if (cat) {
            enqueue('menu', categoryId, cat.name)
            log('menu.category.delete', cat.name)
            toast('success', tr('menu.catDeleted'))
          }
          return true
        },

        /* ── settings ── */
        updateBusiness: (patch) => {
          set({ business: { ...get().business, ...patch } })
          enqueue('settings', 'business', Object.keys(patch).join(', '))
          log('settings.update', Object.keys(patch).join(', '))
          toast('success', tr('settings.savedToast'))
        },

        resetDemo: () => {
          const fresh = buildSeedState()
          set({
            ...fresh,
            userId: null,
            view: 'login',
            viewParams: {},
            toasts: [],
            simulatedOffline: false,
            online: typeof navigator === 'undefined' ? true : navigator.onLine,
          })
        },

        /* ── internals ── */
        toast,
        dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
        setPrintingInvoice: (invoiceId) => set({ printingInvoiceId: invoiceId }),
        enqueue,
        log,
      }
    },
    {
      name: 'billnepal-v1',
      version: 2, /* v2: transliterated Nepali menu names — old persisted data reseeds */
      partialize: (s) => {
        const {
          view: _v,
          viewParams: _vp,
          toasts: _t,
          printingInvoiceId: _p,
          online: _o,
          ...persisted
        } = s
        void _v
        void _vp
        void _t
        void _p
        void _o
        return persisted as Store
      },
    }
  )
)

function sameMods(a: LineModifier[], b: LineModifier[]): boolean {
  if (a.length !== b.length) return false
  const ka = a.map((m) => m.optionId).sort()
  const kb = b.map((m) => m.optionId).sort()
  return ka.every((k, i) => k === kb[i])
}

/* ── Selectors (pure, take state or useApp.getState()) ───────────────── */

export function ordersForTable(s: Store, tableId: string): Order[] {
  return s.orders.filter((o) => o.tableId === tableId && o.status === 'open')
}

export type DerivedTableStatus = 'available' | 'occupied' | 'billed'

export function tableStatusOf(s: Store, tableId: string): DerivedTableStatus {
  const os = ordersForTable(s, tableId)
  if (os.length === 0) return 'available'
  return os.some((o) => o.billRequestedAt) ? 'billed' : 'occupied'
}

export function staffById(s: Store, id: string): StaffMember | undefined {
  return s.staff.find((x) => x.id === id)
}

export function tableById(s: Store, id: string): TableT | undefined {
  return s.tables.find((t) => t.id === id)
}

export function itemById(s: Store, id: string): MenuItem | undefined {
  return s.items.find((i) => i.id === id)
}

export function categoryById(s: Store, id: string): Category | undefined {
  return s.categories.find((c) => c.id === id)
}

export function orderById(s: Store, id: string): Order | undefined {
  return s.orders.find((o) => o.id === id)
}

export function pendingSyncCount(s: Store): number {
  return s.syncQueue.filter((r) => !r.syncedAt).length
}
