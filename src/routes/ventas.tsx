import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'

import { needsForSales, shortagesOf } from '@/shared/domain/recipes'
import { stockLevel } from '@/shared/domain/stock'
import type { Ingredient, SaleLine } from '@/shared/domain/types'
import { formatMoney, formatQty } from '@/shared/domain/units'
import { actions, useAppState } from '@/shared/store/store'
import { QtyStepper } from '@/shared/ui/form'
import { Badge, Button, Card, EmptyState, Notice, PageHeader, buttonStyles, cn } from '@/shared/ui/primitives'
import { SplitLayout } from '@/shared/ui/stepper'

export const Route = createFileRoute('/ventas')({ component: SalesPage })

function SalesPage() {
  const state = useAppState()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [done, setDone] = useState<{ total: number; warnings: Ingredient[] } | null>(null)

  const finals = state.recipes.filter((r) => r.kind === 'final')
  const lines: SaleLine[] = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([recipeId, qty]) => ({ recipeId, qty }))

  const needs = useMemo(() => needsForSales(lines, state.recipes), [lines, state.recipes])
  const canAdd = (recipeId: string) =>
    shortagesOf(
      needsForSales(
        [...lines.filter((l) => l.recipeId !== recipeId), { recipeId, qty: (cart[recipeId] ?? 0) + 1 }],
        state.recipes,
      ),
      state.ingredients,
    ).length === 0

  const total = lines.reduce(
    (sum, l) => sum + l.qty * (state.recipes.find((r) => r.id === l.recipeId)?.price ?? 0),
    0,
  )
  const consumption = [...needs]
    .map(([id, used]) => ({ ingredient: state.ingredients.find((i) => i.id === id)!, used }))
    .filter((c) => c.ingredient)
    .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name, 'es'))

  const confirm = () => {
    const after = state.ingredients.map((i) => ({ ...i, stock: i.stock - (needs.get(i.id) ?? 0) }))
    const warnings = after.filter((i) => needs.has(i.id) && stockLevel(i) !== 'ok')
    actions.registerSales(lines)
    setDone({ total, warnings })
    setCart({})
  }

  return (
    <>
      <PageHeader title="Registrar ventas" description="Toca + por cada plato vendido. El stock se descuenta al confirmar." />

      {done && (
        <div className="mb-5 space-y-2">
          <Notice tone="ok">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            Ventas registradas ({formatMoney(done.total)}). El stock ya está actualizado.
          </Notice>
          {done.warnings.length > 0 && (
            <Notice tone="warn">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>Queda poco de: {done.warnings.map((w) => w.name).join(', ')}.</span>
            </Notice>
          )}
        </div>
      )}

      <SplitLayout
        form={
          finals.length === 0 ? (
            <EmptyState
              title="Aún no hay recetas finales"
              icon={<ShoppingBag className="size-5" />}
              action={
                <Link to="/recetas/nueva" className={buttonStyles('primary')}>
                  Crear receta
                </Link>
              }
            >
              Crea una receta para poder venderla.
            </EmptyState>
          ) : (
            <Card className="divide-y divide-line overflow-hidden">
              {finals.map((r) => {
                const qty = cart[r.id] ?? 0
                return (
                  <div
                    key={r.id}
                    className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors', qty > 0 && 'bg-brand-soft/40')}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="tabular text-xs text-muted">{formatMoney(r.price)}</p>
                      {!canAdd(r.id) && <p className="mt-1 text-xs text-bad">No queda stock para más.</p>}
                    </div>
                    <QtyStepper
                      label={r.name}
                      value={qty}
                      disableIncrement={!canAdd(r.id)}
                      onChange={(n) => {
                        setDone(null)
                        setCart({ ...cart, [r.id]: n })
                      }}
                    />
                  </div>
                )
              })}
            </Card>
          )
        }
        preview={
          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold">Resumen de la venta</h2>
            {lines.length === 0 ? (
              <p className="text-sm text-muted">Añade platos para ver qué ingredientes se gastarán.</p>
            ) : (
              <>
                <ul className="mb-4 space-y-1.5 text-sm">
                  {lines.map((l) => {
                    const r = state.recipes.find((x) => x.id === l.recipeId)!
                    return (
                      <li key={l.recipeId} className="flex justify-between">
                        <span>{l.qty}× {r.name}</span>
                        <span className="tabular">{formatMoney(l.qty * r.price)}</span>
                      </li>
                    )
                  })}
                  <li className="flex justify-between border-t border-line pt-2 font-semibold">
                    <span>Total</span>
                    <span className="tabular">{formatMoney(total)}</span>
                  </li>
                </ul>
                <h3 className="mb-2 text-xs font-medium tracking-wide text-muted">SE DESCONTARÁ DEL STOCK</h3>
                <ul className="mb-5 space-y-1.5 text-sm">
                  {consumption.map(({ ingredient: i, used }) => {
                    const left = { ...i, stock: i.stock - used }
                    const level = stockLevel(left)
                    return (
                      <li key={i.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{i.name}</span>
                        <span className="tabular flex items-center gap-2 whitespace-nowrap text-muted">
                          −{formatQty(used, i.unit)} → {formatQty(left.stock, i.unit)}
                          {level !== 'ok' && <Badge tone="warn">poco</Badge>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setCart({})}>Vaciar</Button>
                  <Button size="lg" className="flex-1" onClick={confirm}>Descontar del stock</Button>
                </div>
              </>
            )}
          </Card>
        }
      />
    </>
  )
}
