import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, ChefHat, ReceiptText, ScanLine, ShoppingBag } from 'lucide-react'
import { useMemo } from 'react'

import { maxPortions } from '@/shared/domain/recipes'
import { isLowOrOut } from '@/shared/domain/stock'
import { recentRises } from '@/shared/domain/prices'
import { formatDate, formatMoney, formatQty, unitMeta } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { Badge, Card, PageHeader, StockBar, buttonStyles } from '@/shared/ui/primitives'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const state = useAppState()
  const low = state.ingredients.filter(isLowOrOut)
  const finals = useMemo(
    () =>
      state.recipes
        .filter((r) => r.kind === 'final')
        .map((r) => ({ recipe: r, ...maxPortions(r, state.recipes, state.ingredients) }))
        .sort((a, b) => a.portions - b.portions),
    [state.recipes, state.ingredients],
  )
  const rises = useMemo(() => recentRises(state.notes, state.ingredients), [state.notes, state.ingredients])
  const stockValue = state.ingredients.reduce((sum, i) => sum + i.stock * i.costPerUnit, 0)

  const actions = [
    { to: '/albaranes/nuevo', label: 'Escanear albarán', icon: ScanLine, primary: true },
    { to: '/ventas', label: 'Registrar ventas', icon: ShoppingBag },
    { to: '/recetas/nueva', label: 'Nueva receta', icon: ChefHat },
  ] as const

  return (
    <>
      <PageHeader
        title="Hola"
        description="Resumen de cómo está la cocina ahora mismo."
        actions={actions
          .map(({ to, label, icon: Icon, ...a }) => (
            <Link key={to} to={to} className={buttonStyles('primary' in a ? 'primary' : 'secondary')}>
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
      />

      <Card className="mb-10 grid grid-cols-2 divide-line max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(even)]:border-l lg:grid-cols-4 lg:divide-x">
        <Kpi label="Ingredientes" value={String(state.ingredients.length)} />
        <Kpi label="Con stock bajo" value={String(low.length)} tone={low.length ? 'warn' : undefined} />
        <Kpi label="Platos disponibles" value={`${finals.filter((f) => f.portions > 0).length}/${finals.length}`} />
        <Kpi label="Valor del stock" value={formatMoney(stockValue)} />
      </Card>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-semibold">Avisos de stock</h2>
            <Link to="/stock" search={{ estado: 'bajo' }} className="text-sm text-brand hover:underline">
              Ver todo
            </Link>
          </div>
          {low.length === 0 ? (
            <p className="text-sm text-muted">Todo en orden: ningún ingrediente por debajo del mínimo.</p>
          ) : (
            <ul className="space-y-4">
              {low.slice(0, 6).map((i) => (
                <li key={i.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="size-4 text-warn" />
                      {i.name}
                    </span>
                    <span className="tabular text-muted">
                      {formatQty(i.stock, i.unit)} / mín. {formatQty(i.minStock, i.unit)}
                    </span>
                  </div>
                  <StockBar stock={i.stock} min={i.minStock} />
                  <Link
                    to="/stock"
                    search={{ q: i.name }}
                    className="mt-1 inline-block text-xs text-brand hover:underline"
                  >
                    Ajustar stock
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {low.length > 0 && (
            <Link to="/albaranes/nuevo" className={buttonStyles('secondary', 'md', 'mt-4 w-full')}>
              <ScanLine className="size-4" /> Reponer: escanear albarán
            </Link>
          )}
        </section>

        <section>
          <h2 className="mb-3 border-b border-line pb-3 text-sm font-semibold">Qué puedes cocinar ahora</h2>
          <ul className="divide-y divide-line">
            {finals.map(({ recipe, portions, limiting }) => (
              <li key={recipe.id}>
                <Link
                  to="/recetas/$recetaId"
                  params={{ recetaId: recipe.id }}
                  className="group flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium group-hover:text-brand group-hover:underline">
                      {recipe.name}
                    </p>
                    {limiting && portions < 10 && (
                      <p className="text-xs text-muted">Limita: {limiting.name}</p>
                    )}
                  </div>
                  <Badge tone={portions === 0 ? 'bad' : portions < 5 ? 'warn' : 'ok'}>
                    {portions} raciones
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {rises.length > 0 && (
          <section className="lg:col-span-2">
            <h2 className="mb-1 border-b border-line pb-3 text-sm font-semibold">Subidas de precio</h2>
            <ul className="divide-y divide-line">
              {rises.map((r) => (
                <li key={r.ingredient.id}>
                  <Link
                    to="/albaranes/$albaranId"
                    params={{ albaranId: r.noteId }}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm hover:text-brand"
                  >
                    <span className="font-medium">{r.ingredient.name}</span>
                    <Badge tone="bad">+{(r.pct * 100).toFixed(1).replace('.', ',')} %</Badge>
                    <span className="tabular text-muted">
                      {formatMoney(r.previous * unitMeta[r.ingredient.unit].scale)} →{' '}
                      {formatMoney(r.current * unitMeta[r.ingredient.unit].scale)} /{' '}
                      {unitMeta[r.ingredient.unit].bigLabel}
                    </span>
                    <span className="ml-auto text-muted">{r.supplier}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(
          <section className="lg:col-span-2">
            <div className="mb-1 flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-sm font-semibold">Últimos albaranes</h2>
              <Link to="/albaranes" className="text-sm text-brand hover:underline">
                Ver todos
              </Link>
            </div>
            {state.notes.length === 0 ? (
              <p className="text-sm text-muted">Aún no has escaneado ningún albarán.</p>
            ) : (
              <ul className="divide-y divide-line">
                {state.notes.slice(0, 4).map((n) => (
                  <li key={n.id}>
                    <Link
                      to="/albaranes/$albaranId"
                      params={{ albaranId: n.id }}
                      className="flex items-center gap-3 py-2.5 text-sm hover:text-brand"
                    >
                      <ReceiptText className="size-4 text-muted" />
                      <span className="font-medium">{n.supplier}</span>
                      <span className="text-muted">{formatDate(n.date)}</span>
                      <span className="ml-auto text-muted">{n.lines.length} líneas</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`tabular mt-1 text-2xl font-semibold tracking-tight ${tone === 'warn' ? 'text-warn' : ''}`}>
        {value}
      </p>
    </div>
  )
}
