import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-strong disabled:bg-brand/30 disabled:shadow-none',
  secondary: 'bg-surface text-ink border border-line shadow-sm hover:bg-subtle disabled:text-muted/60',
  ghost: 'text-muted hover:bg-subtle hover:text-ink',
  danger: 'bg-bad-soft text-bad hover:bg-bad/15',
}
const sizes: Record<Size, string> = {
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm',
}

/** Clases de botón reutilizables también para `<Link>`. */
export const buttonStyles = (variant: Variant = 'primary', size: Size = 'md', extra?: string) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
    'disabled:cursor-not-allowed select-none whitespace-nowrap active:scale-[0.98]',
    variants[variant],
    sizes[size],
    extra,
  )

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonStyles(variant, size, className)} {...props} />
}

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-card border border-line bg-surface shadow-card', className)} {...props} />
)

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'brand'
const tones: Record<Tone, string> = {
  neutral: 'bg-subtle text-muted',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  brand: 'bg-brand-soft text-brand-strong',
}

const dots: Record<Tone, string> = {
  neutral: 'bg-muted/60',
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  brand: 'bg-brand',
}

/** Distintivo de estado: punto de color + texto, como en los paneles de infraestructura. */
export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      tones[tone],
    )}
  >
    <span className={cn('size-1.5 rounded-full', dots[tone])} aria-hidden />
    {children}
  </span>
)

export const Notice = ({ tone = 'warn', children }: { tone?: Tone; children: ReactNode }) => (
  <div className={cn('flex items-start gap-3 rounded-lg px-4 py-3 text-sm', tones[tone])}>
    {children}
  </div>
)

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

/** Pestañas con subrayado: más sobrias que los botones redondeados. */
export function Tabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { id: T; label: string; count?: number }[]
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-line">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn(
            '-mb-px flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-sm font-medium transition-colors',
            o.id === value ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="tabular rounded-md bg-subtle px-1.5 text-xs font-medium text-muted">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export const EmptyState = ({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children?: ReactNode
}) => (
  <div className="rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center">
    {icon && (
      <span className="mx-auto mb-3 grid size-10 place-items-center rounded-lg border border-line bg-subtle text-muted">
        {icon}
      </span>
    )}
    <p className="text-sm font-medium">{title}</p>
    {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
)

/** Barra de stock respecto al mínimo (el mínimo queda al 40 % de la barra). */
export function StockBar({ stock, min }: { stock: number; min: number }) {
  const ref = Math.max(min, 1) / 0.4
  const pct = Math.min(100, Math.max(2, (stock / ref) * 100))
  const tone = stock <= 0 ? 'bg-bad' : stock <= min ? 'bg-warn' : 'bg-ok'
  return (
    <div className="h-1.5 w-full rounded-full bg-subtle" aria-hidden>
      <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
    </div>
  )
}
