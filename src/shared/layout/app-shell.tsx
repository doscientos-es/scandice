import { Link } from '@tanstack/react-router'
import {
  ChefHat,
  Home,
  Package,
  ReceiptText,
  RotateCcw,
  ScanLine,
  ShoppingBag,
  UserRound,
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

  const linkClass = (active: boolean) =>
    cn(
      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      active ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
    )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-subtle p-4 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 pt-2 text-xl font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
            <ScanLine className="size-5" />
          </span>
          ScanDice
        </Link>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
          {items.map(({ to, label, icon: Icon, section }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className={linkClass(false)}
              activeProps={{ className: linkClass(true) }}
            >
              <Icon className="size-4" />
              {label}
              {section === 'stock' && lowCount > 0 && (
                <span className="ml-auto rounded-full bg-warn-soft px-2 text-xs text-warn">
                  {lowCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line pt-3 text-sm">
          <Link to="/rol" className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted hover:text-ink">
            <UserRound className="size-4" />
            <span className="truncate">{role?.label} · cambiar</span>
          </Link>
          <button
            type="button"
            onClick={() => window.confirm('¿Volver a los datos de ejemplo?') && actions.resetDemo()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-muted hover:text-ink"
          >
            <RotateCcw className="size-4" />
            Reiniciar demo
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 pt-6 pb-28 sm:px-8 lg:px-10 lg:pb-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

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
