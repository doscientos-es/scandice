import { describe, expect, it } from 'vitest'

import { flattenRecipe, maxPortions, needsForSales, shortagesOf } from './recipes'
import { createSeedState } from './seed'
import { packTotal, stockLevel, validateDraft } from './stock'
import { confirmNote, registerSales } from './transitions'
import type { NoteDraft, NoteLine } from './types'

const line = (over: Partial<NoteLine>): NoteLine => ({
  id: 'l1',
  description: 'COCA-COLA 33CL',
  ingredientId: 'cola',
  newIngredient: null,
  packs: 3,
  unitsPerPack: 3,
  sizePerUnit: 1,
  lineTotal: 9,
  confidence: 1,
  ...over,
})

const draft = (lines: NoteLine[]): NoteDraft => ({
  supplier: 'Test',
  number: 'T-1',
  date: '2026-10-06',
  fileName: null,
  lines,
})

describe('packs', () => {
  it('3 packs de 3 coca-colas son 9 unidades', () => {
    expect(packTotal(line({}))).toBe(9)
  })

  it('convierte kg a gramos con el contenido por unidad', () => {
    expect(packTotal(line({ packs: 2, unitsPerPack: 1, sizePerUnit: 10000 }))).toBe(20000)
  })
})

describe('recetas', () => {
  const { recipes, ingredients } = createSeedState()
  const get = (id: string) => recipes.find((r) => r.id === id)!

  it('expande recetas intermedias proporcionalmente', () => {
    const needs = flattenRecipe(get('macarrones'), recipes, 2)
    // salsa de tomate: 150 ml × 2 = 300 ml de 2000 → 15 % de 1600 g de tomate = 240 g
    expect(needs.get('tomate')).toBeCloseTo(240)
    expect(needs.get('macarrones')).toBeCloseTo(240)
  })

  it('calcula raciones posibles e ingrediente limitante', () => {
    const { portions, limiting } = maxPortions(get('hamburguesa'), recipes, ingredients)
    expect(portions).toBe(13) // 2400 g de carne / 180 g, limitado también por pan (14) y queso (40)
    expect(limiting?.id).toBe('carne')
  })

  it('detecta faltantes al vender más de lo disponible', () => {
    const needs = needsForSales([{ recipeId: 'cola', qty: 20 }], recipes)
    const short = shortagesOf(needs, ingredients)
    expect(short).toHaveLength(1)
    expect(short[0]!.missing).toBe(8)
  })
})

describe('transiciones', () => {
  it('confirmar albarán suma en unidad mínima y registra movimientos', () => {
    const s0 = createSeedState()
    const { state } = confirmNote(s0, draft([line({})]))
    expect(state.ingredients.find((i) => i.id === 'cola')!.stock).toBe(12 + 9)
    expect(state.movements[0]).toMatchObject({ delta: 9, reason: 'albaran' })
  })

  it('crea ingredientes nuevos desde el albarán', () => {
    const s0 = createSeedState()
    const nuevo = line({
      ingredientId: null,
      newIngredient: { name: 'Piquillos', unit: 'g', category: 'Despensa' },
      packs: 2,
      unitsPerPack: 6,
      sizePerUnit: 390,
      lineTotal: 18,
    })
    const { state } = confirmNote(s0, draft([nuevo]))
    expect(state.ingredients.find((i) => i.name === 'Piquillos')!.stock).toBe(4680)
  })

  it('vender 2 macarrones descuenta los ingredientes base', () => {
    const s0 = createSeedState()
    const s1 = registerSales(s0, [{ recipeId: 'macarrones', qty: 2 }])
    const stock = (id: string) => s1.ingredients.find((i) => i.id === id)!.stock
    expect(stock('macarrones')).toBe(5000 - 240)
    expect(stock('carne')).toBe(2400 - 200)
    expect(s1.sales).toHaveLength(1)
  })

  it('valida líneas sin ingrediente', () => {
    const issues = validateDraft(draft([line({ ingredientId: null })]))
    expect(issues).toHaveLength(1)
  })

  it('niveles de stock', () => {
    expect(stockLevel({ stock: 0, minStock: 5 })).toBe('out')
    expect(stockLevel({ stock: 5, minStock: 5 })).toBe('low')
    expect(stockLevel({ stock: 6, minStock: 5 })).toBe('ok')
  })
})
