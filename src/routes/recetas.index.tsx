import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChefHat, Plus } from 'lucide-react'

import { downloadCsv, todayStamp } from '@/shared/domain/csv'
import { recipesToRows } from '@/shared/domain/export-rows'
import { maxPortions, recipeCost } from '@/shared/domain/recipes'
import { formatMoney, formatQty, unitMeta } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { ExportActions } from '@/shared/ui/export-actions'
import { Badge, Card, EmptyState, PageHeader, Tabs, buttonStyles, cn } from '@/shared/ui/primitives'

interface RecipesSearch {
  tipo?: 'final' | 'intermedia'
}

export const Route = createFileRoute('/recetas/')({
  validateSearch: (s: RecipesSearch): RecipesSearch => ({
    tipo: s.tipo === 'final' || s.tipo === 'intermedia' ? s.tipo : undefined,
  }),
  component: RecipesPage,
})

function RecipesPage() {
  const { tipo } = Route.useSearch()
  const navigate = useNavigate({ from: '/recetas/' })
  const state = useAppState()
  const list = state.recipes.filter(
    (r) => !tipo || r.kind === (tipo === 'final' ? 'final' : 'intermediate'),
  )


  return (
    <>
      <PageHeader
        title="Recetas"
        description="Las finales se venden; las intermedias (salsas, bases…) se usan dentro de otras recetas."
        actions={
          <>
            {list.length > 0 && (
              <ExportActions
                onExport={() =>
                  downloadCsv(`recetas-${todayStamp()}`, recipesToRows(list, state.recipes, state.ingredients))
                }
              />
            )}
            <Link to="/recetas/nueva" search={{ tipo: 'intermedia' }} className={cn(buttonStyles('secondary'), 'print:hidden')}>
              <Plus className="size-4" /> <span className="max-sm:sr-only">Receta intermedia</span>
            </Link>
            <Link to="/recetas/nueva" search={{ tipo: 'final' }} className={cn(buttonStyles('primary'), 'print:hidden')}>
              <Plus className="size-4" /> <span className="max-sm:sr-only">Nueva receta</span>
            </Link>
          </>
        }
      />

      <div className="mb-5">
        <Tabs
          value={tipo ?? 'todas'}
          onChange={(id) =>
            void navigate({ search: { tipo: id === 'todas' ? undefined : id }, replace: true })
          }
          options={[
            { id: 'todas', label: 'Todas', count: state.recipes.length },
            { id: 'final', label: 'Finales', count: state.recipes.filter((r) => r.kind === 'final').length },
            { id: 'intermedia', label: 'Intermedias', count: state.recipes.filter((r) => r.kind !== 'final').length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No hay recetas de este tipo"
          icon={<ChefHat className="size-5" />}
          action={
            <Link to="/recetas/nueva" className={buttonStyles('primary')}>
              <Plus className="size-4" /> Nueva receta
            </Link>
          }
        >
          Crea la primera para calcular costes y raciones.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {list.map((r) => {
            const { portions, limiting } = maxPortions(r, state.recipes, state.ingredients)
            const cost = recipeCost(r, state.recipes, state.ingredients) / r.yieldQty
            const final = r.kind === 'final'
            return (
              <Link
                key={r.id}
                to="/recetas/$recetaId"
                params={{ recetaId: r.id }}
                className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-subtle sm:grid-cols-[2fr_1fr_1fr]"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{r.name}</span>
                    {!final && <Badge>Intermedia</Badge>}
                  </p>
                  <p className="text-xs text-muted">
                    {r.items.length} ingredientes · rinde {formatQty(r.yieldQty, r.unit)}
                  </p>
                </div>
                <div className="text-right sm:text-left">
                  <p className="tabular text-sm font-medium">
                    {portions} <span className="font-normal text-muted">{final ? 'raciones' : 'tandas'}</span>
                  </p>
                  {limiting && portions < 10 && (
                    <p className="truncate text-xs text-warn">Limita {limiting.name}</p>
                  )}
                </div>
                <div className="col-span-2 text-sm text-muted sm:col-span-1 sm:text-right">
                  {final ? (
                    <>
                      <span className="tabular font-medium text-ink">{formatMoney(r.price)}</span>
                      <span className="tabular text-xs"> · coste {formatMoney(cost)}</span>
                    </>
                  ) : (
                    <span className="tabular text-xs">
                      {formatMoney(cost * unitMeta[r.unit].scale)} / {unitMeta[r.unit].bigLabel}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </Card>
      )}
    </>
  )
}
