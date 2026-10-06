import type { Ingredient, Recipe, SaleLine } from './types'
import { round } from './units'

export type Needs = Map<string, number>

const MAX_DEPTH = 3

function addNeeds(
  recipe: Recipe,
  recipes: Recipe[],
  factor: number,
  into: Needs,
  depth = 0,
): void {
  for (const item of recipe.items) {
    if (item.kind === 'ingredient') {
      into.set(item.refId, (into.get(item.refId) ?? 0) + item.quantity * factor)
      continue
    }
    const sub = recipes.find((r) => r.id === item.refId)
    if (!sub || depth >= MAX_DEPTH || sub.yieldQty <= 0) continue
    addNeeds(sub, recipes, (item.quantity / sub.yieldQty) * factor, into, depth + 1)
  }
}

/** Ingredientes base necesarios para `portions` raciones (las intermedias se expanden). */
export function flattenRecipe(recipe: Recipe, recipes: Recipe[], portions = 1): Needs {
  const needs: Needs = new Map()
  addNeeds(recipe, recipes, portions / Math.max(recipe.yieldQty, 1e-9), needs)
  return needs
}

/** Ingredientes base necesarios para un conjunto de ventas. */
export function needsForSales(lines: SaleLine[], recipes: Recipe[]): Needs {
  const total: Needs = new Map()
  for (const line of lines) {
    const recipe = recipes.find((r) => r.id === line.recipeId)
    if (!recipe || line.qty <= 0) continue
    for (const [id, qty] of flattenRecipe(recipe, recipes, line.qty * recipe.yieldQty))
      total.set(id, (total.get(id) ?? 0) + qty)
  }
  return total
}

export interface Shortage {
  ingredient: Ingredient
  needed: number
  missing: number
}

export function shortagesOf(needs: Needs, ingredients: Ingredient[]): Shortage[] {
  const out: Shortage[] = []
  for (const [id, needed] of needs) {
    const ingredient = ingredients.find((i) => i.id === id)
    if (ingredient && needed > ingredient.stock + 1e-9)
      out.push({ ingredient, needed, missing: round(needed - ingredient.stock) })
  }
  return out
}

/** Raciones que se pueden preparar ahora mismo y qué ingrediente limita. */
export function maxPortions(
  recipe: Recipe,
  recipes: Recipe[],
  ingredients: Ingredient[],
): { portions: number; limiting: Ingredient | null } {
  const needs = flattenRecipe(recipe, recipes, recipe.yieldQty)
  let portions = Number.POSITIVE_INFINITY
  let limiting: Ingredient | null = null
  for (const [id, needed] of needs) {
    const ingredient = ingredients.find((i) => i.id === id)
    if (!ingredient || needed <= 0) continue
    const possible = Math.floor((ingredient.stock + 1e-9) / needed)
    if (possible < portions) {
      portions = possible
      limiting = ingredient
    }
  }
  return { portions: Number.isFinite(portions) ? portions : 0, limiting }
}

/** Coste de producir `yieldQty` de la receta. */
export function recipeCost(recipe: Recipe, recipes: Recipe[], ingredients: Ingredient[]): number {
  let cost = 0
  for (const [id, qty] of flattenRecipe(recipe, recipes, recipe.yieldQty)) {
    const ingredient = ingredients.find((i) => i.id === id)
    if (ingredient) cost += qty * ingredient.costPerUnit
  }
  return cost
}

/** Recetas (finales o intermedias) que usan una receta intermedia. */
export const recipesUsing = (id: string, recipes: Recipe[]) =>
  recipes.filter((r) => r.items.some((i) => i.kind === 'recipe' && i.refId === id))
