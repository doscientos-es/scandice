import { Layers, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { recipesUsing } from '@/shared/domain/recipes'
import { newId } from '@/shared/domain/transitions'
import type { Ingredient, Recipe, RecipeItem, Unit } from '@/shared/domain/types'
import { UNITS, unitMeta } from '@/shared/domain/units'
import { Field, Input, NumberInput, Select } from '@/shared/ui/form'
import { Button, Card, Notice, cn } from '@/shared/ui/primitives'
import { SplitLayout, Stepper } from '@/shared/ui/stepper'
import type { Step } from '@/shared/ui/stepper'

import { RecipePreview } from './recipe-preview'

export type RecipeStep = 'datos' | 'ingredientes' | 'revisar'

const STEPS: Step<RecipeStep>[] = [
  { id: 'datos', label: 'Datos' },
  { id: 'ingredientes', label: 'Ingredientes' },
  { id: 'revisar', label: 'Revisar' },
]

export const emptyRecipe = (kind: Recipe['kind']): Recipe => ({
  id: newId(),
  name: '',
  kind,
  yieldQty: kind === 'final' ? 1 : 1000,
  unit: kind === 'final' ? 'ud' : 'ml',
  price: 0,
  items: [],
})

interface Props {
  initial: Recipe
  isNew: boolean
  step: RecipeStep
  recipes: Recipe[]
  ingredients: Ingredient[]
  onStep: (step: RecipeStep) => void
  onSave: (recipe: Recipe) => void
  onDelete?: () => void
}

export function RecipeWizard({ initial, isNew, step, recipes, ingredients, onStep, onSave, onDelete }: Props) {
  const [recipe, setRecipe] = useState(initial)
  const [query, setQuery] = useState('')
  const final = recipe.kind === 'final'
  const patch = (p: Partial<Recipe>) => setRecipe((r) => ({ ...r, ...p }))

  const index = STEPS.findIndex((s) => s.id === step)
  const stepError =
    step === 'datos' && !recipe.name.trim()
      ? 'Ponle un nombre a la receta.'
      : step === 'ingredientes' && recipe.items.length === 0
        ? 'Añade al menos un ingrediente.'
        : null
  const maxReached = !recipe.name.trim() ? 0 : recipe.items.length === 0 ? 1 : 2
  const usedBy = isNew ? [] : recipesUsing(recipe.id, recipes)

  const addItem = (item: RecipeItem) => setRecipe((r) => ({ ...r, items: [...r.items, item] }))
  const setQty = (i: number, quantity: number) =>
    setRecipe((r) => ({ ...r, items: r.items.map((it, k) => (k === i ? { ...it, quantity } : it)) }))
  const removeItem = (i: number) =>
    setRecipe((r) => ({ ...r, items: r.items.filter((_, k) => k !== i) }))

  const unitOf = (item: RecipeItem): Unit =>
    (item.kind === 'ingredient'
      ? ingredients.find((x) => x.id === item.refId)?.unit
      : recipes.find((x) => x.id === item.refId)?.unit) ?? 'ud'
  const nameOf = (item: RecipeItem) =>
    (item.kind === 'ingredient' ? ingredients : recipes).find((x) => x.id === item.refId)?.name ?? '—'

  const q = query.trim().toLowerCase()
  const taken = (kind: RecipeItem['kind'], id: string) =>
    recipe.items.some((i) => i.kind === kind && i.refId === id)
  const defaultQty = (unit: Unit) => (unit === 'ud' ? 1 : 100)
  const options = [
    ...ingredients
      .filter((i) => !taken('ingredient', i.id) && i.name.toLowerCase().includes(q))
      .map((i) => ({ kind: 'ingredient' as const, id: i.id, name: i.name, unit: i.unit })),
    // Una receta intermedia solo se compone de ingredientes: así no hay árboles infinitos.
    ...(final
      ? recipes
        .filter((r) => r.kind === 'intermediate' && !taken('recipe', r.id) && r.name.toLowerCase().includes(q))
        .map((r) => ({ kind: 'recipe' as const, id: r.id, name: r.name, unit: r.unit }))
      : []),
  ]

  return (
    <>
      <Stepper steps={STEPS} current={step} maxReached={maxReached} onSelect={onStep} />
      <SplitLayout
        preview={<RecipePreview recipe={recipe} recipes={recipes} ingredients={ingredients} />}
        form={
          <Card className="p-5">
            {step === 'datos' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold">¿Qué receta es?</h2>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de receta">
                  {(['final', 'intermediate'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      role="radio"
                      aria-checked={recipe.kind === kind}
                      disabled={!isNew}
                      onClick={() => setRecipe({ ...emptyRecipe(kind), id: recipe.id, name: recipe.name })}
                      className={cn(
                        'rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed',
                        recipe.kind === kind ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-line hover:bg-subtle',
                      )}
                    >
                      <p className="font-medium">{kind === 'final' ? 'Plato final' : 'Receta intermedia'}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {kind === 'final' ? 'Se vende en el restaurante.' : 'Salsas o bases para otras recetas.'}
                      </p>
                    </button>
                  ))}
                </div>
                <Field label="Nombre">
                  <Input value={recipe.name} onChange={(e) => patch({ name: e.target.value })} placeholder={final ? 'Macarrones con carne' : 'Salsa de tomate casera'} autoFocus />
                </Field>
                {final ? (
                  <Field label="Precio de venta">
                    <NumberInput value={recipe.price} onChange={(price) => patch({ price })} suffix="€" />
                  </Field>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Cuánto produce esta receta" hint="Para calcular cuánto usa cada plato.">
                      <NumberInput value={recipe.yieldQty} onChange={(yieldQty) => patch({ yieldQty: Math.max(1, yieldQty) })} />
                    </Field>
                    <Field label="Unidad">
                      <Select value={recipe.unit} onChange={(e) => patch({ unit: e.target.value as Unit })}>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{unitMeta[u].label}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                )}
              </div>
            )}

            {step === 'ingredientes' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold">Ingredientes y cantidades</h2>
                {recipe.items.length > 0 && (
                  <ul className="space-y-2">
                    {recipe.items.map((item, i) => (
                      <li key={`${item.kind}-${item.refId}`} className="flex items-center gap-2">
                        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
                          {item.kind === 'recipe' && <Layers className="size-3.5 shrink-0 text-brand" />}
                          <span className="truncate">{nameOf(item)}</span>
                        </span>
                        <div className="w-32">
                          <NumberInput value={item.quantity} onChange={(n) => setQty(i, n)} suffix={unitMeta[unitOf(item)].label} aria-label={`Cantidad de ${nameOf(item)}`} />
                        </div>
                        <Button variant="ghost" aria-label={`Quitar ${nameOf(item)}`} onClick={() => removeItem(i)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="overflow-hidden rounded-lg border border-line">
                  <div className="relative border-b border-line">
                    <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
                    <Input className="rounded-b-none border-0 pl-9 focus:ring-0" placeholder="Buscar ingrediente o receta intermedia…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar ingrediente" />
                  </div>
                  <ul className="max-h-64 overflow-y-auto">
                    {options.length === 0 && <li className="px-3 py-4 text-sm text-muted">No hay más opciones.</li>}
                    {options.map((o) => (
                      <li key={`${o.kind}-${o.id}`}>
                        <button type="button" onClick={() => addItem({ kind: o.kind, refId: o.id, quantity: defaultQty(o.unit) })} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-subtle">
                          <Plus className="size-4 text-brand" />
                          <span className="flex-1">{o.name}</span>
                          {o.kind === 'recipe' && <span className="text-xs text-brand">intermedia</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {step === 'revisar' && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Todo listo</h2>
                <p className="text-sm text-muted">
                  Comprueba la vista previa. Al vender esta receta se descontarán del stock los ingredientes base indicados.
                </p>
                {usedBy.length > 0 && (
                  <Notice tone="warn">Esta receta intermedia se usa en: {usedBy.map((r) => r.name).join(', ')}.</Notice>
                )}
                {onDelete && (
                  <Button
                    variant="danger"
                    disabled={usedBy.length > 0}
                    onClick={() => window.confirm('¿Eliminar esta receta?') && onDelete()}
                  >
                    <Trash2 className="size-4" /> Eliminar receta
                  </Button>
                )}
              </div>
            )}

            {stepError && <p className="mt-4 text-sm text-bad">{stepError}</p>}

            <div className="mt-6 flex justify-between gap-2 border-t border-line pt-4">
              <Button variant="ghost" disabled={index === 0} onClick={() => onStep(STEPS[index - 1]!.id)}>Atrás</Button>
              {step === 'revisar' ? (
                <Button size="lg" onClick={() => onSave({ ...recipe, name: recipe.name.trim() })}>Guardar receta</Button>
              ) : (
                <Button disabled={!!stepError} onClick={() => onStep(STEPS[index + 1]!.id)}>Continuar</Button>
              )}
            </div>
          </Card>
        }
      />
    </>
  )
}
