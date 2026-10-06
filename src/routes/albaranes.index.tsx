import { Link, createFileRoute } from '@tanstack/react-router'
import { ReceiptText, ScanLine } from 'lucide-react'

import { formatDate, formatMoney } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { Card, EmptyState, PageHeader, buttonStyles } from '@/shared/ui/primitives'

export const Route = createFileRoute('/albaranes/')({ component: NotesPage })

function NotesPage() {
  const { notes } = useAppState()
  return (
    <>
      <PageHeader
        title="Albaranes"
        description="Historial de albaranes escaneados."
        actions={
          <Link to="/albaranes/nuevo" className={buttonStyles('primary')}>
            <ScanLine className="size-4" /> Escanear albarán
          </Link>
        }
      />
      {notes.length === 0 ? (
        <EmptyState title="Aún no hay albaranes">Escanea el primero para sumar stock automáticamente.</EmptyState>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {notes.map((n) => (
            <Link
              key={n.id}
              to="/albaranes/$albaranId"
              params={{ albaranId: n.id }}
              className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-subtle"
            >
              <ReceiptText className="size-4 text-muted" />
              <span className="font-medium">{n.supplier}</span>
              <span className="text-muted">{n.number && `Nº ${n.number} · `}{formatDate(n.date)}</span>
              <span className="tabular ml-auto text-muted">
                {n.lines.length} líneas · {formatMoney(n.lines.reduce((s, l) => s + l.lineTotal, 0))}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </>
  )
}
