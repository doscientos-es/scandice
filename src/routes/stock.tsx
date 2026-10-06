import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Pencil, Search } from 'lucide-react'
import { useState } from 'react'

import { stockLevel } from '@/shared/domain/stock'
import type { StockLevel } from '@/shared/domain/stock'
import type { Ingredient } from '@/shared/domain/types'
import { formatDateTime, formatQty, unitMeta } from '@/shared/domain/units'
import { actions, useAppState } from '@/shared/store/store'
import { NumberInput, Field, Input } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { Badge, Button, Card, EmptyState, PageHeader, StockBar, Tabs, cn } from '@/shared/ui/primitives'

interface StockSearch {
  q?: string
  estado?: 'todos' | 'bajo'
  vista?: 'ingredientes' | 'movimientos'
}

export const Route = createFileRoute('/stock')({
  validateSearch: (s: StockSearch): StockSearch => ({
    q: s.q ? String(s.q) : undefined,
    estado: s.estado === 'bajo' ? 'bajo' : undefined,
    vista: s.vista === 'movimientos' ? 'movimientos' : undefined,
  }),
  component: StockPage,
})

const levelBadge: Record<StockLevel, { tone: 'ok' | 'warn' | 'bad'; label: string }> = {
  ok: { tone: 'ok', label: 'Correcto' },
  low: { tone: 'warn', label: 'Poco stock' },
  out: { tone: 'bad', label: 'Agotado' },
}

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
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const set = (patch: Partial<StockSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  const tabValue = vista === 'movimientos' ? 'movimientos' : onlyLow ? 'bajo' : 'todos'
  const onTab = (id: 'todos' | 'bajo' | 'movimientos') =>
    set(
      id === 'movimientos'
        ? { vista: 'movimientos' }
        : { vista: undefined, estado: id === 'bajo' ? 'bajo' : undefined },
    )

  return (
    <>
      <PageHeader title="Stock" description="Siempre en la unidad mínima: unidades, gramos o mililitros." />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <Tabs
          value={tabValue}
          onChange={onTab}
          options={[
            { id: 'todos', label: 'Todos' },
            { id: 'bajo', label: 'Stock bajo' },
            { id: 'movimientos', label: 'Movimientos' },
          ]}
        />
        {vista === 'ingredientes' && (
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
            <Input
              className="pl-9"
              placeholder="Buscar ingrediente…"
              aria-label="Buscar ingrediente"
              defaultValue={search.q}
              onChange={(e) => set({ q: e.target.value || undefined })}
            />
          </div>
        )}
      </div>

      {vista === 'movimientos' ? (
        <Card className="divide-y divide-line">
          {state.movements.length === 0 && (
            <EmptyState title="Sin movimientos todavía">Aquí aparecerán albaranes, ventas y ajustes.</EmptyState>
          )}
          {state.movements.slice(0, 100).map((m) => {
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
      ) : rows.length === 0 ? (
        <EmptyState title="No hay ingredientes que coincidan" />
      ) : (
        <Card className="divide-y divide-line">
          {rows.map((i) => {
            const badge = levelBadge[stockLevel(i)]
            return (
              <div key={i.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[1.4fr_1fr_auto_auto]">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="text-xs text-muted">{i.category}</p>
                </div>
                <div className="order-last col-span-2 sm:order-none sm:col-span-1">
                  <div className="tabular mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold">{formatQty(i.stock, i.unit)}</span>
                    <span className="text-xs text-muted">mín. {formatQty(i.minStock, i.unit)}</span>
                  </div>
                  <StockBar stock={i.stock} min={i.minStock} />
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
                <Button variant="ghost" aria-label={`Ajustar ${i.name}`} onClick={() => setEditing(i)}>
                  <Pencil className="size-4" />
                </Button>
              </div>
            )
          })}
        </Card>
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
    actions.adjustIngredient(ingredient.id, { stock, minStock: min })
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
