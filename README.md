<div align="center">

# 🇳🇵 BillNepal

**Nepal's complete POS & IRD billing system for restaurants, cafés & hotels**

_IRD/CBMS-compliant VAT invoicing · Offline-first KOT kitchen flow · Bilingual (English / नेपाली) · Bikram Sambat native_

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-453c39?style=flat-square)](https://github.com/pmndrs/zustand)
[![Motion](https://img.shields.io/badge/Motion-12-ff0055?style=flat-square)](https://motion.dev)

**[Live Demo](https://bill-nepal.vercel.app/)** · **[Report Bug](../../issues)** · **[Request Feature](../../issues)**

</div>

---

## 📖 The Problem

Every restaurant in Nepal needs three things to stay legal: an **IRD-registered billing system** (CBMS-compliant VAT invoices with fiscal-year numbering), a **kitchen order flow**, and a way to keep working when the **internet goes down** — which it does, often. Today that means overpriced legacy Windows software with English-only UIs, per-invoice SMS fees, and no answer for load-shedding or fiber cuts.

## 💡 The Solution

**BillNepal** is a modern, cloud-synced POS built specifically for Nepali hospitality:

- **Real IRD compliance** — fiscal-year invoice numbers (`GB-01-2083-84-000214`), 13% VAT extracted from tax-inclusive menu prices, PAN-bearing tax invoices, CBMS outbox reporting, and an immutable audit trail.
- **Offline-first, genuinely** — tables, KOTs, discounts, and billing keep working without internet. Everything queues in an outbox and syncs to CBMS when the line returns.
- **Bilingual to the core** — every string, dish name, date, and digit is available in English and नेपाली, including Devanagari numerals (रु. १,२३४.५०) and the **Bikram Sambat calendar** (2040–2099).
- **Local payments built in** — Cash, eSewa, Khalti, Fonepay, Nepal QR, and Card — with split part-payments, cash tendering + change, and gateway reference capture.

---

## ✨ Features

### 🍽️ Floor & Order (Waiter)
- Live table map with zones (Indoor / Terrace / Garden) and statuses (Available / Occupied / Bill ready)
- Visual menu with categories, veg/spice markers, daypart availability (breakfast / lunch / dinner)
- Modifier groups (extra achar, spice level, no ice…) and quick kitchen notes
- One tap → prints a **KOT** to the kitchen; one tap → flags the cashier *"bill please"*

### 👨‍🍳 Kitchen Display (KOT Board)
- Queued → Preparing → Ready → Served pipeline with live elapsed timers and late alerts
- Offline-captured KOTs are queued for sync automatically

### 💳 Billing (Cashier)
- Bills-to-collect rail with live totals per table
- Discounts (% or fixed) with reasons (loyalty, staff meal, service recovery)
- **Split bill** — tick dishes into Bill A, the rest becomes Bill B, each settled separately
- Full payment flow: quick-cash denominations, exact-change math, simulated gateway verification (eSewa / Khalti / Fonepay / Nepal QR / Card) with transaction references
- **Part-payments** — settle one bill with any mix of methods
- **B2B invoicing** — capture customer name + PAN for business customers
- Settle → IRD-format VAT invoice generated, hashed, and sent to the printer

### 🧾 Invoices & Compliance
- Searchable invoice register with B2B / voided filters
- Void flow reports cancellations to IRD (number stays consumed, per regulation)
- IRD payload inspector (what a CBMS agent would push)
- Verification QR tile on every printed invoice

### 📊 Dashboard (Owner)
- Today's revenue, bill count, average bill, VAT collected — vs. yesterday & last week
- 7-day revenue chart, payment-mix donut, top sellers
- Live strip: occupied tables + active KOTs, one click away

### ⚙️ Menu & Settings
- Full menu management: items, categories, archiving, availability, serving times
- Business profile: PAN, bill prefix, IRD branch code, service charge
- Sync outbox viewer and the immutable audit trail (IRD record-keeping)
- One-click demo reset

---

## 🧮 The Compliance Engine

| Concern | Implementation |
|---|---|
| VAT | 13% back-extracted from VAT-inclusive prices (`total × 13/113`) |
| Service charge | 10% default, configurable, applied post-discount |
| Invoice numbers | `PREFIX-BRANCH-FY-seq6` per Nepali fiscal year (Shrawan 1 start) |
| Dates | Bikram Sambat (2040–2099 table) + AD on every document |
| Currency | South-Asian grouping `1,23,456.75`, amounts-in-words (crore/lakh) |
| Audit | Append-only action log per IRD record-keeping requirements |
| Offline | Outbox queue drains one record per sync tick when online |
| Hashing | Stable local payload hash printed as verification ID |

---

## 🖥️ Demo Walkthrough

Sign in with any profile (the demo PIN is printed on each card):

| Staff | Role | PIN | Lands on |
|---|---|---|---|
| Ramesh Shrestha | Owner | `1111` | Dashboard |
| Sita Karki | Cashier | `2222` | Billing |
| Bikash Tamang | Waiter | `3333` | Floor map |
| Kumar Gurung | Chef | `4444` | Kitchen board |
| Anita Sherpa | Waiter | `5555` | Floor map |

Try this flow:
1. **Waiter** → open T3, add a momo + chiya → **Send to Kitchen** → **Settle bill**
2. **Chef** → move the KOT Queued → Preparing → Ready
3. **Cashier** → open the bill → apply a 10% loyalty discount → settle half in **cash** (watch the change math) and half via **eSewa** (watch the gateway verify) → IRD invoice prints
4. Hit the **Wi-Fi button** in the topbar to simulate a connection loss — keep billing, then watch the outbox drain when you restore it

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React 18 + TypeScript 5.8 (strict)** | Predictable, type-safe domain model |
| Build | **Vite 6** | Instant HMR, tiny config |
| Styling | **Tailwind CSS 4** | Design tokens via CSS theme (ink/fog/crimson/gold/mint) |
| State | **Zustand 5** (persist) | One store, localStorage durability, zero boilerplate |
| Animation | **Motion 12** (motion/react) | Springs, layout transitions, drag-to-dismiss toasts |
| Icons | **lucide-react** | Consistent stroke icon set |
| Dates | **Custom BS calendar engine** | No dependency supports Bikram Sambat properly |
| Fonts | **Self-hosted** (Sora, Noto Sans Devanagari, JetBrains Mono) | Offline-first — no Google Fonts runtime calls |

No backend, no database — this prototype runs entirely client-side with a deterministic seed generator (14 days of invoice history, live floor, open KOTs).

---

## 📂 Project Structure

```
src/
├── main.tsx / App.tsx        # entry, shell mount
├── store.ts                   # zustand store — actions, sync engine glue
├── types.ts                   # domain model (Order, Kot, Invoice, Payment…)
├── features/                  # one file per screen
│   ├── Login.tsx  Dashboard.tsx  Tables.tsx  OrderView.tsx
│   ├── Kitchen.tsx  Billing.tsx  Invoices.tsx
│   └── MenuManager.tsx  Settings.tsx
├── components/
│   ├── layout/                # AppShell, Sidebar, Topbar, PrintPortal
│   ├── ui/                    # Button, Modal, Badge, Stepper, Toaster…
│   ├── invoice/               # TaxInvoice (IRD format), PseudoQr
│   └── charts/                # BarChart, Donut, Counter
├── lib/
│   ├── billing.ts             # totals math, invoice factory, IRD payload
│   ├── nepali.ts              # Bikram Sambat calendar (2040–2099)
│   ├── money.ts               # NPR formatting, amount-in-words
│   ├── stats.ts               # dashboard aggregations
│   └── id.ts / cn.ts
├── i18n/
│   ├── dict.ts                # EN/NE catalog — typed, build-checked
│   └── useT.ts                # translate() + hook with Devanagari digits
├── data/seed.ts               # deterministic demo world
└── index.css                  # theme tokens, self-hosted fonts, print styles
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/Aayush-np/bill-nepal.git
cd bill-nepal
npm install
npm run dev        # → http://localhost:5173
```

**Scripts**

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck (`tsc --noEmit`) + production build |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only, no emit |

**Deploying to Vercel** — import the repo, keep the auto-detected Vite settings (`npm run build` → `dist`), deploy. No environment variables required.

---

## 🗺️ Roadmap

BillNepal grows into a full hospitality OS for Nepal:

`Inventory & food costing` · `Customer loyalty` · `Staff attendance & payroll` · `Accounting` · `QR table ordering` · `Restaurant websites` · `WhatsApp bill delivery` · `Reservations` · `Delivery integrations` · `Hotel room billing` · `Multi-outlet management` · `Banquet management` · `Kitchen display screens` · `Advanced reports`

---

## ⚠️ Prototype Notice

This is a **concept prototype** for a startup idea. The CBMS agent, payment gateways, and printing are simulated client-side — but every data structure, invoice field, and billing rule mirrors the real IRD requirements so the production backend (Nepal CBMS API + eSewa/Khalti merchant APIs) can drop in behind the same UI.

## 📄 License

All rights reserved — this prototype is being prepared for commercialization. (Swap in an OSS license if open-sourcing.)

---

<div align="center">

**बिल नेपाल** — bill anywhere, sync when the line comes back. 🏔️

</div>
