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

/** Albarán dibujado como imagen: es la "foto" falsa cuando no hay una imagen real. */
function fakePhoto(draft: NoteDraft): string {
  const esc = (s: string) => s.replace(/[<&>]/g, '')
  const rows = draft.lines
    .map((l, i) => `<text x="24" y="${130 + i * 26}" font-size="13">${esc(l.description).slice(0, 34)}</text><text x="296" y="${130 + i * 26}" font-size="13" text-anchor="end">${l.lineTotal.toFixed(2)}</text>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${180 + draft.lines.length * 26}" font-family="monospace" fill="#333"><rect width="100%" height="100%" fill="#fbfaf6"/><text x="24" y="40" font-size="16" font-weight="bold">${esc(draft.supplier)}</text><text x="24" y="64" font-size="12">Albaran ${esc(draft.number)}</text><text x="24" y="84" font-size="12">${draft.date}</text><line x1="24" x2="296" y1="104" y2="104" stroke="#999"/>${rows}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Reduce una imagen real a una miniatura JPEG para que quepa en localStorage. */
function thumbnail(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null)
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

export async function simulateScan(fileName: string, file?: File): Promise<NoteDraft> {
  const draft = SAMPLES[next++ % SAMPLES.length]!()
  const [photo] = await Promise.all([
    file ? thumbnail(file) : Promise.resolve(null),
    new Promise((resolve) => setTimeout(resolve, 1800)),
  ])
  return { ...draft, fileName, photo: photo ?? fakePhoto(draft) }
}
