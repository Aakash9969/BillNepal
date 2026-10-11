import {
  Beer,
  Coffee,
  CookingPot,
  CupSoda,
  Dessert,
  Egg,
  Flame,
  Soup,
  Utensils,
  UtensilsCrossed,
  CakeSlice,
  Martini,
  Milk,
  type LucideIcon,
} from 'lucide-react'

/** Maps seeded category icon keys to lucide components. */
const MAP: Record<string, LucideIcon> = {
  Beer,
  Coffee,
  CookingPot,
  CupSoda,
  Dessert,
  Egg,
  Flame,
  Soup,
  Utensils,
  UtensilsCrossed,
  CakeSlice,
  Martini,
  Milk,
}

export function CategoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = MAP[name] ?? Utensils
  return <Icon size={size} aria-hidden="true" />
}
