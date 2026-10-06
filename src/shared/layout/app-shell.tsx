import { Link, useRouterState } from '@tanstack/react-router'
import {
  ChefHat,
  ChevronsUpDown,
  Home,
  Package,
  ReceiptText,
  RotateCcw,
  ScanLine,
  ShoppingBag,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { roleById } from '../domain/roles'
import type { Section } from '../domain/roles'
import { isLowOrOut } from '../domain/stock'
import { actions, useAppState } from '../store/store'
import { cn } from '../ui/primitives'

const NAV = [
  { section: 'inicio', to: '/', label: 'Inicio', icon: Home },
  { section: 'albaranes', to: '/albaranes', label: 'Albaranes', icon: ReceiptText },
  { section: 'stock', to: '/stock', label: 'Stock', icon: Package },
  { section: 'recetas', to: '/recetas', label: 'Recetas', icon: ChefHat },
  { section: 'ventas', to: '/ventas', label: 'Ventas', icon: ShoppingBag },
] as const satisfies readonly { section: Section; to: string; label: string; icon: unknown }[]

export function AppShell({ children }: { children: ReactNode }) {
  const state = useAppState()
  const role = roleById(state.role)
  const items = NAV.filter((n) => role?.sections.includes(n.section))
  const lowCount = state.ingredients.filter(isLowOrOut).length
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const current = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))

  const linkClass = (active: boolean) =>
    cn(
      'group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
      active ? 'bg-subtle font-medium text-ink' : 'text-muted hover:bg-subtle/70 hover:text-ink',
    )
  const iconClass = (active: boolean) => cn('size-4 transition-colors', active ? 'text-brand' : 'text-muted/80')
  const canScan = role?.sections.includes('albaranes')

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <Link to="/" className="mb-5 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="grid size-8 place-items-center rounded-lg bg-ink text-white">
            <ScanLine className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-semibold">ScanDice</span>
            <span className="block text-xs text-muted">Restaurante · demo</span>
          </span>
        </Link>

        {canScan && (
          <Link
            to="/albaranes/nuevo"
            className="mb-5 flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-subtle"
          >
            <ScanLine className="size-4 text-brand" />
            Escanear albarán
          </Link>
        )}

        <p className="mb-1.5 px-2.5 text-[11px] font-medium tracking-wider text-muted/80 uppercase">Menú</p>
        <nav className="flex flex-1 flex-col gap-0.5" aria-label="Principal">
          {items.map(({ to, label, icon: Icon, section }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className={linkClass(false)}
              activeProps={{ className: linkClass(true) }}
            >
              {({ isActive }) => (
                <>
                  <Icon className={iconClass(isActive)} />
                  {label}
                  {section === 'stock' && lowCount > 0 && (
                    <span className="tabular ml-auto rounded-md bg-warn-soft px-1.5 text-xs font-medium text-warn">
                      {lowCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line pt-3">
          <Link
            to="/rol"
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-subtle"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
              {role?.label.charAt(0)}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium">{role?.label}</span>
              <span className="block text-xs text-muted">Cambiar rol</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted" />
          </Link>
          <button
            type="button"
            onClick={() => window.confirm('¿Volver a los datos de ejemplo?') && actions.resetDemo()}
            className="mt-1 flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs text-muted transition-colors hover:bg-subtle hover:text-ink"
          >
            <RotateCcw className="size-3.5" />
            Reiniciar datos de ejemplo
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-line bg-surface/90 px-4 text-sm backdrop-blur sm:px-8 lg:px-10">
          <span className="text-muted">ScanDice</span>
          <span className="text-muted/50">/</span>
          <span className="font-medium">{current?.label ?? 'Inicio'}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
            {role?.label}
          </span>
        </header>
        <main className="px-4 pt-6 pb-28 sm:px-8 lg:px-10 lg:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === '/' }}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted"
            activeProps={{ className: 'text-brand' }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
