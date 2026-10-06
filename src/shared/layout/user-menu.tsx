import { ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../ui/primitives'
import { toast } from '../ui/toast'

const USER = { name: 'Gerard', email: 'gerard@scandice.app', plan: 'Restaurante' }

/** Botón de usuario con menú. `full` muestra nombre y correo (barra lateral); `up` abre hacia arriba. */
export function UserMenu({ full = false, up = false }: { full?: boolean; up?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item =
    'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm text-ink transition-colors hover:bg-subtle'
  const run = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2.5 rounded-lg transition-colors hover:bg-subtle',
          full ? 'w-full px-2 py-2' : 'p-0.5',
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
          {USER.name.charAt(0)}
        </span>
        {full && (
          <>
            <span className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-sm font-medium">{USER.name}</span>
              <span className="block truncate text-xs text-muted">{USER.email}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-lg',
            up ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2',
          )}
        >
          <div className="border-b border-line px-2.5 pt-1.5 pb-2.5">
            <p className="truncate text-sm font-medium">{USER.name}</p>
            <p className="truncate text-xs text-muted">{USER.email}</p>
            <p className="mt-1 text-xs text-muted">{USER.plan}</p>
          </div>
          <div className="pt-1.5">
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={run(() => toast('Ajustes de cuenta', { description: 'No hay ajustes disponibles por ahora.' }))}
            >
              <Settings className="size-4 text-muted" />
              Ajustes de cuenta
            </button>
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={run(() => toast('Cerrar sesión', { description: 'No se pudo cerrar la sesión. Inténtalo de nuevo.' }))}
            >
              <LogOut className="size-4 text-muted" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
