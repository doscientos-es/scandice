import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Pencil, ScanLine, Search } from 'lucide-react'
import { useState } from 'react'

import { downloadCsv, todayStamp } from '@/shared/domain/csv'
import { shoppingList, stockLevel } from '@/shared/domain/stock'
import type { StockLevel } from '@/shared/domain/stock'
import type { Ingredient } from '@/shared/domain/types'
import { formatDateTime, formatMoney, formatQty, unitMeta } from '@/shared/domain/units'
import { actions, getState, useAppState } from '@/shared/store/store'
import { NumberInput, Field, Input, Select } from '@/shared/ui/form'
import { ExportActions } from '@/shared/ui/export-actions'
import { Modal } from '@/shared/ui/modal'
import { Badge, Button, Card, EmptyState, PageHeader, StockBar, Tabs, buttonStyles, cn } from '@/shared/ui/primitives'
import { Pagination, usePagination } from '@/shared/ui/pagination'
import { toast } from '@/shared/ui/toast'

interface StockSearch {
  q?: string
  estado?: 'todos' | 'bajo'
  vista?: 'ingredientes' | 'movimientos'
  orden?: 'estado' | 'stock'
}

export const Route = createFileRoute('/stock')({
  validateSearch: (s: StockSearch): StockSearch => ({
    q: s.q ? String(s.q) : undefined,
    // `vista=compra` era la antigua pestaña «Lista de la compra»: ahora vive en «Stock bajo».
    estado: s.estado === 'bajo' || (s.vista as string) === 'compra' ? 'bajo' : undefined,
    vista: s.vista === 'movimientos' ? s.vista : undefined,
    orden: s.orden === 'estado' || s.orden === 'stock' ? s.orden : undefined,
  }),
  component: StockPage,
})

const levelBadge: Record<StockLevel, { tone: 'ok' | 'warn' | 'bad'; label: string }> = {
  ok: { tone: 'ok', label: 'Correcto' },
  low: { tone: 'warn', label: 'Poco stock' },
  out: { tone: 'bad', label: 'Agotado' },
}

const levelRank: Record<StockLevel, number> = { out: 0, low: 1, ok: 2 }
/** Nivel respecto al mínimo: cuanto menor, más urgente reponer. */
const fill = (i: Ingredient) => i.stock / Math.max(i.minStock, 1e-9)

function StockPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/stock' })
  const state = useAppState()
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const vista = search.vista ?? 'ingredientes'
  const onlyLow = search.estado === 'bajo'

  const q = (search.q ?? '').toLowerCase()
  const rows = state.ingredients
    .filter((i) => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    .filter((i) => !onlyLow || stockLevel(i) !== 'ok')
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, 'es')
      if (search.orden === 'estado') return levelRank[stockLevel(a)] - levelRank[stockLevel(b)] || byName
      if (search.orden === 'stock') return fill(a) - fill(b) || byName
      return byName
    })

  const set = (patch: Partial<StockSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  // Cantidad sugerida a pedir y coste de cada ingrediente en stock bajo.
  const orderOf = new Map(shoppingList(state.ingredients).map((s) => [s.ingredient.id, s]))
  const orderTotal = rows.reduce((sum, i) => sum + (orderOf.get(i.id)?.cost ?? 0), 0)
  const cols = onlyLow
    ? 'sm:grid-cols-[1.4fr_1fr_8rem_7rem_2.5rem]'
    : 'sm:grid-cols-[1.4fr_1fr_8rem_2.5rem]'

  const ingredientsPage = usePagination(rows, `${q}|${onlyLow}|${search.orden}`)
  const movementsPage = usePagination(state.movements, 'movimientos')

  const tabValue = vista === 'movimientos' ? vista : onlyLow ? 'bajo' : 'todos'
  const onTab = (id: 'todos' | 'bajo' | 'movimientos') =>
    set(
      id === 'movimientos'
        ? { vista: id }
        : { vista: undefined, estado: id === 'bajo' ? 'bajo' : undefined },
    )

  const exportCsv = () => {
    if (vista === 'ingredientes' && onlyLow) {
      downloadCsv(`stock-bajo-${todayStamp()}`, [
        ['Ingrediente', 'Unidad', 'Stock', 'Mínimo', 'A pedir', 'Coste estimado'],
        ...rows.map((i) => {
          const order = orderOf.get(i.id)
          return [
            i.name,
            i.unit,
            i.stock,
            i.minStock,
            order?.toOrder ?? '',
            order ? Math.round(order.cost * 100) / 100 : '',
          ]
        }),
      ])
      toast('Stock bajo exportado', { description: `${rows.length} ingredientes en CSV.` })
      return
    }
    if (vista === 'movimientos') {
      downloadCsv(`movimientos-${todayStamp()}`, [
        ['Fecha', 'Ingrediente', 'Motivo', 'Cantidad', 'Unidad'],
        ...state.movements.map((m) => {
          const ing = state.ingredients.find((i) => i.id === m.ingredientId)
          return [m.at, ing?.name, m.label, m.delta, ing?.unit]
        }),
      ])
      return
    }
    downloadCsv(`stock-${todayStamp()}`, [
      ['Ingrediente', 'Categoría', 'Unidad', 'Stock', 'Mínimo', 'Estado'],
      ...rows.map((i) => [i.name, i.category, i.unit, i.stock, i.minStock, levelBadge[stockLevel(i)].label]),
    ])
    toast('Stock exportado', { description: `${rows.length} ingredientes en CSV.` })
  }

  return (
    <>
      <PageHeader
        title="Stock"
        description="Siempre en la unidad mínima: unidades, gramos o mililitros."
        actions={<ExportActions onExport={exportCsv} />}
      />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <Tabs
          value={tabValue}
          onChange={onTab}
          options={[
            { id: 'todos', label: 'Todos', count: state.ingredients.length },
            { id: 'bajo', label: 'Stock bajo', count: state.ingredients.filter((i) => stockLevel(i) !== 'ok').length },
            { id: 'movimientos', label: 'Movimientos' },
          ]}
        />
        {vista === 'ingredientes' && (
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
              <Input
                className="pl-9"
                placeholder="Buscar ingrediente…"
                aria-label="Buscar ingrediente"
                data-search
                defaultValue={search.q}
                onChange={(e) => set({ q: e.target.value || undefined })}
              />
            </div>
            <Select
              className="w-auto! shrink-0"
              aria-label="Ordenar"
              value={search.orden ?? ''}
              onChange={(e) => set({ orden: (e.target.value || undefined) as StockSearch['orden'] })}
            >
              <option value="">Nombre</option>
              <option value="estado">Más urgentes</option>
              <option value="stock">Menos stock</option>
            </Select>
          </div>
        )}
      </div>

      {vista === 'movimientos' ? (
        <>
          <Card className="divide-y divide-line">
            {state.movements.length === 0 && (
              <EmptyState
                title="Sin movimientos todavía"
                action={
                  <Link to="/albaranes/nuevo" className={buttonStyles('primary')}>
                    <ScanLine className="size-4" /> Escanear albarán
                  </Link>
                }
              >
                Aquí aparecerán albaranes, ventas y ajustes.</EmptyState>
            )}
            {movementsPage.items.map((m) => {
              const ing = state.ingredients.find((i) => i.id === m.ingredientId)
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted">{formatDateTime(m.at)}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{ing?.name}</span>
                    <span className="text-muted"> · {m.label}</span>
                  </span>
                  <span className={cn('tabular font-medium', m.delta > 0 ? 'text-ok' : 'text-bad')}>
                    {m.delta > 0 ? '+' : ''}
                    {ing ? formatQty(m.delta, ing.unit) : m.delta}
                  </span>
                </div>
              )
            })}
          </Card>
          <Pagination {...movementsPage} />
        </>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No hay ingredientes que coincidan"
          icon={<Search className="size-5" />}
          action={
            <Button variant="secondary" onClick={() => set({ q: undefined, estado: undefined })}>
              Quitar filtros
            </Button>
          }
        >
          Prueba con otro nombre o quita el filtro de stock bajo.
        </EmptyState>
      ) : (
        <>
          <Card className="divide-y divide-line overflow-hidden">
            <div className={cn('hidden gap-x-4 bg-subtle/60 px-5 py-2 text-xs font-medium text-muted sm:grid', cols)}>
              <span>Ingrediente</span>
              <span>Stock</span>
              <span>Estado</span>
              {onlyLow && <span className="text-right">A pedir</span>}
              <span className="sr-only">Acciones</span>
            </div>
            {ingredientsPage.items.map((i) => {
              const badge = levelBadge[stockLevel(i)]
              const order = orderOf.get(i.id)
              return (
                <div key={i.id} className={cn('grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-subtle/50', cols)}>
                  <div className="min-w-0">
                    <Link
                      to="/ingredientes/$ingredientId"
                      params={{ ingredientId: i.id }}
                      className="block truncate font-medium hover:text-brand hover:underline"
                    >
                      {i.name}
                    </Link>
                    <p className="text-xs text-muted">{i.category}</p>
                  </div>
                  <div className="order-last col-span-2 sm:order-0 sm:col-span-1">
                    <div className="tabular mb-1.5 flex justify-between text-sm">
                      <span className="font-semibold">{formatQty(i.stock, i.unit)}</span>
                      <span className="text-xs text-muted">mín. {formatQty(i.minStock, i.unit)}</span>
                    </div>
                    <StockBar stock={i.stock} min={i.minStock} />
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {onlyLow && (
                    <div className="text-right">
                      {order ? (
                        <>
                          <p className="tabular text-sm font-semibold">{formatQty(order.toOrder, i.unit)}</p>
                          <p className="tabular text-xs text-muted">≈ {formatMoney(order.cost)}</p>
                        </>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </div>
                  )}
                  <Button variant="ghost" className="print:hidden" aria-label={`Ajustar ${i.name}`} onClick={() => setEditing(i)}>
                    <Pencil className="size-4" />
                  </Button>
                </div>
              )
            })}
            {onlyLow && (
              <div className="flex justify-between bg-subtle/60 px-5 py-3 text-sm font-medium">
                <span>Total estimado a pedir</span>
                <span className="tabular">{formatMoney(orderTotal)}</span>
              </div>
            )}
          </Card>
          <Pagination {...ingredientsPage} />
        </>
      )}

      <AdjustModal ingredient={editing} onClose={() => setEditing(null)} />
    </>
  )
}

function AdjustModal({ ingredient, onClose }: { ingredient: Ingredient | null; onClose: () => void }) {
  const [stock, setStock] = useState(0)
  const [min, setMin] = useState(0)
  const [seen, setSeen] = useState<string | null>(null)

  // Reinicia los campos cuando se abre con otro ingrediente.
  if (ingredient && ingredient.id !== seen) {
    setSeen(ingredient.id)
    setStock(ingredient.stock)
    setMin(ingredient.minStock)
  }
  if (!ingredient && seen) setSeen(null)

  const unit = ingredient ? unitMeta[ingredient.unit].label : ''
  const save = () => {
    if (!ingredient) return
    const before = getState()
    actions.adjustIngredient(ingredient.id, { stock, minStock: min })
    toast('Stock ajustado', {
      description: ingredient.name,
      action: { label: 'Deshacer', onClick: () => actions.restore(before) },
    })
    onClose()
  }

  return (
    <Modal open={!!ingredient} title={`Ajustar ${ingredient?.name ?? ''}`} onClose={onClose}>
      <p className="mb-4 text-sm text-muted">
        Usa esto para corregir el stock tras un recuento o una merma. Queda registrado en Movimientos.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Stock real">
          <NumberInput value={stock} onChange={setStock} suffix={unit} />
        </Field>
        <Field label="Avisar cuando quede menos de">
          <NumberInput value={min} onChange={setMin} suffix={unit} />
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save}>Guardar</Button>
      </div>
    </Modal>
  )
}
