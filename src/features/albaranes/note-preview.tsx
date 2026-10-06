import { ArrowRight, FileText } from 'lucide-react'

import { lineChange } from '@/shared/domain/prices'
import { packTotal } from '@/shared/domain/stock'
import type { DeliveryNote, Ingredient, NoteDraft } from '@/shared/domain/types'
import { formatDate, formatMoney, formatQty, unitMeta } from '@/shared/domain/units'
import { Badge, Card } from '@/shared/ui/primitives'

/** Resultado en directo: cuánto sube el stock de cada ingrediente. */
export function NotePreview({
  draft,
  ingredients,
  showStock = true,
  compare,
}: {
  draft: NoteDraft | null
  ingredients: Ingredient[]
  showStock?: boolean
  /** Albaranes guardados con los que comparar precios; `noteId` si el albarán ya está guardado. */
  compare?: { notes: DeliveryNote[]; noteId?: string }
}) {
  if (!draft) {
    return (
      <Card className="grid place-items-center gap-2 px-6 py-16 text-center text-muted">
        <FileText className="size-8" />
        <p className="text-sm">Aquí verás el albarán leído y cómo cambiará el stock.</p>
      </Card>
    )
  }
  const total = draft.lines.reduce((s, l) => s + l.lineTotal, 0)
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold">{draft.supplier || 'Proveedor sin nombre'}</h2>
        <p className="text-sm text-muted">
          {draft.number ? `Nº ${draft.number} · ` : ''}
          {draft.date ? formatDate(draft.date) : 'Sin fecha'}
          {draft.fileName ? ` · ${draft.fileName}` : ''}
        </p>
      </div>
      <ul className="divide-y divide-line">
        {draft.lines.map((l) => {
          const ing = ingredients.find((i) => i.id === l.ingredientId)
          const name = ing?.name ?? l.newIngredient?.name ?? 'Sin asignar'
          const unit = ing?.unit ?? l.newIngredient?.unit ?? 'ud'
          const add = packTotal(l)
          const before = ing?.stock ?? 0
          // Borrador: se compara con el último coste conocido. Albarán guardado: solo con albaranes anteriores.
          const change = compare
            ? lineChange(l, compare.notes, {
              date: draft.date || '9999-12-31',
              noteId: compare.noteId,
              fallback: compare.noteId ? undefined : ing?.costPerUnit,
            })
            : null
          return (
            <li key={l.id} className="px-5 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{name}</span>
                {!ing && <Badge tone={l.newIngredient ? 'brand' : 'bad'}>{l.newIngredient ? 'Nuevo' : 'Sin asignar'}</Badge>}
              </div>
              <p className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 text-muted">
                {l.packs} × {l.unitsPerPack} × {formatQty(l.sizePerUnit, unit)} = <b className="text-ink">+{formatQty(add, unit)}</b>
              </p>
              {change && ing && (
                <p className="tabular mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <Badge tone={change.pct > 0 ? 'bad' : 'ok'}>
                    {change.pct > 0 ? '↑' : '↓'} {change.pct > 0 ? '+' : ''}
                    {(change.pct * 100).toFixed(1).replace('.', ',')} %
                  </Badge>
                  {formatMoney(change.previous * unitMeta[ing.unit].scale)} →{' '}
                  <b className="text-ink">{formatMoney(change.current * unitMeta[ing.unit].scale)}</b> /{' '}
                  {unitMeta[ing.unit].bigLabel}
                  {change.previousDate
                    ? ` · antes ${formatDate(change.previousDate)}${change.previousSupplier ? ` (${change.previousSupplier})` : ''}`
                    : ' · último precio conocido'}
                </p>
              )}
              {showStock && (
                <p className="tabular mt-0.5 flex items-center gap-2 text-xs text-muted">
                  Stock: {formatQty(before, unit)} <ArrowRight className="size-3" />
                  <b className="text-ok">{formatQty(before + add, unit)}</b>
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <div className="flex justify-between border-t border-line px-5 py-3 text-sm font-semibold">
        <span>Total albarán</span>
        <span className="tabular">{formatMoney(total)}</span>
      </div>
    </Card>
  )
}
