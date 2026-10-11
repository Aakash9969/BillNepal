import { useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Flame, Leaf, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useApp } from '@/store'
import { useT } from '@/i18n/useT'
import { uid } from '@/lib/id'
import { fmtNpr } from '@/lib/money'
import type { Category, Daypart, MenuItem } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/lib/cn'

type Tab = 'items' | 'categories'

/* ── editor constants (mirror the seeded palette) ────────────────────── */

const ICON_KEYS = [
  'CookingPot',
  'Utensils',
  'Soup',
  'Flame',
  'Egg',
  'Coffee',
  'CupSoda',
  'Dessert',
  'Beer',
  'CakeSlice',
  'Martini',
  'Milk',
  'UtensilsCrossed',
] as const

const HUES = [
  'from-crimson-400 to-crimson-600',
  'from-gold-400 to-gold-500',
  'from-sky-400 to-sky-500',
  'from-amber-400 to-amber-500',
  'from-mint-400 to-mint-500',
  'from-violet-400 to-violet-500',
] as const

const DAYPARTS: Daypart[] = ['breakfast', 'lunch', 'dinner']

const DAYPART_KEY: Record<Daypart, 'order.daypart.breakfast' | 'order.daypart.lunch' | 'order.daypart.dinner'> = {
  breakfast: 'order.daypart.breakfast',
  lunch: 'order.daypart.lunch',
  dinner: 'order.daypart.dinner',
}

const CHIP_ACTIVE = 'border-crimson-400/60 bg-crimson-500/20 text-crimson-200'
const CHIP_IDLE = 'border-line-strong bg-ink-900 text-fog-400 hover:border-ink-500 hover:text-fog-200'

/* ── item editor ─────────────────────────────────────────────────────── */

function ItemModal({ item, open, onClose }: { item: MenuItem | null; open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const allCategories = useApp((s) => s.categories)
  const categories = useMemo(() => [...allCategories].sort((a, b) => a.sort - b.sort), [allCategories])
  const modifierGroups = useApp((s) => s.modifierGroups)
  const upsertItem = useApp((s) => s.upsertItem)
  const toast = useApp((s) => s.toast)

  const [name, setName] = useState('')
  const [nameNe, setNameNe] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [desc, setDesc] = useState('')
  const [descNe, setDescNe] = useState('')
  const [veg, setVeg] = useState(false)
  const [spice, setSpice] = useState<0 | 1 | 2 | 3>(0)
  const [dayparts, setDayparts] = useState<Daypart[]>([])
  const [mods, setMods] = useState<string[]>([])
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setNameNe(item?.nameNe ?? '')
    setCategoryId(item?.categoryId ?? categories[0]?.id ?? '')
    setPrice(item ? String(item.price) : '')
    setDesc(item?.desc ?? '')
    setDescNe(item?.descNe ?? '')
    setVeg(item?.veg ?? false)
    setSpice(item?.spice ?? 0)
    setDayparts(item?.dayparts ?? [])
    setMods(item?.modifierGroupIds ?? [])
    setAvailable(item?.available ?? true)
  }, [open, item?.id])

  const toggleDaypart = (d: Daypart) =>
    setDayparts((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  const toggleMod = (id: string) =>
    setMods((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const save = () => {
    const p = Math.round((parseFloat(price) || 0) * 100) / 100
    if (!name.trim() || p <= 0) {
      toast('error', t('menu.needNamePrice'))
      return
    }
    upsertItem({
      id: item?.id ?? uid('it'),
      categoryId: categoryId || categories[0]?.id || '',
      name: name.trim(),
      nameNe: nameNe.trim() || name.trim(),
      desc: desc.trim(),
      descNe: descNe.trim(),
      price: p,
      veg,
      spice,
      available,
      archived: item?.archived ?? false,
      dayparts,
      modifierGroupIds: mods,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? t('menu.editItem') : t('menu.addItem')}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
        <Field label={t('menu.nameEn')}>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('menu.nameNe')}>
          <Input value={nameNe} onChange={(e) => setNameNe(e.target.value)} />
        </Field>
        <Field label={t('menu.category')}>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === 'ne' ? c.nameNe : c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('menu.price')}>
          <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono" />
        </Field>
        <Field label={t('menu.descEn')}>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
        <Field label={t('menu.descNe')}>
          <Textarea value={descNe} onChange={(e) => setDescNe(e.target.value)} />
        </Field>

        <div className="space-y-4 sm:col-span-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Toggle checked={veg} onChange={setVeg} label={t('menu.veg')} />
            <Toggle checked={available} onChange={setAvailable} label={t('menu.available')} />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('menu.spice')}</p>
            <Segmented<'0' | '1' | '2' | '3'>
              ariaLabel={t('menu.spice')}
              size="sm"
              value={String(spice) as '0' | '1' | '2' | '3'}
              onChange={(v) => setSpice(Number(v) as 0 | 1 | 2 | 3)}
              options={[
                { id: '0', label: t('menu.spice.none') },
                { id: '1', label: t('menu.spice.mild') },
                { id: '2', label: t('menu.spice.medium') },
                { id: '3', label: t('menu.spice.hot') },
              ]}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('menu.dayparts')}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {DAYPARTS.map((d) => {
                const on = dayparts.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() => toggleDaypart(d)}
                    className={cn('cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors', on ? CHIP_ACTIVE : CHIP_IDLE)}
                  >
                    {t(DAYPART_KEY[d])}
                  </button>
                )
              })}
              {dayparts.length === 0 && <span className="self-center text-[11.5px] text-fog-500">{t('order.allDay')}</span>}
            </div>
          </div>

          {modifierGroups.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('menu.modifiers')}</p>
              <div className="flex flex-wrap gap-1.5">
                {modifierGroups.map((g) => {
                  const on = mods.includes(g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleMod(g.id)}
                      className={cn('cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors', on ? CHIP_ACTIVE : CHIP_IDLE)}
                    >
                      {lang === 'ne' ? g.nameNe : g.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ── category editor ─────────────────────────────────────────────────── */

function CategoryModal({ category, open, onClose }: { category: Category | null; open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const categories = useApp((s) => s.categories)
  const upsertCategory = useApp((s) => s.upsertCategory)
  const toast = useApp((s) => s.toast)

  const [name, setName] = useState('')
  const [nameNe, setNameNe] = useState('')
  const [icon, setIcon] = useState<string>('UtensilsCrossed')
  const [hue, setHue] = useState<string>(HUES[0])

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setNameNe(category?.nameNe ?? '')
    setIcon(category?.icon ?? 'UtensilsCrossed')
    setHue(category?.hue ?? HUES[0])
  }, [open, category?.id])

  const save = () => {
    if (!name.trim()) {
      toast('error', t('menu.needName'))
      return
    }
    upsertCategory({
      id: category?.id ?? uid('cat'),
      name: name.trim(),
      nameNe: nameNe.trim() || name.trim(),
      icon,
      hue,
      sort: category?.sort ?? categories.length + 1,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? t('menu.editCategory') : t('menu.addCategory')}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-ink-950', hue)}>
            <CategoryIcon name={icon} size={22} />
          </span>
          <Field label={t('menu.nameEn')} className="flex-1">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Field label={t('menu.nameNe')}>
          <Input value={nameNe} onChange={(e) => setNameNe(e.target.value)} />
        </Field>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('menu.icon')}</p>
          <div className="flex flex-wrap gap-1.5">
            {ICON_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => setIcon(k)}
                aria-label={k}
                className={cn(
                  'grid h-9 w-9 cursor-pointer place-items-center rounded-lg border transition-colors',
                  icon === k ? 'border-crimson-400/60 bg-crimson-500/20 text-crimson-200' : 'border-line-strong bg-ink-900 text-fog-400 hover:text-fog-200'
                )}
              >
                <CategoryIcon name={k} size={16} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fog-400">{t('menu.icon')} · {t('common.new')}</p>
          <div className="flex flex-wrap gap-1.5">
            {HUES.map((h) => (
              <button
                key={h}
                onClick={() => setHue(h)}
                aria-label={h}
                className={cn(
                  'h-9 w-9 cursor-pointer rounded-lg border-2 bg-gradient-to-br transition-all',
                  h,
                  hue === h ? 'border-fog-100' : 'border-transparent opacity-60 hover:opacity-100'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ── main view ───────────────────────────────────────────────────────── */

export function MenuManager() {
  const { t, lang, nd } = useT()
  const s = useApp()

  const [tab, setTab] = useState<Tab>('items')
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [itemModal, setItemModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null })
  const [catModal, setCatModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })

  const categories = useMemo(() => [...s.categories].sort((a, b) => a.sort - b.sort), [s.categories])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return s.items
      .filter((i) => (showArchived ? true : !i.archived))
      .filter((i) => catFilter === 'all' || i.categoryId === catFilter)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.nameNe.includes(q))
      .sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name))
  }, [s.items, catFilter, query, showArchived])

  const itemsInCat = (catId: string) => s.items.filter((i) => i.categoryId === catId && !i.archived).length

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 sm:py-6">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-fog-100">{t('menu.title')}</h1>
          <p className="mt-0.5 text-[13px] tabular text-fog-400">
            {nd(s.items.filter((i) => !i.archived).length)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-full overflow-x-auto no-scrollbar">
          <Segmented<Tab>
            ariaLabel={t('menu.title')}
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'items', label: t('menu.tabItems') },
              { id: 'categories', label: t('menu.tabCategories') },
            ]}
          />
        </div>
          <Button
            variant="primary"
            onClick={() =>
              tab === 'items' ? setItemModal({ open: true, item: null }) : setCatModal({ open: true, category: null })
            }
          >
            <Plus size={16} />
            {tab === 'items' ? t('menu.addItem') : t('menu.addCategory')}
          </Button>
        </div>
      </div>

      {tab === 'items' ? (
        <>
          {/* controls */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line-strong bg-ink-900 px-3">
              <Search size={15} className="shrink-0 text-fog-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('menu.searchPlaceholder')}
                className="h-10 w-full bg-transparent text-sm text-fog-100 placeholder:text-fog-500 focus:outline-none"
              />
            </div>
            <Toggle checked={showArchived} onChange={setShowArchived} label={t('menu.showArchived')} />
          </div>

          {/* category chips */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => setCatFilter('all')}
              className={cn('cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors', catFilter === 'all' ? CHIP_ACTIVE : CHIP_IDLE)}
            >
              {t('common.all')}
            </button>
            {categories.map((c) => {
              const active = catFilter === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(c.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors',
                    active ? CHIP_ACTIVE : CHIP_IDLE
                  )}
                >
                  <CategoryIcon name={c.icon} size={13} />
                  {lang === 'ne' ? c.nameNe : c.name}
                </button>
              )
            })}
          </div>

          {/* items */}
          {items.length === 0 ? (
            <EmptyState icon={<Search size={22} />} title={t('menu.noItems')} />
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {items.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId)
                return (
                  <li
                    key={item.id}
                    className={cn('flex items-center gap-3 rounded-2xl border border-line-strong bg-ink-850 p-3.5', item.archived && 'opacity-55')}
                  >
                    <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-ink-950', cat?.hue)}>
                      <CategoryIcon name={cat?.icon ?? 'Utensils'} size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-[13.5px] font-bold text-fog-100">
                        {lang === 'ne' ? item.nameNe : item.name}
                        {item.veg && <Leaf size={12} className="shrink-0 text-mint-400" aria-label={t('menu.veg')} />}
                        {Array.from({ length: item.spice }).map((_, i) => (
                          <Flame key={i} size={11} className="shrink-0 text-crimson-400" aria-hidden="true" />
                        ))}
                      </p>
                      <p className="truncate text-[11.5px] text-fog-500">
                        {lang === 'ne' ? cat?.nameNe : cat?.name} ·{' '}
                        {item.dayparts.length === 0
                          ? t('order.allDay')
                          : item.dayparts.map((d) => t(DAYPART_KEY[d])).join(' / ')}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[13.5px] font-bold tabular text-gold-300">
                      Rs. {fmtNpr(item.price, lang)}
                    </span>
                    {item.archived ? (
                      <Button variant="secondary" size="sm" onClick={() => s.setItemArchived(item.id, false)}>
                        <ArchiveRestore size={13} />
                        {t('menu.unarchive')}
                      </Button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Toggle checked={item.available} onChange={() => s.toggleItemAvailable(item.id)} />
                        <button
                          onClick={() => setItemModal({ open: true, item })}
                          aria-label={t('common.edit')}
                          title={t('common.edit')}
                          className="rounded-lg p-2 text-fog-500 transition-colors hover:bg-ink-750 hover:text-fog-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => s.setItemArchived(item.id, true)}
                          aria-label={t('menu.archive')}
                          title={t('menu.archive')}
                          className="rounded-lg p-2 text-fog-500 transition-colors hover:bg-ink-750 hover:text-amber-400"
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : (
        /* categories */
        <>
          {categories.length === 0 ? (
            <EmptyState icon={<Search size={22} />} title={t('menu.noItems')} />
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-line-strong bg-ink-850 p-4">
                  <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-ink-950', c.hue)}>
                    <CategoryIcon name={c.icon} size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-fog-100">{lang === 'ne' ? c.nameNe : c.name}</p>
                    <p className="text-[11.5px] text-fog-500">{t('menu.itemsCount', { n: nd(itemsInCat(c.id)) })}</p>
                  </div>
                  <Badge tone="neutral" className="shrink-0">
                    {c.sort}
                  </Badge>
                  <button
                    onClick={() => setCatModal({ open: true, category: c })}
                    aria-label={t('common.edit')}
                    title={t('common.edit')}
                    className="shrink-0 rounded-lg p-2 text-fog-500 transition-colors hover:bg-ink-750 hover:text-fog-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => s.deleteCategory(c.id)}
                    aria-label={t('common.delete')}
                    title={t('common.delete')}
                    className="shrink-0 rounded-lg p-2 text-fog-500 transition-colors hover:bg-ink-750 hover:text-crimson-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ItemModal open={itemModal.open} item={itemModal.item} onClose={() => setItemModal({ open: false, item: null })} />
      <CategoryModal open={catModal.open} category={catModal.category} onClose={() => setCatModal({ open: false, category: null })} />
    </div>
  )
}
