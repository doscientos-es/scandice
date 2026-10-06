import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

import { cn } from './primitives'

const control =
  'h-10 w-full rounded-xl border border-line bg-surface px-3 text-ink placeholder:text-muted/70 ' +
  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-subtle'

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(control, className)} {...props} />
)

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(control, 'pr-8', className)} {...props} />
)

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

/**
 * Input numérico que permite escribir libremente (vacío, decimales con coma)
 * y emite siempre un número válido.
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  suffix,
  className,
  ...props
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  suffix?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min'>) {
  const [text, setText] = useState(String(value).replace('.', ','))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(String(value).replace('.', ','))
  }, [value])

  return (
    <div className="relative">
      <Input
        {...props}
        inputMode="decimal"
        className={cn('tabular', suffix && 'pr-10', className)}
        value={text}
        onFocus={(e) => {
          focused.current = true
          e.currentTarget.select()
        }}
        onBlur={() => {
          focused.current = false
          setText(String(value).replace('.', ','))
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,]/g, '')
          setText(raw)
          const n = Number.parseFloat(raw.replace(',', '.'))
          onChange(Number.isFinite(n) ? Math.max(min, n) : min)
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
          {suffix}
        </span>
      )}
    </div>
  )
}

/** Contador grande − [n] + para sumar/restar unidades de forma táctil. */
export function QtyStepper({
  value,
  onChange,
  disableIncrement,
  label,
}: {
  value: number
  onChange: (n: number) => void
  disableIncrement?: boolean
  label: string
}) {
  const btn =
    'grid size-11 place-items-center rounded-xl border border-line bg-surface transition-colors ' +
    'hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={btn}
        disabled={value <= 0}
        aria-label={`Quitar una unidad de ${label}`}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-4" />
      </button>
      <span className="tabular w-8 text-center text-lg font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        disabled={disableIncrement}
        aria-label={`Añadir una unidad de ${label}`}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
