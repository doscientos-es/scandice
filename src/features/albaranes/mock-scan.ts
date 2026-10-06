import { newId } from '@/shared/domain/transitions'
import type { NoteDraft, NoteLine } from '@/shared/domain/types'

/**
 * Simula el análisis con IA de un albarán. En la demo no se lee el archivo:
 * se devuelve uno de los albaranes de ejemplo, ya con los packs desglosados
 * (p. ej. 3 packs × 3 ud = 9 ud) para que se vea cómo se normaliza el stock.
 */
type Seed = Omit<NoteLine, 'id' | 'newIngredient'> & {
  newIngredient?: NoteLine['newIngredient']
}

const line = (s: Seed): NoteLine => ({ ...s, id: newId(), newIngredient: s.newIngredient ?? null })

const SAMPLES: Array<() => NoteDraft> = [
  () => ({
    supplier: 'Distribuciones Mercat',
    number: 'A-2041',
    date: new Date().toISOString().slice(0, 10),
    fileName: null,
    lines: [
      line({ description: 'PAN HAMBURGUESA PACK 3 UD', ingredientId: 'pan', packs: 3, unitsPerPack: 3, sizePerUnit: 1, lineTotal: 2.88, confidence: 0.97 }),
      line({ description: 'CERVEZA 33CL PACK 12', ingredientId: 'cerveza', packs: 2, unitsPerPack: 12, sizePerUnit: 1, lineTotal: 14.88, confidence: 0.95 }),
      line({ description: 'COCA-COLA 33CL PACK 6', ingredientId: 'cola', packs: 3, unitsPerPack: 6, sizePerUnit: 1, lineTotal: 10.44, confidence: 0.93 }),
      line({ description: 'ACEITE OLIVA GARRAFA 5L', ingredientId: 'aceite', packs: 1, unitsPerPack: 1, sizePerUnit: 5000, lineTotal: 36, confidence: 0.9 }),
      line({
        description: 'PEPINILLOS FRASCO 720G',
        ingredientId: null,
        newIngredient: { name: 'Pepinillos', unit: 'g', category: 'Despensa' },
        packs: 2, unitsPerPack: 1, sizePerUnit: 720, lineTotal: 5.2, confidence: 0.62,
      }),
    ],
  }),
  () => ({
    supplier: 'Carnes Ruiz',
    number: 'CR-8873',
    date: new Date().toISOString().slice(0, 10),
    fileName: null,
    lines: [
      line({ description: 'TERNERA PICADA BANDEJA 500G', ingredientId: 'carne', packs: 6, unitsPerPack: 1, sizePerUnit: 500, lineTotal: 29.4, confidence: 0.96 }),
      line({ description: 'HUEVOS CAJA 12 UD', ingredientId: 'huevo', packs: 3, unitsPerPack: 12, sizePerUnit: 1, lineTotal: 9.9, confidence: 0.94 }),
      line({ description: 'QUESO RALLADO BOLSA 1KG', ingredientId: 'queso', packs: 2, unitsPerPack: 1, sizePerUnit: 1000, lineTotal: 15.8, confidence: 0.91 }),
      line({ description: 'PIMENTON PICANTE LATA 75G', ingredientId: 'pimenton', packs: 4, unitsPerPack: 1, sizePerUnit: 75, lineTotal: 8.4, confidence: 0.71 }),
    ],
  }),
]

let next = 0

export function simulateScan(fileName: string): Promise<NoteDraft> {
  const draft = SAMPLES[next++ % SAMPLES.length]!()
  return new Promise((resolve) =>
    setTimeout(() => resolve({ ...draft, fileName }), 1800),
  )
}
