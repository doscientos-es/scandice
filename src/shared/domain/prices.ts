import { packTotal } from './stock'
import type { DeliveryNote, Ingredient, NoteLine } from './types'

/** Variaciones menores a este porcentaje se ignoran (redondeos del albarán). */
const MIN_CHANGE = 0.005

export interface PriceChange {
  ingredientId: string
  /** Precio por unidad mínima en este albarán. */
  current: number
  /** Precio por unidad mínima con el que se compara. */
  previous: number
  /** Variación relativa: 0.12 = +12 %. */
  pct: number
  /** Fecha del albarán anterior; null si se compara con el último coste conocido. */
  previousDate: string | null
  previousSupplier: string | null
}

/** Precio por unidad mínima de una línea (null si falta el total o la cantidad). */
export function linePrice(l: Pick<NoteLine, 'packs' | 'unitsPerPack' | 'sizePerUnit' | 'lineTotal'>): number | null {
  const qty = packTotal(l)
  return l.lineTotal > 0 && qty > 0 ? l.lineTotal / qty : null
}

/**
 * Compara el precio de una línea con el del albarán anterior del mismo ingrediente.
 * Si no hay albarán anterior y se pasa `fallback` (último coste conocido), usa ese.
 */
export function lineChange(
  line: NoteLine,
  notes: DeliveryNote[],
  opts: { date: string; noteId?: string; fallback?: number },
): PriceChange | null {
  const id = line.ingredientId
  const current = linePrice(line)
  if (!id || current === null) return null

  let prev: { price: number; note: DeliveryNote } | null = null
  for (const n of notes) {
    if (n.id === opts.noteId || n.date > opts.date) continue
    for (const l of n.lines) {
      const price = l.ingredientId === id ? linePrice(l) : null
      if (price === null) continue
      const newer = !prev || n.date > prev.note.date || (n.date === prev.note.date && n.createdAt > prev.note.createdAt)
      if (newer) prev = { price, note: n }
    }
  }

  const previous = prev?.price ?? (opts.fallback && opts.fallback > 0 ? opts.fallback : null)
  if (previous === null) return null
  const pct = (current - previous) / previous
  if (Math.abs(pct) < MIN_CHANGE) return null
  return {
    ingredientId: id,
    current,
    previous,
    pct,
    previousDate: prev?.note.date ?? null,
    previousSupplier: prev?.note.supplier ?? null,
  }
}

export interface PricePoint {
  noteId: string
  date: string
  supplier: string
  /** Precio por unidad mínima. */
  price: number
  /** Cantidad comprada, en unidad mínima. */
  qty: number
  total: number
}

/** Compras de un ingrediente según los albaranes, de la más antigua a la más reciente. */
export function priceHistory(notes: DeliveryNote[], ingredientId: string): PricePoint[] {
  const points: (PricePoint & { createdAt: string })[] = []
  for (const n of notes) {
    for (const l of n.lines) {
      const price = l.ingredientId === ingredientId ? linePrice(l) : null
      if (price === null) continue
      points.push({
        noteId: n.id,
        date: n.date,
        supplier: n.supplier,
        price,
        qty: packTotal(l),
        total: l.lineTotal,
        createdAt: n.createdAt,
      })
    }
  }
  return points
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map(({ createdAt: _c, ...p }) => p)
}

export interface PriceStats {
  purchases: number
  totalQty: number
  totalSpent: number
  min: number
  max: number
  /** Precio medio ponderado por cantidad. */
  avg: number
  last: number
  /** Variación entre la primera y la última compra (0.1 = +10 %); null con una sola compra. */
  trend: number | null
}

export function priceStats(points: PricePoint[]): PriceStats | null {
  if (points.length === 0) return null
  const totalQty = points.reduce((s, p) => s + p.qty, 0)
  const totalSpent = points.reduce((s, p) => s + p.total, 0)
  const prices = points.map((p) => p.price)
  const first = points[0]!.price
  const last = points[points.length - 1]!.price
  return {
    purchases: points.length,
    totalQty,
    totalSpent,
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: totalSpent / totalQty,
    last,
    trend: points.length > 1 ? (last - first) / first : null,
  }
}

export interface RecentRise extends PriceChange {
  ingredient: Ingredient
  noteId: string
  supplier: string
  date: string
}

/** Últimas subidas de precio por ingrediente, según sus dos albaranes más recientes (mayor subida primero). */
export function recentRises(notes: DeliveryNote[], ingredients: Ingredient[], limit = 5): RecentRise[] {
  const byRecent = [...notes].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const seen = new Set<string>()
  const rises: RecentRise[] = []
  for (const n of byRecent) {
    for (const l of n.lines) {
      if (!l.ingredientId || seen.has(l.ingredientId)) continue
      if (linePrice(l) === null) continue
      seen.add(l.ingredientId)
      const ingredient = ingredients.find((i) => i.id === l.ingredientId)
      const change = lineChange(l, notes, { date: n.date, noteId: n.id })
      if (ingredient && change && change.pct > 0) {
        rises.push({ ...change, ingredient, noteId: n.id, supplier: n.supplier, date: n.date })
      }
    }
  }
  return rises.sort((a, b) => b.pct - a.pct).slice(0, limit)
}
