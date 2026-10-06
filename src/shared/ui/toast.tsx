import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useSyncExternalStore } from 'react'

type ToastTone = 'ok' | 'warn'
interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const dismiss = (id: number) => {
  items = items.filter((t) => t.id !== id)
  emit()
}

/**
 * Muestra un aviso breve que desaparece solo (4 s; 7 s si lleva acción, p. ej. «Deshacer»).
 */
export function toast(
  title: string,
  opts: { description?: string; tone?: ToastTone; action?: ToastItem['action'] } = {},
) {
  const id = nextId++
  items = [
    ...items,
    { id, tone: opts.tone ?? 'ok', title, description: opts.description, action: opts.action },
  ].slice(-3)
  emit()
  setTimeout(() => dismiss(id), opts.action ? 7000 : 4000)
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items)
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-20 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 lg:bottom-4"
    >
      {list.map((t) => {
        const Icon = t.tone === 'ok' ? CheckCircle2 : AlertTriangle
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-surface p-3 shadow-lg ring-1 ring-black/5"
          >
            <Icon className={t.tone === 'ok' ? 'mt-0.5 size-4 shrink-0 text-ok' : 'mt-0.5 size-4 shrink-0 text-warn'} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-muted">{t.description}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
                className="cursor-pointer rounded-md px-2 py-0.5 text-sm font-medium text-brand hover:bg-brand-soft"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => dismiss(t.id)}
              className="cursor-pointer rounded p-0.5 text-muted hover:bg-subtle hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
