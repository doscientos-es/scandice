import { ArrowRight, FileText } from 'lucide-react'

import { packTotal } from '@/shared/domain/stock'
import type { Ingredient, NoteDraft } from '@/shared/domain/types'
import { formatDate, formatMoney, formatQty } from '@/shared/domain/units'
import { Badge, Card } from '@/shared/ui/primitives'

/** Resultado en directo: cuánto sube el stock de cada ingrediente. */
export function NotePreview({
  draft,
  ingredients,
  showStock = true,
}: {
  draft: NoteDraft | null
  ingredients: Ingredient[]
  showStock?: boolean
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
      <div className="border-b border-line bg-subtle px-5 py-4">
        <h2 className="text-lg font-semibold">{draft.supplier || 'Proveedor sin nombre'}</h2>
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
          return (
            <li key={l.id} className="px-5 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{name}</span>
                {!ing && <Badge tone={l.newIngredient ? 'brand' : 'bad'}>{l.newIngredient ? 'Nuevo' : 'Sin asignar'}</Badge>}
              </div>
              <p className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 text-muted">
                {l.packs} × {l.unitsPerPack} × {formatQty(l.sizePerUnit, unit)} = <b className="text-ink">+{formatQty(add, unit)}</b>
              </p>
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
