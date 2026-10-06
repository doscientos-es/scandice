import { Link, createFileRoute } from '@tanstack/react-router'
import { ScanLine } from 'lucide-react'
import { useMemo } from 'react'

import { PriceChart } from '@/features/ingredientes/price-chart'
import { priceHistory, priceStats } from '@/shared/domain/prices'
import { stockLevel } from '@/shared/domain/stock'
import { formatDate, formatMoney, formatQty, unitMeta } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { Badge, Card, EmptyState, PageHeader, StockBar, buttonStyles } from '@/shared/ui/primitives'

export const Route = createFileRoute('/ingredientes/$ingredientId')({ component: IngredientDetail })

const pct = (n: number) => `${n > 0 ? '+' : ''}${(n * 100).toFixed(1).replace('.', ',')} %`

function IngredientDetail() {
  const { ingredientId } = Route.useParams()
  const state = useAppState()
  const ingredient = state.ingredients.find((i) => i.id === ingredientId)
  const points = useMemo(() => priceHistory(state.notes, ingredientId), [state.notes, ingredientId])
  const stats = priceStats(points)

  if (!ingredient) {
    return (
      <EmptyState title="Este ingrediente no existe">
        <Link to="/stock" className={buttonStyles('secondary')}>Volver a stock</Link>
      </EmptyState>
    )
  }

  const { scale, bigLabel } = unitMeta[ingredient.unit]
  const money = (perUnit: number) => `${formatMoney(perUnit * scale)} / ${bigLabel}`
  const level = stockLevel(ingredient)

  return (
    <>
      <PageHeader
        title={ingredient.name}
        description={`${ingredient.category} · precios según tus albaranes`}
        actions={<Link to="/stock" className={buttonStyles('secondary')}>Volver a stock</Link>}
      />

      <Card className="mb-8 grid grid-cols-2 divide-line max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(even)]:border-l lg:grid-cols-4 lg:divide-x">
        <Stat label="Veces comprado" value={String(stats?.purchases ?? 0)} />
        <Stat label="Precio actual" value={money(ingredient.costPerUnit)} />
        <Stat label="Más barato / más caro" value={stats ? `${formatMoney(stats.min * scale)} – ${formatMoney(stats.max * scale)}` : '—'} />
        <Stat label="Total gastado" value={stats ? formatMoney(stats.totalSpent) : '—'} />
      </Card>

      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="tabular font-medium">
          Stock: {formatQty(ingredient.stock, ingredient.unit)} (mín. {formatQty(ingredient.minStock, ingredient.unit)})
        </span>
        <div className="w-40"><StockBar stock={ingredient.stock} min={ingredient.minStock} /></div>
        {level !== 'ok' && <Badge tone={level === 'out' ? 'bad' : 'warn'}>{level === 'out' ? 'Agotado' : 'Poco stock'}</Badge>}
      </div>

      {!stats ? (
        <EmptyState
          title="Aún no hay compras de este ingrediente"
          action={
            <Link to="/albaranes/nuevo" className={buttonStyles('primary')}>
              <ScanLine className="size-4" /> Escanear albarán
            </Link>
          }
        >
          Cuando guardes albaranes con este ingrediente verás aquí su evolución de precio.
        </EmptyState>
      ) : (
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <h2 className="text-sm font-semibold">Evolución del precio por {bigLabel}</h2>
              {stats.trend !== null && (
                <Badge tone={stats.trend > 0 ? 'bad' : stats.trend < 0 ? 'ok' : 'neutral'}>
                  {pct(stats.trend)} desde la primera compra
                </Badge>
              )}
            </div>
            <PriceChart points={points} scale={scale} unitLabel={bigLabel} />
            <p className="tabular mt-2 text-xs text-muted">Precio medio ponderado: {money(stats.avg)}</p>
          </section>

          <section>
            <h2 className="mb-1 border-b border-line pb-3 text-sm font-semibold">Historial de compras</h2>
            <ul className="divide-y divide-line">
              {[...points].reverse().map((p, i) => (
                <li key={`${p.noteId}-${i}`}>
                  <Link
                    to="/albaranes/$albaranId"
                    params={{ albaranId: p.noteId }}
                    className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2.5 text-sm hover:text-brand"
                  >
                    <span className="w-24 shrink-0 text-muted">{formatDate(p.date)}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{p.supplier}</span>
                    <span className="tabular text-muted">{formatQty(p.qty, ingredient.unit)}</span>
                    <span className="tabular w-28 text-right font-medium">{money(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="tabular mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  )
}
