/**
 * BillNepal — domain model
 * All amounts are in NPR paise-safe floats (2-decimal rounded on write).
 * Menu prices are VAT-inclusive, as required for Nepali restaurant menus.
 */

export const VAT_RATE = 13 // %
export const DEFAULT_SERVICE_CHARGE = 10 // % — standard for Nepali restaurants

export type Role = 'owner' | 'cashier' | 'waiter' | 'chef'
export type Lang = 'en' | 'ne'

export type View =
  | 'login'
  | 'dashboard'
  | 'tables'
  | 'order'
  | 'kitchen'
  | 'billing'
  | 'invoices'
  | 'menu'
  | 'settings'

export interface StaffMember {
  id: string
  name: string
  nameNe: string
  role: Role
  pin: string
  hue: string // tailwind gradient classes for the avatar tile
}

export type TableStatus = 'available' | 'occupied' | 'billed' | 'inactive'
export type Zone = 'indoor' | 'terrace' | 'garden'

export interface TableT {
  id: string
  number: string // "T1"
  seats: number
  zone: Zone
}

export type Daypart = 'breakfast' | 'lunch' | 'dinner'

export interface Category {
  id: string
  name: string
  nameNe: string
  icon: string // lucide icon key rendered via <CategoryIcon />
  hue: string // gradient classes
  sort: number
}

export interface ModifierOption {
  id: string
  name: string
  nameNe: string
  price: number // absolute add-on price (VAT-inclusive), 0 = free
}

export interface ModifierGroup {
  id: string
  name: string
  nameNe: string
  options: ModifierOption[]
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  nameNe: string
  desc: string
  descNe: string
  price: number // VAT-inclusive menu price
  veg: boolean
  spice: 0 | 1 | 2 | 3
  available: boolean
  archived: boolean
  dayparts: Daypart[] // empty = all day
  modifierGroupIds: string[]
}

export interface LineModifier {
  optionId: string
  name: string
  nameNe: string
  price: number
}

export interface OrderLine {
  id: string
  itemId: string
  name: string
  nameNe: string
  qty: number
  unitPrice: number // item price + modifier add-ons (VAT-inclusive)
  modifiers: LineModifier[]
  notes: string
  sentAt?: number // timestamp when pushed to kitchen (KOT)
  kotId?: string
  voided?: boolean
  voidReason?: string
}

export type OrderStatus = 'open' | 'paid'

export interface Discount {
  type: 'percent' | 'amount'
  value: number
  reason: string
}

export interface Order {
  id: string
  tableId: string
  number: string // running order number, e.g. "#128"
  guests: number
  waiterId: string
  openedAt: number
  status: OrderStatus
  lines: OrderLine[]
  discount?: Discount
  /** set when the waiter flags the cashier: "bill please" */
  billRequestedAt?: number
  /** set on split — carried onto the invoice as "Part A/B of split bill" */
  partLabel?: 'A' | 'B'
}

export type KotStatus = 'queued' | 'preparing' | 'ready' | 'served'

export interface KotLine {
  lineId: string
  name: string
  nameNe: string
  qty: number
  notes: string
  modifiers: LineModifier[]
}

export interface Kot {
  id: string
  number: number // daily sequential KOT number
  orderId: string
  tableId: string
  waiterId: string
  createdAt: number
  status: KotStatus
  lines: KotLine[]
  syncState: 'synced' | 'pending'
}

export type PaymentMethod =
  | 'cash'
  | 'esewa'
  | 'khalti'
  | 'fonepay'
  | 'nepalqr'
  | 'card'

export interface Payment {
  method: PaymentMethod
  amount: number // applied amount
  tendered?: number // for cash — notes handed over
  reference?: string // gateway txn reference
  at: number
}

export type CbmsStatus = 'synced' | 'pending'

export interface Invoice {
  id: string
  number: string // IRD bill no, e.g. "GB-2083-84-000214"
  fiscalYear: string // "2083/84"
  orderId: string
  orderNumber: string
  tableId: string
  tableNumber: string
  waiterId: string
  cashierId: string
  lines: OrderLine[]
  guests: number
  gross: number
  discount: Discount | null
  discountAmount: number
  net: number
  serviceChargePct: number
  serviceCharge: number
  taxableAmount: number
  vat: number
  total: number
  isB2b: boolean
  customerName: string
  customerPan: string
  payments: Payment[]
  issuedAt: number
  by: string // staff name snapshot
  cbmsStatus: CbmsStatus
  cbmsSyncedAt?: number
  irdHash: string
  partLabel?: string // "A" | "B" when bill was split
  status: 'active' | 'voided'
  voidReason?: string
}

export type SyncKind =
  | 'kot'
  | 'invoice'
  | 'invoice-void'
  | 'menu'
  | 'settings'

export interface SyncRecord {
  id: string
  kind: SyncKind
  refId: string
  label: string
  createdAt: number
  syncedAt?: number
}

export interface AuditEntry {
  id: string
  at: number
  actorId: string
  actorName: string
  action: string
  detail: string
}

export interface ToastMsg {
  id: string
  kind: 'success' | 'error' | 'info' | 'warning'
  title: string
  desc?: string
}

export interface BusinessSettings {
  name: string
  nameNe: string
  address: string
  addressNe: string
  phone: string
  email: string
  pan: string // PAN/VAT registration number (IRD)
  billPrefix: string // invoice number prefix
  serviceChargePct: number
  idrdBranch: string // IRD branch code used in bill number
}

/** Everything the store persists; seeded once on first boot. */
export interface AppState {
  lang: Lang
  staff: StaffMember[]
  tables: TableT[]
  categories: Category[]
  items: MenuItem[]
  modifierGroups: ModifierGroup[]
  orders: Order[]
  kots: Kot[]
  invoices: Invoice[]
  audit: AuditEntry[]
  syncQueue: SyncRecord[]
  invoiceSeqByFy: Record<string, number>
  kotSeqByDay: Record<string, number>
  orderSeq: number
  business: BusinessSettings
}

export interface OrderTotals {
  gross: number
  discountAmount: number
  net: number
  serviceCharge: number
  total: number
  taxableAmount: number
  vat: number
  vatPct: number
  serviceChargePct: number
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'esewa',
  'khalti',
  'fonepay',
  'nepalqr',
  'card',
]

export const PAYMENT_META: Record<
  PaymentMethod,
  { label: string; labelNe: string; hue: string; chip: string }
> = {
  cash: { label: 'Cash', labelNe: 'नगद', hue: 'from-mint-400 to-mint-500', chip: 'text-mint-300 bg-mint-400/10 border-mint-400/25' },
  esewa: { label: 'eSewa', labelNe: 'इसेवा', hue: 'from-esewa to-mint-500', chip: 'text-[#8ee37a] bg-esewa/10 border-esewa/25' },
  khalti: { label: 'Khalti', labelNe: 'खल्ती', hue: 'from-khalti to-violet-500', chip: 'text-violet-300 bg-khalti/15 border-khalti/30' },
  fonepay: { label: 'Fonepay', labelNe: 'फोनपे', hue: 'from-fonepay to-amber-500', chip: 'text-amber-300 bg-fonepay/10 border-fonepay/25' },
  nepalqr: { label: 'Nepal QR', labelNe: 'नेपाल क्युआर', hue: 'from-crimson-400 to-crimson-600', chip: 'text-crimson-300 bg-crimson-500/10 border-crimson-500/25' },
  card: { label: 'Card', labelNe: 'कार्ड', hue: 'from-sky-400 to-sky-500', chip: 'text-sky-300 bg-sky-500/10 border-sky-500/25' },
}

export const ROLE_META: Record<Role, { label: string; labelNe: string; hue: string }> = {
  owner: { label: 'Owner', labelNe: 'मालिक', hue: 'from-gold-400 to-gold-500' },
  cashier: { label: 'Cashier', labelNe: 'क्यासियर', hue: 'from-crimson-400 to-crimson-600' },
  waiter: { label: 'Waiter', labelNe: 'वेटर', hue: 'from-sky-400 to-sky-500' },
  chef: { label: 'Chef', labelNe: 'बावर्ची', hue: 'from-amber-400 to-amber-500' },
}
