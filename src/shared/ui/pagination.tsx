import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { paginate } from '@/shared/domain/paginate'
import type { Page } from '@/shared/domain/paginate'

import { Button } from './primitives'

/**
 * Página actual de una lista. `resetKey` identifica los filtros activos:
 * al cambiar (búsqueda, pestaña, orden…) se vuelve a la página 1.
 */
export function usePagination<T>(list: T[], resetKey: string, size?: number) {
  const [state, setState] = useState({ key: resetKey, page: 1 })
  const requested = state.key === resetKey ? state.page : 1
  const result = paginate(list, requested, size)
  const setPage = (page: number) => setState({ key: resetKey, page })
  return { ...result, setPage }
}

export function Pagination({
  page,
  pageCount,
  total,
  from,
  to,
  setPage,
}: Page<unknown> & { setPage: (page: number) => void }) {
  if (pageCount <= 1) return null
  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex items-center justify-between gap-3 text-sm text-muted print:hidden"
    >
      <p className="tabular" aria-live="polite">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="secondary" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="tabular px-2">
          {page} / {pageCount}
        </span>
        <Button variant="secondary" aria-label="Página siguiente" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  )
}
