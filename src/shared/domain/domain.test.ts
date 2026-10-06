import { describe, expect, it } from 'vitest'

import { toCsv } from './csv'
import { lineChange, priceHistory, priceStats, recentRises } from './prices'
import { flattenRecipe, maxPortions, needsForSales, shortagesOf } from './recipes'
import { createSeedState } from './seed'
import { packTotal, shoppingList, stockLevel, validateDraft } from './stock'
import { confirmNote, deleteNote, registerSales, updateNote } from './transitions'
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

describe('editar albarán', () => {
  it('recalcula el stock con la diferencia de packs', () => {
    const base = createSeedState()
    const before = base.ingredients.find((i) => i.id === 'cola')!.stock
    const { state, note } = confirmNote(base, draft([line({ packs: 3 })])) // +9
    const edited = updateNote(state, { ...note, lines: [{ ...note.lines[0], packs: 1 }] }) // +3 en total
    expect(edited.ingredients.find((i) => i.id === 'cola')!.stock).toBe(before + 3)
    expect(edited.notes[0].lines[0].packs).toBe(1)
  })
})

describe('borrar albarán', () => {
  it('resta del stock lo que sumó y quita el albarán', () => {
    const base = createSeedState()
    const before = base.ingredients.find((i) => i.id === 'cola')!.stock
    const { state, note } = confirmNote(base, draft([line({ packs: 3 })]))
    const after = deleteNote(state, note.id)
    expect(after.ingredients.find((i) => i.id === 'cola')!.stock).toBe(before)
    expect(after.notes.find((n) => n.id === note.id)).toBeUndefined()
  })
})

describe('lista de la compra', () => {
  it('solo incluye ingredientes bajo mínimo y pide hasta el doble del mínimo', () => {
    const [a, b] = createSeedState().ingredients
    const items = shoppingList([
      { ...a, stock: 2, minStock: 10 },
      { ...b, stock: 50, minStock: 10 },
    ])
    expect(items).toHaveLength(1)
    expect(items[0].toOrder).toBe(18)
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

  it('exporta CSV con ; coma decimal y comillas escapadas', () => {
    expect(toCsv([['a;b', 'dice "hola"', 1.5, null], ['x', 2, 3, 'y']])).toBe(
      '"a;b";"dice ""hola""";1,5;\r\nx;2;3;y',
    )
  })

})


describe('precios', () => {
  it('detecta la subida respecto al albarán anterior del mismo ingrediente', () => {
    const base = createSeedState()
    const first = confirmNote(base, { ...draft([line({ lineTotal: 9 })]), date: '2026-10-01' })
    const second = confirmNote(first.state, { ...draft([line({ lineTotal: 10.8 })]), date: '2026-10-05' })
    const ch = lineChange(second.note.lines[0], second.state.notes, { date: '2026-10-05', noteId: second.note.id })
    expect(ch?.pct).toBeCloseTo(0.2)
    expect(ch?.previousDate).toBe('2026-10-01')
    expect(recentRises(second.state.notes, second.state.ingredients)[0].ingredient.id).toBe('cola')
    expect(lineChange(first.note.lines[0], second.state.notes, { date: '2026-10-01', noteId: first.note.id })).toBeNull()
  })

  it('historial y estadísticas de un ingrediente', () => {
    const s1 = confirmNote(createSeedState(), { ...draft([line({ lineTotal: 9 })]), date: '2026-10-05' })
    const s2 = confirmNote(s1.state, { ...draft([line({ lineTotal: 7.2 })]), date: '2026-10-01' })
    const points = priceHistory(s2.state.notes, 'cola')
    expect(points.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-05'])
    const stats = priceStats(points)!
    expect(stats).toMatchObject({ purchases: 2, totalQty: 18, min: 0.8, max: 1 })
    expect(stats.totalSpent).toBeCloseTo(16.2)
    expect(stats.trend).toBeCloseTo(0.25)
    expect(priceStats(priceHistory(s2.state.notes, 'nada'))).toBeNull()
  })
})
