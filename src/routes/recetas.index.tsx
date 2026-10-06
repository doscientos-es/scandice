import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { maxPortions, recipeCost } from '@/shared/domain/recipes'
import { formatMoney, formatQty, unitMeta } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { Badge, Card, EmptyState, PageHeader, buttonStyles, cn } from '@/shared/ui/primitives'

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

  const tab = (active: boolean) =>
    cn(
      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
      active ? 'bg-ink text-white' : 'bg-subtle text-muted hover:text-ink',
    )
  const filter = (next: RecipesSearch['tipo']) => () =>
    void navigate({ search: { tipo: next }, replace: true })

  return (
    <>
      <PageHeader
        title="Recetas"
        description="Las finales se venden; las intermedias (salsas, bases…) se usan dentro de otras recetas."
        actions={
          <>
            <Link to="/recetas/nueva" search={{ tipo: 'intermedia' }} className={buttonStyles('secondary')}>
              <Plus className="size-4" /> Receta intermedia
            </Link>
            <Link to="/recetas/nueva" search={{ tipo: 'final' }} className={buttonStyles('primary')}>
              <Plus className="size-4" /> Nueva receta
            </Link>
          </>
        }
      />

      <div className="mb-5 flex gap-2">
        <button type="button" className={tab(!tipo)} onClick={filter(undefined)}>Todas</button>
        <button type="button" className={tab(tipo === 'final')} onClick={filter('final')}>Finales</button>
        <button type="button" className={tab(tipo === 'intermedia')} onClick={filter('intermedia')}>Intermedias</button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No hay recetas de este tipo" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const { portions, limiting } = maxPortions(r, state.recipes, state.ingredients)
            const cost = recipeCost(r, state.recipes, state.ingredients) / r.yieldQty
            const final = r.kind === 'final'
            return (
              <Link key={r.id} to="/recetas/$recetaId" params={{ recetaId: r.id }}>
                <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:border-brand">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{r.name}</h2>
                    <Badge tone={final ? 'brand' : 'neutral'}>{final ? 'Final' : 'Intermedia'}</Badge>
                  </div>
                  <p className="text-sm text-muted">
                    {r.items.length} ingredientes · rinde {formatQty(r.yieldQty, r.unit)}
                  </p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="tabular text-2xl font-semibold tracking-tight">{portions}</p>
                      <p className="text-xs text-muted">
                        {final ? 'raciones posibles' : 'tandas posibles'}
                        {limiting && portions < 10 ? ` · limita ${limiting.name}` : ''}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted">
                      {final ? (
                        <>
                          <p className="tabular font-medium text-ink">{formatMoney(r.price)}</p>
                          <p className="tabular text-xs">coste {formatMoney(cost)}</p>
                        </>
                      ) : (
                        <p className="tabular text-xs">
                          {formatMoney(cost * unitMeta[r.unit].scale)} / {unitMeta[r.unit].bigLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
