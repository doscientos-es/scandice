import type { CsvCell } from './csv'
import { itemCost, recipeCost } from './recipes'
import { packTotal } from './stock'
import type { DeliveryNote, Ingredient, Recipe } from './types'

/** Una fila por línea de receta, con el coste de la línea y el coste por ración de la receta. */
export function recipesToRows(recipes: Recipe[], all: Recipe[], ingredients: Ingredient[]): CsvCell[][] {
  const r2 = (n: number) => Math.round(n * 100) / 100
  return [
    ['Receta', 'Tipo', 'Rinde', 'Unidad', 'Precio venta', 'Coste por ración', 'Componente', 'Cantidad', 'Unidad componente', 'Coste línea'],
    ...recipes.flatMap((r) => {
      const perPortion = r2(recipeCost(r, all, ingredients) / Math.max(r.yieldQty, 1e-9))
      return r.items.map((it) => {
        const c = itemCost(it, all, ingredients)
        return [
          r.name, r.kind === 'final' ? 'Final' : 'Intermedia', r.yieldQty, r.unit,
          r.kind === 'final' ? r.price : null, perPortion, c.name, it.quantity, c.unit, r2(c.cost),
        ]
      })
    }),
  ]
}

/** Una fila por línea de albarán, con el total ya normalizado a la unidad mínima. */
export function notesToRows(notes: DeliveryNote[], ingredients: Ingredient[]): CsvCell[][] {
  return [
    ['Proveedor', 'Nº albarán', 'Fecha', 'Descripción', 'Ingrediente', 'Packs', 'Uds/pack', 'Contenido', 'Total sumado', 'Unidad', 'Importe'],
    ...notes.flatMap((n) =>
      n.lines.map((l) => {
        const ing = ingredients.find((i) => i.id === l.ingredientId)
        return [
          n.supplier, n.number, n.date, l.description, ing?.name,
          l.packs, l.unitsPerPack, l.sizePerUnit, packTotal(l), ing?.unit, l.lineTotal,
        ]
      }),
    ),
  ]
}
