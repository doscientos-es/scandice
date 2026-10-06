import { itemCost, recipeCost } from '@/shared/domain/recipes'
import type { Ingredient, Recipe } from '@/shared/domain/types'
import { formatMoney, formatQty } from '@/shared/domain/units'

/** Ficha de receta solo para impresión: ingredientes, cantidades y coste por ración. */
export function RecipeSheet({
  recipe,
  recipes,
  ingredients,
}: {
  recipe: Recipe
  recipes: Recipe[]
  ingredients: Ingredient[]
}) {
  const total = recipeCost(recipe, recipes, ingredients)
  const perPortion = total / Math.max(recipe.yieldQty, 1e-9)
  const final = recipe.kind === 'final'
  return (
    <section className="hidden print:block">
      <p className="mb-4 text-sm">
        {final ? 'Receta final' : 'Receta intermedia'} · rinde {formatQty(recipe.yieldQty, recipe.unit)}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs">
            <th className="py-1.5 font-medium">Componente</th>
            <th className="py-1.5 text-right font-medium">Cantidad</th>
            <th className="py-1.5 text-right font-medium">Coste</th>
          </tr>
        </thead>
        <tbody>
          {recipe.items.map((it, k) => {
            const c = itemCost(it, recipes, ingredients)
            return (
              <tr key={k} className="border-b border-line">
                <td className="py-1.5">{c.name}</td>
                <td className="tabular py-1.5 text-right">{c.unit ? formatQty(it.quantity, c.unit) : it.quantity}</td>
                <td className="tabular py-1.5 text-right">{formatMoney(c.cost)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <dl className="tabular mt-4 ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between"><dt>Coste total</dt><dd>{formatMoney(total)}</dd></div>
        {final && (
          <>
            <div className="flex justify-between"><dt>Coste por ración</dt><dd>{formatMoney(perPortion)}</dd></div>
            <div className="flex justify-between"><dt>Precio de venta</dt><dd>{formatMoney(recipe.price)}</dd></div>
            <div className="flex justify-between font-semibold">
              <dt>Margen</dt>
              <dd>{formatMoney(recipe.price - perPortion)}</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  )
}
