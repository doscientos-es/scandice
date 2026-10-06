import { Layers } from 'lucide-react'

import { flattenRecipe, maxPortions, recipeCost } from '@/shared/domain/recipes'
import type { Ingredient, Recipe } from '@/shared/domain/types'
import { formatMoney, formatNumber, formatQty, unitMeta } from '@/shared/domain/units'
import { Badge, Card, cn } from '@/shared/ui/primitives'

/** Vista previa en directo de la receta que se está montando. */
export function RecipePreview({
  recipe,
  recipes,
  ingredients,
}: {
  recipe: Recipe
  recipes: Recipe[]
  ingredients: Ingredient[]
}) {
  const final = recipe.kind === 'final'
  // La receta en edición puede no estar aún en `recipes`: se usa la copia del borrador.
  const all = [...recipes.filter((r) => r.id !== recipe.id), recipe]
  const needs = flattenRecipe(recipe, all, recipe.yieldQty)
  const { portions, limiting } = maxPortions(recipe, all, ingredients)
  const cost = recipeCost(recipe, all, ingredients)
  const margin = final && recipe.price > 0 ? ((recipe.price - cost) / recipe.price) * 100 : null
  const byId = (id: string) => ingredients.find((i) => i.id === id)

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className={cn('text-base font-semibold', !recipe.name && 'text-muted')}>
            {recipe.name || 'Nueva receta'}
          </h2>
          <Badge tone={final ? 'brand' : 'neutral'}>{final ? 'Plato final' : 'Intermedia'}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          {final ? '1 ración' : `Rinde ${formatQty(recipe.yieldQty, recipe.unit)}`}
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-b border-line text-center">
        <Stat label="Coste" value={formatMoney(cost)} />
        {final ? (
          <Stat label="Precio" value={recipe.price ? formatMoney(recipe.price) : '—'} />
        ) : (
          <Stat
            label={`Coste/${unitMeta[recipe.unit].bigLabel}`}
            value={formatMoney((cost / Math.max(recipe.yieldQty, 1)) * unitMeta[recipe.unit].scale)}
          />
        )}
        {final ? (
          <Stat label="Margen" value={margin === null ? '—' : `${formatNumber(Math.round(margin))} %`} />
        ) : (
          <Stat label="Tandas" value={String(portions)} />
        )}
      </div>

      <div className="p-5">
        <h3 className="mb-3 text-xs font-medium tracking-wide text-muted">COMPOSICIÓN</h3>
        {recipe.items.length === 0 ? (
          <p className="text-sm text-muted">Añade ingredientes y verás aquí cómo queda la receta.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {recipe.items.map((item) => {
              if (item.kind === 'recipe') {
                const sub = recipes.find((r) => r.id === item.refId)
                return (
                  <li key={`r-${item.refId}`} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">
                      <Layers className="size-3.5 text-brand" /> {sub?.name ?? '—'}
                    </span>
                    <span className="tabular text-muted">{sub && formatQty(item.quantity, sub.unit)}</span>
                  </li>
                )
              }
              const ing = byId(item.refId)
              return (
                <li key={`i-${item.refId}`} className="flex items-center justify-between gap-2">
                  <span>{ing?.name ?? '—'}</span>
                  <span className="tabular text-muted">{ing && formatQty(item.quantity, ing.unit)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {needs.size > 0 && (
        <div className="border-t border-line bg-subtle/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-wide text-muted">
              INGREDIENTES BASE vs. STOCK
            </h3>
            <Badge tone={portions === 0 ? 'bad' : portions < 5 ? 'warn' : 'ok'}>
              {portions} {final ? 'raciones' : 'tandas'} posibles
            </Badge>
          </div>
          <ul className="space-y-1.5 text-sm">
            {[...needs].map(([id, qty]) => {
              const ing = byId(id)
              if (!ing) return null
              const short = qty > ing.stock
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className={cn(limiting?.id === id && 'font-medium')}>{ing.name}</span>
                  <span className={cn('tabular', short ? 'text-bad' : 'text-muted')}>
                    {formatQty(qty, ing.unit)} <span className="opacity-60">de {formatQty(ing.stock, ing.unit)}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="px-3 py-3">
    <p className="tabular text-lg font-semibold">{value}</p>
    <p className="text-xs text-muted">{label}</p>
  </div>
)
