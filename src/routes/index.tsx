import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, ChefHat, ReceiptText, ScanLine, ShoppingBag } from 'lucide-react'
import { useMemo } from 'react'

import { canAccess, roleById } from '@/shared/domain/roles'
import { maxPortions } from '@/shared/domain/recipes'
import { isLowOrOut } from '@/shared/domain/stock'
import { formatDate, formatMoney, formatQty } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { Badge, Card, PageHeader, StockBar, buttonStyles } from '@/shared/ui/primitives'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const state = useAppState()
  const role = roleById(state.role)
  const low = state.ingredients.filter(isLowOrOut)
  const finals = useMemo(
    () =>
      state.recipes
        .filter((r) => r.kind === 'final')
        .map((r) => ({ recipe: r, ...maxPortions(r, state.recipes, state.ingredients) }))
        .sort((a, b) => a.portions - b.portions),
    [state.recipes, state.ingredients],
  )
  const stockValue = state.ingredients.reduce((sum, i) => sum + i.stock * i.costPerUnit, 0)

  const actions = [
    { to: '/albaranes/nuevo', label: 'Escanear albarán', icon: ScanLine, section: 'albaranes', primary: true },
    { to: '/ventas', label: 'Registrar ventas', icon: ShoppingBag, section: 'ventas' },
    { to: '/recetas/nueva', label: 'Nueva receta', icon: ChefHat, section: 'recetas' },
  ] as const

  return (
    <>
      <PageHeader title={`Hola, ${role?.label.toLowerCase()}`} description="Resumen de cómo está la cocina ahora mismo." />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {actions
          .filter((a) => canAccess(state.role, a.section))
          .map(({ to, label, icon: Icon, ...a }) => (
            <Link
              key={to}
              to={to}
              className={buttonStyles('primary' in a ? 'primary' : 'secondary', 'lg', 'justify-start gap-3')}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ingredientes" value={String(state.ingredients.length)} />
        <Kpi label="Con stock bajo" value={String(low.length)} tone={low.length ? 'warn' : undefined} />
        <Kpi label="Platos disponibles" value={`${finals.filter((f) => f.portions > 0).length}/${finals.length}`} />
        <Kpi label="Valor del stock" value={formatMoney(stockValue)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Avisos de stock</h2>
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
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Qué puedes cocinar ahora</h2>
          <ul className="divide-y divide-line">
            {finals.map(({ recipe, portions, limiting }) => (
              <li key={recipe.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{recipe.name}</p>
                  {limiting && portions < 10 && (
                    <p className="text-xs text-muted">Limita: {limiting.name}</p>
                  )}
                </div>
                <Badge tone={portions === 0 ? 'bad' : portions < 5 ? 'warn' : 'ok'}>
                  {portions} raciones
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        {canAccess(state.role, 'albaranes') && (
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Últimos albaranes</h2>
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
          </Card>
        )}
      </div>
    </>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-muted">{label}</p>
      <p className={`tabular mt-1 text-2xl font-semibold tracking-tight ${tone === 'warn' ? 'text-warn' : ''}`}>
        {value}
      </p>
    </Card>
  )
}
