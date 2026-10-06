import type { CsvCell } from './csv'
import { packTotal } from './stock'
import type { DeliveryNote, Ingredient } from './types'

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
