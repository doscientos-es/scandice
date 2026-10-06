import { Link, createFileRoute } from '@tanstack/react-router'
import { ReceiptText, ScanLine, Search } from 'lucide-react'
import { useState } from 'react'

import { downloadCsv, todayStamp } from '@/shared/domain/csv'
import { notesToRows } from '@/shared/domain/export-rows'
import { formatDate, formatMoney } from '@/shared/domain/units'
import { useAppState } from '@/shared/store/store'
import { ExportActions } from '@/shared/ui/export-actions'
import { Input, Select } from '@/shared/ui/form'
import { Pagination, usePagination } from '@/shared/ui/pagination'
import { Button, Card, EmptyState, PageHeader, buttonStyles, cn } from '@/shared/ui/primitives'

export const Route = createFileRoute('/albaranes/')({ component: NotesPage })

function NotesPage() {
  const { notes: all, ingredients } = useAppState()
  const [q, setQ] = useState('')
  const [period, setPeriod] = useState<'todo' | '7' | '30'>('todo')

  const cutoff = period === 'todo' ? '' : new Date(Date.now() - Number(period) * 864e5).toISOString().slice(0, 10)
  const term = q.trim().toLowerCase()
  const notes = all.filter(
    (n) =>
      (!term || n.supplier.toLowerCase().includes(term) || n.number.toLowerCase().includes(term)) &&
      (!cutoff || n.date >= cutoff),
  )
  const pageData = usePagination(notes, `${term}|${period}`)

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
      {all.length > 0 && (
        <div className="mb-5 flex flex-col gap-2 sm:flex-row print:hidden">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
            <Input
              className="pl-9"
              placeholder="Buscar proveedor o nº…"
              aria-label="Buscar albarán"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select
            className="sm:w-auto!"
            aria-label="Periodo"
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
          >
            <option value="todo">Todo el historial</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
          </Select>
        </div>
      )}
      {all.length > 0 && notes.length === 0 ? (
        <EmptyState
          title="Ningún albarán coincide"
          icon={<Search className="size-5" />}
          action={
            <Button variant="secondary" onClick={() => { setQ(''); setPeriod('todo') }}>
              Quitar filtros
            </Button>
          }
        >
          Prueba con otro proveedor o amplía el periodo.
        </EmptyState>
      ) : all.length === 0 ? (
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
        <>
          <Card className="divide-y divide-line overflow-hidden">
            {pageData.items.map((n) => (
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
          <Pagination {...pageData} />
        </>
      )}
    </>
  )
}
