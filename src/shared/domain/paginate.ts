export const PAGE_SIZE = 20

export interface Page<T> {
  items: T[]
  /** Página actual, ya ajustada al rango válido (empieza en 1). */
  page: number
  pageCount: number
  total: number
  /** Posición (1-based) del primer y último elemento mostrado; 0 si no hay. */
  from: number
  to: number
}

/** Corta una lista en páginas. Una página fuera de rango se ajusta a la más cercana. */
export function paginate<T>(list: T[], page: number, size = PAGE_SIZE): Page<T> {
  const total = list.length
  const pageCount = Math.max(1, Math.ceil(total / size))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount)
  const start = (current - 1) * size
  const items = list.slice(start, start + size)
  return {
    items,
    page: current,
    pageCount,
    total,
    from: items.length ? start + 1 : 0,
    to: start + items.length,
  }
}
