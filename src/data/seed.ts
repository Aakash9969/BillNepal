import type {
  AppState,
  AuditEntry,
  Category,
  Invoice,
  Kot,
  MenuItem,
  ModifierGroup,
  Order,
  OrderLine,
  Payment,
  PaymentMethod,
  StaffMember,
  SyncRecord,
  TableT,
} from '@/types'
import { createInvoiceFromOrder } from '@/lib/billing'
import { dayKey, fiscalYear } from '@/lib/nepali'
import { uid } from '@/lib/id'

/* ── Deterministic PRNG so every fresh install gets the same demo world ── */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/* ── Staff ──────────────────────────────────────────────────────────── */
const STAFF: StaffMember[] = [
  { id: 'st-ramesh', name: 'Ramesh Shrestha', nameNe: 'रमेश श्रेष्ठ', role: 'owner', pin: '1111', hue: 'from-gold-400 to-gold-500' },
  { id: 'st-sita', name: 'Sita Karki', nameNe: 'सीता कार्की', role: 'cashier', pin: '2222', hue: 'from-crimson-400 to-crimson-600' },
  { id: 'st-bikash', name: 'Bikash Tamang', nameNe: 'विकास तामाङ', role: 'waiter', pin: '3333', hue: 'from-sky-400 to-sky-500' },
  { id: 'st-kumar', name: 'Kumar Gurung', nameNe: 'कुमार गुरुङ', role: 'chef', pin: '4444', hue: 'from-amber-400 to-amber-500' },
  { id: 'st-anita', name: 'Anita Sherpa', nameNe: 'अनिता शेर्पा', role: 'waiter', pin: '5555', hue: 'from-violet-400 to-violet-500' },
]

/* ── Floor ──────────────────────────────────────────────────────────── */
const TABLES: TableT[] = [
  { id: 'tb-1', number: 'T1', seats: 2, zone: 'indoor' },
  { id: 'tb-2', number: 'T2', seats: 2, zone: 'indoor' },
  { id: 'tb-3', number: 'T3', seats: 4, zone: 'indoor' },
  { id: 'tb-4', number: 'T4', seats: 4, zone: 'indoor' },
  { id: 'tb-5', number: 'T5', seats: 6, zone: 'indoor' },
  { id: 'tb-6', number: 'T6', seats: 6, zone: 'indoor' },
  { id: 'tb-7', number: 'T7', seats: 4, zone: 'terrace' },
  { id: 'tb-8', number: 'T8', seats: 4, zone: 'terrace' },
  { id: 'tb-9', number: 'T9', seats: 2, zone: 'terrace' },
  { id: 'tb-10', number: 'T10', seats: 6, zone: 'garden' },
  { id: 'tb-11', number: 'T11', seats: 8, zone: 'garden' },
  { id: 'tb-12', number: 'T12', seats: 4, zone: 'garden' },
]

/* ── Categories ────────────────────────────────────────────────────── */
const CATEGORIES: Category[] = [
  { id: 'cat-momo', name: 'Momo & Dim Sum', nameNe: 'मःम र डिम सम', icon: 'CookingPot', hue: 'from-crimson-400 to-crimson-600', sort: 1 },
  { id: 'cat-thali', name: 'Rice & Thali', nameNe: 'भात र थाली', icon: 'Utensils', hue: 'from-gold-400 to-gold-500', sort: 2 },
  { id: 'cat-noodles', name: 'Noodles & Soup', nameNe: 'चाउचाउ र सूप', icon: 'Soup', hue: 'from-sky-400 to-sky-500', sort: 3 },
  { id: 'cat-snacks', name: 'Snacks & Sekuwa', nameNe: 'खाजा र सेकुवा', icon: 'Flame', hue: 'from-amber-400 to-amber-500', sort: 4 },
  { id: 'cat-breakfast', name: 'Breakfast', nameNe: 'ब्रेकफास्ट', icon: 'Egg', hue: 'from-mint-400 to-mint-500', sort: 5 },
  { id: 'cat-chiya', name: 'Chiya & Coffee', nameNe: 'चिया र कफी', icon: 'Coffee', hue: 'from-violet-400 to-violet-500', sort: 6 },
  { id: 'cat-drinks', name: 'Cold Drinks', nameNe: 'कोल्ड ड्रिंक्स', icon: 'CupSoda', hue: 'from-sky-400 to-sky-500', sort: 7 },
  { id: 'cat-dessert', name: 'Desserts & Sweets', nameNe: 'डेजर्ट र स्वीट्स', icon: 'Dessert', hue: 'from-crimson-400 to-crimson-600', sort: 8 },
  { id: 'cat-bar', name: 'Bar & Beers', nameNe: 'बार र बियर', icon: 'Beer', hue: 'from-amber-400 to-amber-500', sort: 9 },
]

/* ── Modifier groups ────────────────────────────────────────────────── */
const MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 'mg-momo-extras',
    name: 'Momo extras',
    nameNe: 'मःम एक्स्ट्रा',
    options: [
      { id: 'mo-achar', name: 'Extra achar', nameNe: 'एक्स्ट्रा अचार', price: 20 },
      { id: 'mo-mayo', name: 'Extra mayo', nameNe: 'एक्स्ट्रा मेयो', price: 15 },
      { id: 'mo-jhol', name: 'Extra jhol', nameNe: 'एक्स्ट्रा झोल', price: 25 },
    ],
  },
  {
    id: 'mg-spice',
    name: 'Spice level',
    nameNe: 'स्पाइस लेभल',
    options: [
      { id: 'mo-mild', name: 'Mild', nameNe: 'माइल्ड', price: 0 },
      { id: 'mo-medium', name: 'Medium', nameNe: 'मिडियम', price: 0 },
      { id: 'mo-hot', name: 'Nepali hot', nameNe: 'नेपाली हट', price: 0 },
    ],
  },
  {
    id: 'mg-chiya',
    name: 'Chiya & coffee',
    nameNe: 'चिया र कफी',
    options: [
      { id: 'mo-dmilk', name: 'Double milk', nameNe: 'डबल मिल्क', price: 10 },
      { id: 'mo-eshot', name: 'Extra shot', nameNe: 'एक्स्ट्रा शट', price: 30 },
      { id: 'mo-lsugar', name: 'Less sugar', nameNe: 'लेस सुगर', price: 0 },
    ],
  },
  {
    id: 'mg-ice',
    name: 'Drink style',
    nameNe: 'ड्रिंक स्टाइल',
    options: [
      { id: 'mo-noice', name: 'No ice', nameNe: 'नो आइस', price: 0 },
      { id: 'mo-exice', name: 'Extra ice', nameNe: 'एक्स्ट्रा आइस', price: 0 },
    ],
  },
]

/* ── Menu (VAT-inclusive prices in NPR) ─────────────────────────────── */
type ItemSeed = [
  id: string,
  cat: string,
  name: string,
  nameNe: string,
  price: number,
  veg: boolean,
  spice: 0 | 1 | 2 | 3,
  dayparts: string[],
  desc: string,
  descNe: string,
  mods?: string[],
]

const ITEM_SEEDS: ItemSeed[] = [
  ['it-veg-momo', 'cat-momo', 'Veg Steam Momo (8 pcs)', 'भेज स्टीम मःमः (८ पिस)', 160, true, 1, [], 'Delicate vegetable dumplings with sesame-tomato achar', 'तिल-टमाटर अचारसहितको सब्जी मःमः', ['mg-momo-extras', 'mg-spice']],
  ['it-chick-momo', 'cat-momo', 'Chicken Steam Momo (8 pcs)', 'चिकन स्टीम मःमः (८ पिस)', 220, false, 1, [], 'House classic, juicy chicken filling', 'घरकै शैलीको कुखुरा मःमः', ['mg-momo-extras', 'mg-spice']],
  ['it-buff-momo', 'cat-momo', 'Buff Steam Momo (8 pcs)', 'बफ स्टीम मःमः (८ पिस)', 240, false, 2, [], 'Kathmandu favourite, buffalo filling', 'काठमाडौँकै मनपर्ने भैंसी मःमः', ['mg-momo-extras', 'mg-spice']],
  ['it-veg-jhol', 'cat-momo', 'Veg Jhol Momo', 'भेज झोल मःमः', 200, true, 2, [], 'Dumplings swimming in spicy jhol achar broth', 'पिरो झोल अचारमा डुबेका मःमः', ['mg-momo-extras']],
  ['it-chick-jhol', 'cat-momo', 'Chicken Jhol Momo', 'चिकन झोल मःमः', 260, false, 2, [], 'Tangy, soupy, unforgettable', 'अमिलो झोलमा मिठो कुखुरा मःमः', ['mg-momo-extras']],
  ['it-chick-fried', 'cat-momo', 'Chicken Fried Momo', 'चिकन फ्राइड मःमः', 240, false, 1, [], 'Crisp-bottomed, chilli-garlic tossed', 'करक र चिली-लसुन मःमः'],
  ['it-cmomo', 'cat-momo', 'C-Momo (Spicy)', 'सि-मःमः (स्पाइसी)', 250, false, 3, [], 'Wok-tossed in fiery szechwan sauce', 'आगो जस्तै ससमा फ्राइ गरिएको'],
  ['it-veg-thali', 'cat-thali', 'Veg Thali (Dal Bhat)', 'भेज थाली (दाल भात)', 320, true, 1, ['lunch', 'dinner'], 'Dal, bhat, tarkari, achar, saag, dahi', 'दाल, भात, तरकारी, अचार, साग, दही'],
  ['it-chick-thali', 'cat-thali', 'Chicken Thali', 'चिकन थाली', 420, false, 1, ['lunch', 'dinner'], 'Complete set with chicken curry', 'कुखुराको झोलसहित पूरा थाली'],
  ['it-chick-curry', 'cat-thali', 'Chicken Curry with Rice', 'चिकन करी सँग राइस', 380, false, 2, ['lunch', 'dinner'], 'Slow-cooked Nepali style curry', 'नेपाली शैलीमा पकाएको झोल'],
  ['it-aloo-tama', 'cat-thali', 'Aloo Tama', 'आलु तामा', 200, true, 2, ['lunch', 'dinner'], 'Classic bamboo shoot & potato curry', 'तामा र आलुको परम्परागत झोल'],
  ['it-chick-chow', 'cat-noodles', 'Chicken Chowmein', 'चिकन चाउचाउ', 220, false, 1, [], 'Street-style wok noodles', 'बजारकै स्वादको चाउचाउ'],
  ['it-veg-chow', 'cat-noodles', 'Veg Chowmein', 'भेज चाउचाउ', 170, true, 1, [], 'Greens, cabbage, crunchyveg', 'सागपात र गोलभेडाको मिठो चाउचाउ'],
  ['it-chick-thukpa', 'cat-noodles', 'Chicken Thukpa', 'चिकन थुक्पा', 260, false, 1, [], 'Himalayan noodle soup, hearty broth', 'हिमाली शैलीको नूडल सूप'],
  ['it-veg-thukpa', 'cat-noodles', 'Veg Thukpa', 'भेज थुक्पा', 200, true, 1, [], 'Warm, gingery, nourishing', 'अदुवाको स्वादको पोषिलो सूप'],
  ['it-chick-soup', 'cat-noodles', 'Chicken Soup', 'चिकन सूप', 180, false, 0, [], 'Clear broth with shredded chicken', 'सफा झोलसहित कुखुराको सूप'],
  ['it-tom-soup', 'cat-noodles', 'Tomato Soup', 'टमाटर सूप', 150, true, 0, ['dinner'], 'Creamy, with croutons', 'क्राउटनसहित क्रिमी सूप'],
  ['it-buff-sekuwa', 'cat-snacks', 'Buff Sekuwa', 'बफ सेकुवा', 320, false, 2, ['dinner'], 'Charcoal-grilled, timur chutney', 'कोइलामा पोलेको, टिमुरको चटनी', ['mg-spice']],
  ['it-chick-sekuwa', 'cat-snacks', 'Chicken Sekuwa', 'चिकन सेकुवा', 280, false, 2, ['dinner'], 'Smoky marinated skewers', 'मसलामा मारिनेट गरेको सेकुवा', ['mg-spice']],
  ['it-chick-65', 'cat-snacks', 'Chicken 65', 'चिकन ६५', 240, false, 3, [], 'Crispy, curry-leaf, red-hot', 'करक, रातो पिरो'],
  ['it-samosa', 'cat-snacks', 'Samosa (2 pcs)', 'समोसा (२ पिस)', 60, true, 1, [], 'Golden, stuffed, tamarind chutney', 'टमाटर चटनीसहित'],
  ['it-pakoda', 'cat-snacks', 'Veg Pakoda', 'भेज पकोडा', 120, true, 1, [], 'Monsoon-perfect fritters', 'पोखरो-मौसमको पकोडा'],
  ['it-spring-roll', 'cat-snacks', 'Spring Rolls', 'स्प्रिङ रोल्स', 180, true, 0, [], 'Crispy veg rolls, sweet chilli dip', 'करक रोल, मीठो चिली सस'],
  ['it-bara', 'cat-snacks', 'Newari Bara', 'नेवारी बरा', 160, true, 1, [], 'Lentil patties, Newari style', 'दालको पीठोको नेवारी बरा'],
  ['it-chatamari', 'cat-snacks', 'Chatamari', 'चतामरी', 180, true, 1, ['dinner'], 'Newari rice crepe', 'नेवारी चामलको रोटी'],
  ['it-bread-om', 'cat-breakfast', 'Bread Omelette', 'ब्रेड ओमलेट', 160, false, 0, ['breakfast'], 'Two-egg with toasted paan-roTI', 'दुई अन्डाको ओमलेट'],
  ['it-paratha', 'cat-breakfast', 'Paratha with Aloo', 'पराठा सँग आलु', 150, true, 0, ['breakfast'], 'Buttery, with spiced potato', 'मसलायुक्त आलुसहित'],
  ['it-masala-chiya', 'cat-chiya', 'Masala Chiya', 'मसला चिया', 40, true, 0, [], 'Spiced milk tea, the Nepali fuel', 'नेपाली मसला चिया', ['mg-chiya']],
  ['it-milk-chiya', 'cat-chiya', 'Milk Chiya', 'मिल्क चिया', 35, true, 0, [], 'Simple, sweet, strong', 'साधारण दूध चिया', ['mg-chiya']],
  ['it-black-coffee', 'cat-chiya', 'Black Coffee', 'ब्ल्याक कफी', 100, true, 0, [], 'Freshly brewed, no nonsense', 'ताजा ब्रु गरिएको', ['mg-chiya']],
  ['it-latte', 'cat-chiya', 'Café Latte', 'काफे लाते', 180, true, 0, [], 'Silky steamed milk over espresso', 'इस्प्रेसोमा दूधको पात'],
  ['it-cold-coffee', 'cat-chiya', 'Cold Coffee', 'कोल्ड कफी', 200, true, 0, [], 'Chilled, blended, topped', 'चिसो र मिठो'],
  ['it-lime-soda', 'cat-drinks', 'Fresh Lime Soda', 'फ्रेस लाइम सोडा', 130, true, 0, [], 'Sweet, salted or mixed', 'मीठो, नुनिलो वा मिसाइएको', ['mg-ice']],
  ['it-mango-lassi', 'cat-drinks', 'Mango Lassi', 'म्यांगो लस्सी', 180, true, 0, [], 'Thick, chilled, mango-sweet', 'चिसो र बाक्लो आँप लस्सी'],
  ['it-sweet-lassi', 'cat-drinks', 'Sweet Lassi', 'स्वीट लस्सी', 140, true, 0, [], 'Classic curd cooler', 'दहीको परम्परागत लस्सी'],
  ['it-coke', 'cat-drinks', 'Coca-Cola (250 ml)', 'कोका-कोला (२५० एमएल)', 80, true, 0, [], 'Chilled bottle', 'चिसो सिसी'],
  ['it-water', 'cat-drinks', 'Mineral Water', 'मिनरल वाटर', 50, true, 0, [], 'Sealed 1 L bottle', '१ लिटर प्याकेट'],
  ['it-juju-dhau', 'cat-dessert', 'Juju Dhau (Bhaktapur)', 'जुजु धौ (भक्तपुर)', 120, true, 0, [], 'King curd in clay pot', 'माटोको भाडोमा आएको जुजु धौ'],
  ['it-yomari', 'cat-dessert', 'Yomari', 'योमरी', 140, true, 0, [], 'Chaku-filled rice dumpling', 'चाकु भरिएको योमरी'],
  ['it-kheer', 'cat-dessert', 'Kheer', 'खीर', 110, true, 0, [], 'Cardamom rice pudding', 'सुकुमेल खीर'],
  ['it-icecream', 'cat-dessert', 'Vanilla Ice Cream', 'भ्यानिला आइस क्रिम', 130, true, 0, [], 'Two scoops, chocolate drizzle', 'दुई स्कुप'],
  ['it-everest-beer', 'cat-bar', 'Everest Beer (650 ml)', 'एभरेस्ट बियर (६५० एमएल)', 450, false, 0, ['dinner'], 'Nepal\'s own lager', 'नेपालकै बियर'],
  ['it-gorkha-beer', 'cat-bar', 'Gorkha Beer (650 ml)', 'गोर्खा बियर (६५० एमएल)', 420, false, 0, ['dinner'], 'Strong, malty, proud', 'बलियो र मिठो'],
  ['it-aila', 'cat-bar', 'Aila (Local Shot)', 'इला (लोकल शट)', 250, false, 0, ['dinner'], 'Traditional Newari spirit', 'नेवारी परम्परागत इला'],
]

function buildItems(): MenuItem[] {
  return ITEM_SEEDS.map(([id, categoryId, name, nameNe, price, veg, spice, dayparts, desc, descNe, mods]) => ({
    id,
    categoryId,
    name,
    nameNe,
    desc,
    descNe,
    price,
    veg,
    spice,
    available: true,
    archived: false,
    dayparts: dayparts as MenuItem['dayparts'],
    modifierGroupIds: mods ?? [],
  }))
}

/* ── Business ───────────────────────────────────────────────────────── */
const BUSINESS = {
  name: 'Gorkha Bistro & Café',
  nameNe: 'गोर्खा बिस्ट्रो एन्ड क्याफे',
  address: 'Durbar Marg, Kathmandu 44600',
  addressNe: 'दरबार मार्ग, काठमाडौँ ४४६००',
  phone: '01-4251699',
  email: 'hello@gorkhabistro.com.np',
  pan: '301234567',
  billPrefix: 'GB',
  idrdBranch: '01',
  serviceChargePct: 10,
}

/* ── Seeded live service (open tables, KOTs, queue) ──────────────────── */
function openLine(itemId: string, qty: number, mods: OrderLine['modifiers'] = [], notes = '', sentMinAgo?: number): OrderLine {
  const item = ITEM_SEEDS.find((i) => i[0] === itemId)!
  const modSum = mods.reduce((s, m) => s + m.price, 0)
  return {
    id: uid('ln'),
    itemId,
    name: item[2],
    nameNe: item[3],
    qty,
    unitPrice: item[4] + modSum,
    modifiers: mods,
    notes,
    sentAt: sentMinAgo !== undefined ? Date.now() - sentMinAgo * MIN : undefined,
  }
}

const MOD_ACHAR = { optionId: 'mo-achar', name: 'Extra achar', nameNe: 'एक्स्ट्रा अचार', price: 20 }
const MOD_NOICE = { optionId: 'mo-noice', name: 'No ice', nameNe: 'नो आइस', price: 0 }
const MOD_NEPHOT = { optionId: 'mo-hot', name: 'Nepali hot', nameNe: 'नेपाली हट', price: 0 }

function buildLiveWorld(now: number) {
  const orders: Order[] = []
  const kots: Kot[] = []
  const syncQueue: SyncRecord[] = []

  /* T5 — long-running table, bill requested, discount applied */
  const t5Lines = [
    { ...openLine('it-chick-jhol', 2, [], '', 50), kotId: 'kt-3' },
    { ...openLine('it-veg-thali', 1, [], '', 50), kotId: 'kt-3' },
    { ...openLine('it-masala-chiya', 3, [], '', 50), kotId: 'kt-3' },
    { ...openLine('it-everest-beer', 1, [], '', 50), kotId: 'kt-3' },
  ]
  const orderT5: Order = {
    id: 'od-112',
    tableId: 'tb-5',
    number: '#112',
    guests: 3,
    waiterId: 'st-bikash',
    openedAt: now - 55 * MIN,
    status: 'open',
    lines: t5Lines,
    discount: { type: 'percent', value: 10, reason: 'loyalty' },
    billRequestedAt: now - 6 * MIN,
  }
  orders.push(orderT5)
  kots.push({
    id: 'kt-3',
    number: 3,
    orderId: 'od-112',
    tableId: 'tb-5',
    waiterId: 'st-bikash',
    createdAt: now - 50 * MIN,
    status: 'ready',
    lines: t5Lines.map((l) => ({
      lineId: l.id,
      name: l.name,
      nameNe: l.nameNe,
      qty: l.qty,
      notes: l.notes,
      modifiers: l.modifiers,
    })),
    syncState: 'synced',
  })

  /* T3 — mid-meal, KOT preparing, one line with a note */
  const t3Lines = [
    { ...openLine('it-buff-sekuwa', 1, [MOD_NEPHOT], 'extra spicy', 30), kotId: 'kt-4' },
    { ...openLine('it-chick-thukpa', 2, [], '', 30), kotId: 'kt-4' },
    { ...openLine('it-lime-soda', 1, [MOD_NOICE], '', 30), kotId: 'kt-4' },
  ]
  const orderT3: Order = {
    id: 'od-113',
    tableId: 'tb-3',
    number: '#113',
    guests: 2,
    waiterId: 'st-bikash',
    openedAt: now - 35 * MIN,
    status: 'open',
    lines: t3Lines,
  }
  orders.push(orderT3)
  kots.push({
    id: 'kt-4',
    number: 4,
    orderId: 'od-113',
    tableId: 'tb-3',
    waiterId: 'st-bikash',
    createdAt: now - 30 * MIN,
    status: 'preparing',
    lines: t3Lines.map((l) => ({
      lineId: l.id,
      name: l.name,
      nameNe: l.nameNe,
      qty: l.qty,
      notes: l.notes,
      modifiers: l.modifiers,
    })),
    syncState: 'synced',
  })

  /* T7 — just sent to kitchen; its KOT is queued for sync (offline capture) */
  const t7Lines = [
    { ...openLine('it-veg-momo', 2, [MOD_ACHAR], '', 15), kotId: 'kt-5' },
    { ...openLine('it-chick-chow', 1, [], '', 15), kotId: 'kt-5' },
  ]
  const orderT7: Order = {
    id: 'od-114',
    tableId: 'tb-7',
    number: '#114',
    guests: 4,
    waiterId: 'st-anita',
    openedAt: now - 18 * MIN,
    status: 'open',
    lines: t7Lines,
  }
  orders.push(orderT7)
  const kot5: Kot = {
    id: 'kt-5',
    number: 5,
    orderId: 'od-114',
    tableId: 'tb-7',
    waiterId: 'st-anita',
    createdAt: now - 15 * MIN,
    status: 'queued',
    lines: t7Lines.map((l) => ({
      lineId: l.id,
      name: l.name,
      nameNe: l.nameNe,
      qty: l.qty,
      notes: l.notes,
      modifiers: l.modifiers,
    })),
    syncState: 'pending',
  }
  kots.push(kot5)
  syncQueue.push({
    id: uid('sq'),
    kind: 'kot',
    refId: kot5.id,
    label: '5',
    createdAt: kot5.createdAt,
  })

  /* T11 — freshly seated, nothing sent yet */
  const orderT11: Order = {
    id: 'od-115',
    tableId: 'tb-11',
    number: '#115',
    guests: 2,
    waiterId: 'st-bikash',
    openedAt: now - 8 * MIN,
    status: 'open',
    lines: [
      openLine('it-chick-momo', 1),
      openLine('it-sweet-lassi', 1),
    ],
  }
  orders.push(orderT11)

  /* Two already-served KOTs from this morning */
  kots.push(
    {
      id: 'kt-1',
      number: 1,
      orderId: 'od-100',
      tableId: 'tb-2',
      waiterId: 'st-anita',
      createdAt: now - 3 * HOUR,
      status: 'served',
      lines: [
        { lineId: uid('ln'), name: 'Masala Chiya', nameNe: 'मसला चिया', qty: 2, notes: '', modifiers: [] },
        { lineId: uid('ln'), name: 'Veg Pakoda', nameNe: 'सब्जी पकोडा', qty: 1, notes: '', modifiers: [] },
      ],
      syncState: 'synced',
    },
    {
      id: 'kt-2',
      number: 2,
      orderId: 'od-105',
      tableId: 'tb-6',
      waiterId: 'st-bikash',
      createdAt: now - 2 * HOUR,
      status: 'served',
      lines: [
        { lineId: uid('ln'), name: 'Chicken Jhol Momo', nameNe: 'कुखुरा जोल मःमः', qty: 2, notes: '', modifiers: [] },
        { lineId: uid('ln'), name: 'Fresh Lime Soda', nameNe: 'कागती सोडा', qty: 1, notes: '', modifiers: [] },
      ],
      syncState: 'synced',
    }
  )

  return { orders, kots, syncQueue }
}

/* ── Seeded history (14 days of invoices) ────────────────────────────── */
const B2B_CUSTOMERS: [string, string][] = [
  ['Everest Tech Pvt. Ltd.', '301987654'],
  ['Himalayan Trails Tours', '302123456'],
  ['Kathmandu Grand Hotel', '303456789'],
  ['Nepal Digital Labs', '304567890'],
]

function buildHistory(now: number) {
  const rng = mulberry32(20832083)
  const invoices: Invoice[] = []
  const audit: AuditEntry[] = []
  const items = ITEM_SEEDS
  const waiters = ['st-bikash', 'st-anita']

  // weighted item pool — momos & chiya dominate like real Nepali cafés
  // (one weight per ITEM_SEED; extras are skipped so the pool never exceeds the menu)
  const weights = [5, 5, 4, 3, 4, 2, 2, 3, 3, 2, 2, 3, 3, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 6, 5, 3, 2, 2, 3, 2, 2, 4, 3, 2, 2, 1, 1, 1, 2, 2, 1]
  const pool: number[] = []
  weights.forEach((w, idx) => {
    if (idx >= items.length) return
    for (let k = 0; k < w; k++) pool.push(idx)
  })

  const methods: PaymentMethod[] = ['cash', 'esewa', 'khalti', 'card', 'fonepay', 'nepalqr']
  const methodWeights = [44, 20, 12, 10, 8, 6]
  const methodPool: PaymentMethod[] = []
  methods.forEach((m, idx) => {
    for (let k = 0; k < methodWeights[idx]; k++) methodPool.push(m)
  })

  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
  const pickMethod = (): PaymentMethod => pick(methodPool)

  let seq = 150
  let orderNum = 100
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()

  const fyAt = (t: number) => fiscalYear(new Date(t))

  const mkInvoice = (
    t: number,
    tableId: string,
    lines: OrderLine[],
    waiterId: string,
    discount?: Order['discount'],
    isB2b = false
  ): { inv: Invoice; order: Order } => {
    const order: Order = {
      id: `od-h${orderNum}`,
      tableId,
      number: `#${orderNum}`,
      guests: 1 + Math.floor(rng() * 5),
      waiterId,
      openedAt: t - (10 + Math.floor(rng() * 40)) * MIN,
      status: 'paid',
      lines,
      discount,
    }
    orderNum++
    const table = TABLES.find((x) => x.id === tableId)!
    let payments: Payment[] = []
    const inv = createInvoiceFromOrder(order, {
      tableNumber: table.number,
      business: BUSINESS,
      cashierId: 'st-sita',
      cashierName: 'Sita Karki',
      fy: fyAt(t),
      seq: ++seq,
      issuedAt: t,
      payments: [],
      syncPending: false,
    })

    /* payments on the finished invoice */
    const method = pickMethod()
    if (method === 'cash') {
      const tender = inv.total + (rng() < 0.7 ? 0 : [50, 100, 200][Math.floor(rng() * 3)])
      payments = [{ method, amount: inv.total, tendered: tender, at: t }]
    } else {
      const refMap: Record<string, string> = {
        esewa: 'ESW',
        khalti: 'KHT',
        fonepay: 'FON',
        nepalqr: 'NQR',
        card: 'CRD',
      }
      payments = [{ method, amount: inv.total, reference: `${refMap[method]}-${Math.floor(rng() * 900000 + 100000)}`, at: t }]
      if (rng() < 0.12) {
        // partial cash top-up, exact remainder digital
        const cashPart = Math.round(inv.total * 0.4)
        const digitalPart = Math.round((inv.total - cashPart) * 100) / 100
        payments.unshift({ method: 'cash', amount: cashPart, tendered: cashPart, at: t - MIN })
        payments[1] = { ...payments[1], amount: digitalPart }
      }
    }
    inv.payments = payments
    if (isB2b) {
      const [nm, pan] = pick(B2B_CUSTOMERS)
      inv.isB2b = true
      inv.customerName = nm
      inv.customerPan = pan
    }
    return { inv, order }
  }

  const mkLines = (): OrderLine[] => {
    const count = 1 + Math.floor(rng() * 3.4)
    const chosen = new Set<number>()
    const lines: OrderLine[] = []
    for (let i = 0; i < count; i++) {
      let idx = pick(pool)
      let guard = 0
      while (chosen.has(idx) && guard++ < 8) idx = pick(pool)
      chosen.add(idx)
      const it = items[idx]
      const qty = 1 + (rng() < 0.35 ? 1 : 0) + (it[0].includes('chiya') && rng() < 0.3 ? 1 : 0)
      lines.push({
        id: uid('ln'),
        itemId: it[0],
        name: it[2],
        nameNe: it[3],
        qty,
        unitPrice: it[4],
        modifiers: [],
        notes: '',
        sentAt: Date.now(),
      })
    }
    return lines
  }

  /* past 13 days */
  for (let d = 13; d >= 1; d--) {
    const dayStart = todayMs - d * DAY
    const dow = new Date(dayStart).getDay() // 0 Sun … 6 Sat
    const weekendBoost = dow === 5 || dow === 6 ? 3 : dow === 0 ? 1 : 0
    const n = 5 + Math.floor(rng() * 3) + weekendBoost
    const stamps: number[] = []
    for (let i = 0; i < n; i++) {
      const hour = 10.5 + rng() * 10.5 // 10:30 – 21:00
      stamps.push(dayStart + Math.floor(hour * HOUR))
    }
    stamps.sort((a, b) => a - b)
    for (const t of stamps) {
      const isB2b = rng() < 0.09
      const discount = rng() < 0.1 ? (rng() < 0.6 ? { type: 'percent' as const, value: pick([5, 10, 10]), reason: 'loyalty' } : { type: 'amount' as const, value: pick([50, 100]), reason: 'staff' }) : undefined
      const { inv } = mkInvoice(t, pick(TABLES).id, mkLines(), pick(waiters), discount, isB2b)
      invoices.push(inv)
    }
  }

  /* today — only up to "now", early ones for a busy lunch */
  const nowH = (now - todayMs) / HOUR
  if (nowH >= 10.2) {
    const nToday = Math.min(8, Math.max(2, Math.floor((nowH - 9.5) * 1.6)))
    const stamps: number[] = []
    for (let i = 0; i < nToday; i++) {
      const from = Math.max(9.8, nowH - 4.5)
      const h = from + ((nowH - 0.3 - from) * (i + rng() * 0.8)) / nToday
      stamps.push(todayMs + Math.floor(h * HOUR))
    }
    stamps.sort((a, b) => a - b)
    stamps.forEach((t, i) => {
      const isB2b = rng() < 0.1
      const discount = rng() < 0.12 ? { type: 'percent' as const, value: 10, reason: 'loyalty' } : undefined
      const { inv } = mkInvoice(t, pick(TABLES).id, mkLines(), pick(waiters), discount, isB2b)
      invoices.push(inv)
      audit.push({
        id: uid('au'),
        at: t,
        actorId: 'st-sita',
        actorName: 'Sita Karki',
        action: 'invoice.create',
        detail: `${inv.number} · ${inv.tableNumber} · Rs. ${inv.total}`,
      })
      if (i === stamps.length - 1) {
        /* newest invoice is still queued for IRD — the sync engine picks it up live */
        inv.cbmsStatus = 'pending'
        inv.cbmsSyncedAt = undefined
      }
    })
  }

  /* NOTE: the "pending" invoice above was added before its audit entry —
     it is already inside `invoices` through the loop. */

  audit.unshift(
    {
      id: uid('au'),
      at: todayMs + 10 * HOUR + 32 * MIN,
      actorId: 'st-sita',
      actorName: 'Sita Karki',
      action: 'auth.login',
      detail: 'Cashier signed in',
    },
    {
      id: uid('au'),
      at: todayMs + 10 * HOUR + 52 * MIN,
      actorId: 'st-anita',
      actorName: 'Anita Sherpa',
      action: 'kot.send',
      detail: 'KOT #1 · T2',
    },
    {
      id: uid('au'),
      at: todayMs + 12 * HOUR + 48 * MIN,
      actorId: 'st-bikash',
      actorName: 'Bikash Tamang',
      action: 'kot.send',
      detail: 'KOT #2 · T6',
    }
  )
  audit.sort((a, b) => b.at - a.at)

  return { invoices, audit, seq, orderNum }
}

/* ── Assemble the full seed state ───────────────────────────────────── */
export function buildSeedState(): AppState {
  const now = Date.now()
  const live = buildLiveWorld(now)
  const history = buildHistory(now)
  const todayK = dayKey(new Date(now))

  const state: AppState = {
    lang: 'en',
    staff: STAFF,
    tables: TABLES,
    categories: CATEGORIES,
    items: buildItems(),
    modifierGroups: MODIFIER_GROUPS,
    orders: live.orders,
    kots: live.kots,
    invoices: history.invoices,
    audit: history.audit,
    syncQueue: live.syncQueue,
    invoiceSeqByFy: { [fiscalYear(new Date(now))]: history.seq },
    kotSeqByDay: { [todayK]: 5 },
    orderSeq: 115,
    business: BUSINESS,
  }

  /* if a pending invoice was generated today, register its sync record */
  const pendingInv = state.invoices.find((i) => i.cbmsStatus === 'pending')
  if (pendingInv) {
    state.syncQueue.push({
      id: uid('sq'),
      kind: 'invoice',
      refId: pendingInv.id,
      label: pendingInv.number,
      createdAt: pendingInv.issuedAt,
    })
  }

  return state
}
