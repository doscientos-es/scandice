import { needsForSales } from './recipes'
import { packTotal } from './stock'
import type {
  AppState,
  DeliveryNote,
  Ingredient,
  NoteDraft,
  Recipe,
  SaleLine,
  StockMovement,
} from './types'
import { round } from './units'

export const newId = () => crypto.randomUUID()

const movement = (
  ingredientId: string,
  delta: number,
  reason: StockMovement['reason'],
  label: string,
): StockMovement => ({
  id: newId(),
  at: new Date().toISOString(),
  ingredientId,
  delta,
  reason,
  label,
})

/** Confirma un albarán: crea ingredientes nuevos y suma al stock (en unidad mínima). */
export function confirmNote(state: AppState, draft: NoteDraft): { state: AppState; note: DeliveryNote } {
  const ingredients = state.ingredients.map((i) => ({ ...i }))
  const movements: StockMovement[] = []
  const label = `Albarán ${draft.number || draft.supplier}`

  const lines = draft.lines.map((line) => {
    let id = line.ingredientId
    if (!id && line.newIngredient) {
      id = newId()
      ingredients.push({
        id,
        name: line.newIngredient.name.trim(),
        unit: line.newIngredient.unit,
        category: line.newIngredient.category || 'Otros',
        stock: 0,
        minStock: 0,
        costPerUnit: 0,
      })
    }
    const target = ingredients.find((i) => i.id === id)
    const total = packTotal(line)
    if (target) {
      target.stock = round(target.stock + total)
      if (line.lineTotal > 0 && total > 0) target.costPerUnit = line.lineTotal / total
      movements.push(movement(target.id, total, 'albaran', label))
    }
    return { ...line, ingredientId: id, newIngredient: null }
  })

  const note: DeliveryNote = {
    ...draft,
    lines,
    id: newId(),
    createdAt: new Date().toISOString(),
  }
  return {
    note,
    state: {
      ...state,
      ingredients,
      notes: [note, ...state.notes],
      movements: [...movements, ...state.movements],
    },
  }
}

/**
 * Edita un albarán ya guardado (proveedor, nº, fecha, packs y total por línea)
 * y recalcula el stock con la diferencia respecto a lo que se sumó antes.
 */
export function updateNote(state: AppState, updated: DeliveryNote): AppState {
  const old = state.notes.find((n) => n.id === updated.id)
  if (!old) return state
  const label = `Corrección albarán ${updated.number || updated.supplier}`
  const deltas = new Map<string, number>()
  for (const l of old.lines) {
    if (l.ingredientId) deltas.set(l.ingredientId, (deltas.get(l.ingredientId) ?? 0) - packTotal(l))
  }
  for (const l of updated.lines) {
    if (l.ingredientId) deltas.set(l.ingredientId, (deltas.get(l.ingredientId) ?? 0) + packTotal(l))
  }
  const movements: StockMovement[] = []
  const ingredients = state.ingredients.map((i) => {
    const d = round(deltas.get(i.id) ?? 0)
    if (d === 0) return i
    movements.push(movement(i.id, d, 'ajuste', label))
    return { ...i, stock: Math.max(0, round(i.stock + d)) }
  })
  return {
    ...state,
    ingredients,
    notes: state.notes.map((n) => (n.id === updated.id ? updated : n)),
    movements: [...movements, ...state.movements],
  }
}

/** Registra ventas y descuenta del stock los ingredientes base gastados. */
export function registerSales(state: AppState, lines: SaleLine[]): AppState {
  const needs = needsForSales(lines, state.recipes)
  const label = lines
    .filter((l) => l.qty > 0)
    .map((l) => `${l.qty}× ${state.recipes.find((r) => r.id === l.recipeId)?.name ?? '?'}`)
    .join(', ')
  const movements: StockMovement[] = []
  const ingredients = state.ingredients.map((i) => {
    const used = needs.get(i.id)
    if (!used) return i
    movements.push(movement(i.id, -round(used), 'venta', label))
    return { ...i, stock: Math.max(0, round(i.stock - used)) }
  })
  return {
    ...state,
    ingredients,
    movements: [...movements, ...state.movements],
    sales: [
      { id: newId(), at: new Date().toISOString(), lines: lines.filter((l) => l.qty > 0) },
      ...state.sales,
    ],
  }
}

export function adjustIngredient(
  state: AppState,
  id: string,
  patch: { stock: number; minStock: number },
): AppState {
  const current = state.ingredients.find((i) => i.id === id)
  if (!current) return state
  const delta = round(patch.stock - current.stock)
  const updated: Ingredient = { ...current, stock: patch.stock, minStock: patch.minStock }
  return {
    ...state,
    ingredients: state.ingredients.map((i) => (i.id === id ? updated : i)),
    movements:
      delta === 0
        ? state.movements
        : [movement(id, delta, 'ajuste', 'Ajuste manual'), ...state.movements],
  }
}

export function saveRecipe(state: AppState, recipe: Recipe): AppState {
  const exists = state.recipes.some((r) => r.id === recipe.id)
  return {
    ...state,
    recipes: exists
      ? state.recipes.map((r) => (r.id === recipe.id ? recipe : r))
      : [...state.recipes, recipe],
  }
}

export const deleteRecipe = (state: AppState, id: string): AppState => ({
  ...state,
  recipes: state.recipes.filter((r) => r.id !== id),
})
