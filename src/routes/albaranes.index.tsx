import { Link, createFileRoute } from '@tanstack/react-router'
import { ReceiptText, ScanLine } from 'lucide-react'

import { downloadCsv, todayStamp } from '@/shared/domain/csv'
import { notesToRows } from '@/shared/domain/export-rows'
import { formatDate, formatMoney } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { ExportActions } from '@/shared/ui/export-actions'
import { Card, EmptyState, PageHeader, buttonStyles, cn } from '@/shared/ui/primitives'

export const Route = createFileRoute('/albaranes/')({ component: NotesPage })

function NotesPage() {
  const { notes, ingredients } = useAppState()
  return (
    <>
      <PageHeader
        title="Albaranes"
        description="Historial de albaranes escaneados."
        actions={
          <>
            {notes.length > 0 && (
              <ExportActions onExport={() => downloadCsv(`albaranes-${todayStamp()}`, notesToRows(notes, ingredients))} />
            )}
            <Link to="/albaranes/nuevo" className={cn(buttonStyles('primary'), 'print:hidden')}>
              <ScanLine className="size-4" /> <span className="max-sm:sr-only">Escanear albarán</span>
            </Link>
          </>
        }
      />
      {notes.length === 0 ? (
        <EmptyState
          title="Aún no hay albaranes"
          icon={<ReceiptText className="size-5" />}
          action={
            <Link to="/albaranes/nuevo" className={buttonStyles('primary')}>
              <ScanLine className="size-4" /> Escanear albarán
            </Link>
          }
        >
          Escanea el primero para sumar stock automáticamente.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {notes.map((n) => (
            <Link
              key={n.id}
              to="/albaranes/$albaranId"
              params={{ albaranId: n.id }}
              className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-5 py-3.5 text-sm hover:bg-subtle"
            >
              <ReceiptText className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 truncate font-medium">{n.supplier}</span>
              <span className="text-muted">{n.number && `Nº ${n.number} · `}{formatDate(n.date)}</span>
              <span className="tabular w-full pl-7 text-muted sm:ml-auto sm:w-auto sm:pl-0">
                {n.lines.length} líneas · {formatMoney(n.lines.reduce((s, l) => s + l.lineTotal, 0))}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </>
  )
}
