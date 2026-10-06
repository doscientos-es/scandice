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
