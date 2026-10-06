import { Loader2, Sparkles, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { packTotal, validateDraft } from '@/shared/domain/stock'
import type { Ingredient, NoteDraft, NoteLine } from '@/shared/domain/types'
import { UNITS, formatQty, unitMeta } from '@/shared/domain/units'
import { Field, Input, NumberInput, Select } from '@/shared/ui/form'
import { Badge, Button, Card, Notice, cn } from '@/shared/ui/primitives'
import { SplitLayout, Stepper } from '@/shared/ui/stepper'
import type { Step } from '@/shared/ui/stepper'

import { NotePreview } from './note-preview'
import { simulateScan } from './mock-scan'

export type NoteStep = 'subir' | 'lineas' | 'confirmar'

const STEPS: Step<NoteStep>[] = [
  { id: 'subir', label: 'Subir' },
  { id: 'lineas', label: 'Revisar líneas' },
  { id: 'confirmar', label: 'Confirmar' },
]

const NEW = '__new__'

interface Props {
  draft: NoteDraft | null
  setDraft: (d: NoteDraft | null) => void
  step: NoteStep
  ingredients: Ingredient[]
  onStep: (s: NoteStep) => void
  onConfirm: (d: NoteDraft) => void
}

export function NoteWizard({ draft, setDraft, step, ingredients, onStep, onConfirm }: Props) {
  const [scanning, setScanning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const index = STEPS.findIndex((s) => s.id === step)
  const issues = draft ? validateDraft(draft) : []

  const scan = async (name: string) => {
    setScanning(true)
    const result = await simulateScan(name)
    setScanning(false)
    setDraft(result)
    onStep('lineas')
  }

  const patchLine = (id: string, p: Partial<NoteLine>) =>
    draft && setDraft({ ...draft, lines: draft.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) })

  const assign = (l: NoteLine, value: string) =>
    value === NEW
      ? patchLine(l.id, {
        ingredientId: null,
        newIngredient: l.newIngredient ?? { name: l.description.toLowerCase(), unit: 'ud', category: 'Otros' },
      })
      : patchLine(l.id, { ingredientId: value || null, newIngredient: null })

  return (
    <>
      <Stepper steps={STEPS} current={step} maxReached={draft ? 2 : 0} onSelect={onStep} />
      <SplitLayout
        preview={<NotePreview draft={draft} ingredients={ingredients} />}
        form={
          <Card className="p-5">
            {step === 'subir' && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Sube la foto del albarán</h2>
                <button
                  type="button"
                  disabled={scanning}
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-card border-2 border-dashed border-line px-6 py-14 text-muted transition-colors hover:border-brand hover:text-ink disabled:opacity-60"
                >
                  {scanning ? <Loader2 className="size-8 animate-spin text-brand" /> : <Upload className="size-8" />}
                  <span className="font-medium">{scanning ? 'La IA está leyendo el albarán…' : 'Toca para elegir una foto o PDF'}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void scan(f.name); e.target.value = '' }} />
                <Button variant="secondary" className="w-full" disabled={scanning} onClick={() => void scan('albaran-ejemplo.jpg')}>
                  <Sparkles className="size-4" /> Usar un albarán de ejemplo
                </Button>
                <p className="text-xs text-muted">Demo: el análisis es simulado, no se envía nada fuera de tu navegador.</p>
              </div>
            )}

            {step === 'lineas' && draft && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Revisa lo que ha leído la IA</h2>
                <p className="text-sm text-muted">Packs × unidades por pack × contenido = lo que se suma al stock.</p>
                {draft.lines.map((l) => {
                  const ing = ingredients.find((i) => i.id === l.ingredientId)
                  const unit = ing?.unit ?? l.newIngredient?.unit ?? 'ud'
                  return (
                    <div key={l.id} className={cn('space-y-3 rounded-lg border bg-surface p-4', l.confidence < 0.75 ? 'border-warn/60 bg-warn-soft/30' : 'border-line')}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-muted">{l.description}</p>
                        <div className="flex items-center gap-1">
                          {l.confidence < 0.75 && <Badge tone="warn">Revisar</Badge>}
                          <Button variant="ghost" aria-label="Quitar línea" onClick={() => setDraft({ ...draft, lines: draft.lines.filter((x) => x.id !== l.id) })}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <Select aria-label="Ingrediente" value={l.ingredientId ?? (l.newIngredient ? NEW : '')} onChange={(e) => assign(l, e.target.value)}>
                        <option value="">Elige ingrediente…</option>
                        {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        <option value={NEW}>+ Crear ingrediente nuevo</option>
                      </Select>
                      {l.newIngredient && (
                        <div className="grid grid-cols-[1fr_6rem] gap-2">
                          <Input aria-label="Nombre del ingrediente nuevo" value={l.newIngredient.name} onChange={(e) => patchLine(l.id, { newIngredient: { ...l.newIngredient!, name: e.target.value } })} />
                          <Select aria-label="Unidad" value={l.newIngredient.unit} onChange={(e) => patchLine(l.id, { newIngredient: { ...l.newIngredient!, unit: e.target.value as Ingredient['unit'] } })}>
                            {UNITS.map((u) => <option key={u} value={u}>{unitMeta[u].label}</option>)}
                          </Select>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="Packs"><NumberInput value={l.packs} onChange={(packs) => patchLine(l.id, { packs })} /></Field>
                        <Field label="Uds/pack"><NumberInput value={l.unitsPerPack} onChange={(unitsPerPack) => patchLine(l.id, { unitsPerPack })} /></Field>
                        <Field label="Contenido"><NumberInput value={l.sizePerUnit} suffix={unitMeta[unit].label} onChange={(sizePerUnit) => patchLine(l.id, { sizePerUnit })} /></Field>
                      </div>
                      <p className="tabular text-sm">Se sumarán <b>{formatQty(packTotal(l), unit)}</b></p>
                    </div>
                  )
                })}
              </div>
            )}

            {step === 'confirmar' && draft && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Datos del albarán</h2>
                <Field label="Proveedor"><Input value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nº de albarán"><Input value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} /></Field>
                  <Field label="Fecha"><Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
                </div>
                {issues.map((i, k) => <Notice key={k} tone="warn">{i.message}</Notice>)}
              </div>
            )}

            {step !== 'subir' && draft && (
              <div className="mt-6 flex justify-between gap-2 border-t border-line pt-4">
                <Button variant="ghost" onClick={() => onStep(STEPS[index - 1]!.id)}>Atrás</Button>
                {step === 'confirmar' ? (
                  <Button size="lg" disabled={issues.length > 0 || !draft.supplier.trim()} onClick={() => onConfirm(draft)}>Sumar al stock</Button>
                ) : (
                  <Button onClick={() => onStep('confirmar')}>Continuar</Button>
                )}
              </div>
            )}
          </Card>
        }
      />
    </>
  )
}
