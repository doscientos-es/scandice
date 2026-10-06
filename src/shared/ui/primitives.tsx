import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90 disabled:bg-ink/30',
  secondary: 'bg-surface text-ink border border-line hover:bg-subtle disabled:text-muted/60',
  ghost: 'text-muted hover:bg-subtle hover:text-ink',
  danger: 'bg-bad-soft text-bad hover:bg-bad/15',
}
const sizes: Record<Size, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-14 px-6 text-base',
}

/** Clases de botón reutilizables también para `<Link>`. */
export const buttonStyles = (variant: Variant = 'primary', size: Size = 'md', extra?: string) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
    'disabled:cursor-not-allowed select-none whitespace-nowrap',
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

export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
      tones[tone],
    )}
  >
    {children}
  </span>
)

export const Notice = ({ tone = 'warn', children }: { tone?: Tone; children: ReactNode }) => (
  <div className={cn('flex items-start gap-3 rounded-xl px-4 py-3 text-sm', tones[tone])}>
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
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="rounded-card border border-dashed border-line px-6 py-12 text-center">
    <p className="font-medium">{title}</p>
    {children && <div className="mt-2 text-sm text-muted">{children}</div>}
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
