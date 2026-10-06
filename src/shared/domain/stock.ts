import type { Ingredient, NoteDraft, NoteLine } from './types'
import { round } from './units'

/** Packs × unidades por pack × contenido → siempre en unidad mínima. 3 packs de 3 = 9 ud. */
export const packTotal = (l: Pick<NoteLine, 'packs' | 'unitsPerPack' | 'sizePerUnit'>) =>
  round(l.packs * l.unitsPerPack * l.sizePerUnit)

export type StockLevel = 'out' | 'low' | 'ok'

export function stockLevel(i: Pick<Ingredient, 'stock' | 'minStock'>): StockLevel {
  if (i.stock <= 0) return 'out'
  if (i.stock <= i.minStock) return 'low'
  return 'ok'
}

export const isLowOrOut = (i: Pick<Ingredient, 'stock' | 'minStock'>) => stockLevel(i) !== 'ok'

export interface ShoppingItem {
  ingredient: Ingredient
  /** Cantidad sugerida a pedir, en unidad mínima: lo necesario para llegar al doble del mínimo. */
  toOrder: number
  /** Coste estimado con el último precio conocido. */
  cost: number
}

/** Ingredientes en stock bajo o agotado con la cantidad sugerida a pedir (más urgentes primero). */
export function shoppingList(ingredients: Ingredient[]): ShoppingItem[] {
  return ingredients
    .filter((i) => isLowOrOut(i) && i.minStock > 0)
    .map((ingredient) => {
      const toOrder = round(Math.max(ingredient.minStock * 2 - ingredient.stock, 0))
      return { ingredient, toOrder, cost: toOrder * ingredient.costPerUnit }
    })
    .sort((a, b) => a.ingredient.stock / a.ingredient.minStock - b.ingredient.stock / b.ingredient.minStock)
}

export interface StockImpact {
  /** Ingredientes que estaban en stock bajo/agotado y vuelven a estar correctos. */
  recovered: number
  /** Ingredientes creados por el albarán. */
  created: number
  /** Ingredientes que siguen por debajo del mínimo tras el cambio. */
  stillLow: number
}

/** Compara el stock antes y después de una operación para poder explicar qué ha cambiado. */
export function stockImpact(before: Ingredient[], after: Ingredient[]): StockImpact {
  const prev = new Map(before.map((i) => [i.id, i]))
  let recovered = 0
  let created = 0
  let stillLow = 0
  for (const i of after) {
    const old = prev.get(i.id)
    if (!old) created++
    else if (isLowOrOut(old) && !isLowOrOut(i)) recovered++
    if (old && isLowOrOut(i) && i.stock !== old.stock) stillLow++
  }
  return { recovered, created, stillLow }
}

export interface NoteLineIssue {
  lineId: string
  message: string
}

/** Problemas que impiden confirmar un albarán. */
export function validateDraft(draft: NoteDraft): NoteLineIssue[] {
  const issues: NoteLineIssue[] = []
  if (draft.lines.length === 0) issues.push({ lineId: '', message: 'El albarán no tiene líneas.' })
  for (const l of draft.lines) {
    if (!l.ingredientId && !l.newIngredient?.name.trim())
      issues.push({ lineId: l.id, message: `“${l.description}”: elige o crea un ingrediente.` })
    if (packTotal(l) <= 0)
      issues.push({ lineId: l.id, message: `“${l.description}”: la cantidad debe ser mayor que 0.` })
  }
  return issues
}
