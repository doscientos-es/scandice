import type { PriceChange } from './prices'


/** Unidad mínima de stock. Todo se guarda siempre en esta unidad. */
export type Unit = 'ud' | 'g' | 'ml'

export type Role = 'propietario' | 'cocina' | 'encargado'

export interface Ingredient {
  id: string
  name: string
  unit: Unit
  category: string
  /** Stock actual en unidad mínima (ud, g o ml). */
  stock: number
  /** Por debajo (o igual) de este valor se avisa de stock bajo. */
  minStock: number
  /** Coste por unidad mínima, en euros. */
  costPerUnit: number
}

export interface RecipeItem {
  kind: 'ingredient' | 'recipe'
  refId: string
  /** Cantidad en la unidad del ingrediente o de la receta intermedia. */
  quantity: number
}

export interface Recipe {
  id: string
  name: string
  /** `final` se vende; `intermediate` solo se usa dentro de otras recetas. */
  kind: 'final' | 'intermediate'
  /** Cuánto produce la receta (1 ración en las finales; p. ej. 2000 ml de salsa). */
  yieldQty: number
  unit: Unit
  /** Precio de venta (solo recetas finales). */
  price: number
  items: RecipeItem[]
}

/** Línea de un albarán: packs × unidades por pack × contenido por unidad. */
export interface NoteLine {
  id: string
  /** Texto tal y como aparece en el albarán. */
  description: string
  /** Ingrediente existente, o null si hay que crearlo (ver `newIngredient`). */
  ingredientId: string | null
  newIngredient: { name: string; unit: Unit; category: string } | null
  packs: number
  unitsPerPack: number
  /** Contenido de cada unidad, en unidad mínima (1 si el ingrediente se cuenta en ud). */
  sizePerUnit: number
  lineTotal: number
  /** Confianza de la IA (0-1). */
  confidence: number
  /**
   * Variación de precio respecto a la compra anterior, guardada al confirmar el albarán.
   * `null` = sin cambio relevante; `undefined` = albarán anterior a esta función o borrador.
   */
  priceChange?: PriceChange | null
}

export interface NoteDraft {
  supplier: string
  number: string
  date: string
  fileName: string | null
  /** Miniatura de la foto (data URL). En la demo puede ser un albarán dibujado. */
  photo?: string | null
  lines: NoteLine[]
}

export interface DeliveryNote extends NoteDraft {
  id: string
  createdAt: string
}

export interface StockMovement {
  id: string
  at: string
  ingredientId: string
  delta: number
  reason: 'albaran' | 'venta' | 'ajuste'
  label: string
}

export interface SaleLine {
  recipeId: string
  qty: number
}

export interface Sale {
  id: string
  at: string
  lines: SaleLine[]
}

export interface AppState {
  role: Role | null
  ingredients: Ingredient[]
  recipes: Recipe[]
  notes: DeliveryNote[]
  movements: StockMovement[]
  sales: Sale[]
}
