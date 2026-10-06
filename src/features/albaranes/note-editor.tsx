import { useState } from 'react'

import { packTotal } from '@/shared/domain/stock'
import type { DeliveryNote, Ingredient } from '@/shared/domain/types'
import { formatMoney, formatQty } from '@/shared/domain/units'
import { Field, Input, NumberInput } from '@/shared/ui/form'
import { Button, Card, PageHeader } from '@/shared/ui/primitives'

/** Edita un albarán guardado. Al guardar, el stock se recalcula con la diferencia. */
export function NoteEditor({
  note,
  ingredients,
  onSave,
  onCancel,
}: {
  note: DeliveryNote
  ingredients: Ingredient[]
  onSave: (note: DeliveryNote) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(note)
  const patchLine = (id: string, patch: Partial<DeliveryNote['lines'][number]>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))

  return (
    <>
      <PageHeader
        title="Editar albarán"
        description="Al guardar, el stock se ajusta con la diferencia respecto a lo ya sumado."
      />
      <div className="max-w-xl space-y-4">
        <Card className="grid gap-3 p-5 sm:grid-cols-3">
          <Field label="Proveedor" className="sm:col-span-3">
            <Input value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} />
          </Field>
          <Field label="Nº albarán">
            <Input value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} />
          </Field>
          <Field label="Fecha" className="sm:col-span-2">
            <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
        </Card>
        <Card className="divide-y divide-line">
          {draft.lines.map((l) => {
            const ing = ingredients.find((i) => i.id === l.ingredientId)
            const unit = ing?.unit ?? l.newIngredient?.unit ?? 'ud'
            return (
              <div key={l.id} className="space-y-2 p-4 text-sm">
                <p className="font-medium">{ing?.name ?? l.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Packs">
                    <NumberInput value={l.packs} onChange={(n) => patchLine(l.id, { packs: n })} />
                  </Field>
                  <Field label="Total línea">
                    <NumberInput value={l.lineTotal} suffix="€" onChange={(n) => patchLine(l.id, { lineTotal: n })} />
                  </Field>
                </div>
                <p className="tabular text-xs text-muted">
                  Suma {formatQty(packTotal(l), unit)} · {formatMoney(l.lineTotal)}
                </p>
              </div>
            )
          })}
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.supplier.trim()}>Guardar cambios</Button>
        </div>
      </div>
    </>
  )
}
