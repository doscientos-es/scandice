import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from './primitives'

export interface Step<T extends string> {
  id: T
  label: string
}

/** Indicador de pasos. Solo se puede volver a pasos ya alcanzados. */
export function Stepper<T extends string>({
  steps,
  current,
  maxReached,
  onSelect,
}: {
  steps: Step<T>[]
  current: T
  maxReached: number
  onSelect: (id: T) => void
}) {
  const currentIndex = steps.findIndex((s) => s.id === current)
  return (
    <ol className="mb-6 flex items-center gap-3 border-b border-line pb-4">
      {steps.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const reachable = index <= maxReached
        const clickable = reachable && !active
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2 last:flex-none">
            <button
              type="button"
              disabled={!reachable}
              aria-current={active ? 'step' : undefined}
              onClick={() => onSelect(step.id)}
              className={cn(
                'group -mx-1.5 flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors',
                clickable && 'cursor-pointer hover:bg-subtle',
                active && 'cursor-default',
                !reachable && 'cursor-not-allowed opacity-50',
              )}
            >
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full text-xs font-semibold transition-colors',
                  active && 'bg-brand text-white',
                  done && 'bg-ink text-white',
                  !active && !done && 'border border-line bg-surface text-muted',
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:inline',
                  !active && 'text-muted',
                  clickable && 'group-hover:text-ink group-hover:underline group-hover:underline-offset-4',
                )}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span className={cn('h-px flex-1', done ? 'bg-ink' : 'bg-line')} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Disposición mitad formulario / mitad vista previa en directo. */
export function SplitLayout({ form, preview }: { form: ReactNode; preview: ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="min-w-0">{form}</div>
      <aside className="min-w-0 lg:sticky lg:top-6" aria-label="Vista previa en directo">
        {preview}
      </aside>
    </div>
  )
}
