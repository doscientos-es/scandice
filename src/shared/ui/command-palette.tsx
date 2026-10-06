import { useNavigate } from '@tanstack/react-router'
import { Package, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAppState } from '../store/store'
import { cn } from './primitives'

interface Command {
  id: string
  label: string
  hint: string
  run: () => void
}

/**
 * Paleta de comandos: Ctrl/⌘+K abre desde cualquier pantalla.
 * La tecla `/` enfoca el buscador de la pantalla si lo hay; si no, abre la paleta.
 */
export function CommandPalette() {
  const state = useAppState()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const search = document.querySelector<HTMLInputElement>('input[data-search]')
        if (search) search.focus()
        else setOpen(true)
      } else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      inputRef.current?.focus()
    }
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const go = (to: string, search?: Record<string, string>) => () =>
      void navigate({ to, search } as never)
    const list: Command[] = [
      { id: 'inicio', label: 'Ir a Inicio', hint: 'Navegar', run: go('/') },
      { id: 'albaranes', label: 'Ir a Albaranes', hint: 'Navegar', run: go('/albaranes') },
      { id: 'escanear', label: 'Escanear albarán', hint: 'Acción', run: go('/albaranes/nuevo') },
      { id: 'stock', label: 'Ir a Stock', hint: 'Navegar', run: go('/stock') },
      { id: 'recetas', label: 'Ir a Recetas', hint: 'Navegar', run: go('/recetas') },
      { id: 'nueva-receta', label: 'Nueva receta', hint: 'Acción', run: go('/recetas/nueva') },
      { id: 'ventas', label: 'Registrar ventas', hint: 'Acción', run: go('/ventas') },
    ]
    for (const i of state.ingredients)
      list.push({ id: `ing-${i.id}`, label: i.name, hint: 'Ingrediente', run: go('/stock', { q: i.name }) })
    return list
  }, [state.ingredients, navigate])

  const q = query.trim().toLowerCase()
  const results = (q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands).slice(0, 8)

  const choose = (c: Command | undefined) => {
    if (!c) return
    setOpen(false)
    c.run()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/30 px-4 pt-[15vh]" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="size-4 text-muted" aria-hidden />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              else if (e.key === 'Enter') choose(results[active])
            }}
            placeholder="Busca una pantalla, acción o ingrediente…"
            aria-label="Buscar comando"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border border-line px-1.5 text-[11px] text-muted">Esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" aria-label="Resultados" className="max-h-80 overflow-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Sin resultados</li>}
          {results.map((c, i) => (
            <li key={c.id} role="presentation">
              <button
                type="button"
                id={`palette-${c.id}`}
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(c)}
                className={cn('flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm', i === active && 'bg-subtle')}
              >
                {c.hint === 'Ingrediente' && <Package className="size-4 text-muted" />}
                <span className="flex-1 truncate">{c.label}</span>
                <span className="text-xs text-muted">{c.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
