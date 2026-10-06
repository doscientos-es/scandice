import { Link, createFileRoute } from '@tanstack/react-router'

import { NotePreview } from '@/features/albaranes/note-preview'
import { downloadCsv } from '@/shared/domain/csv'
import { notesToRows } from '@/shared/domain/export-rows'
import { useAppState } from '@/shared/store/store'
import { ExportActions } from '@/shared/ui/export-actions'
import { EmptyState, PageHeader, buttonStyles } from '@/shared/ui/primitives'

export const Route = createFileRoute('/albaranes/$albaranId')({ component: NoteDetail })

function NoteDetail() {
  const { albaranId } = Route.useParams()
  const state = useAppState()
  const note = state.notes.find((n) => n.id === albaranId)

  if (!note) {
    return (
      <EmptyState title="Este albarán no existe">
        <Link to="/albaranes" className={buttonStyles('secondary')}>Volver a albaranes</Link>
      </EmptyState>
    )
  }
  return (
    <>
      <PageHeader
        title={`Albarán ${note.number || ''}`.trim()}
        description="Ya sumado al stock. Se muestra el stock actual."
        actions={
          <>
            <ExportActions
              onExport={() => downloadCsv(`albaran-${note.number || note.id.slice(0, 6)}`, notesToRows([note], state.ingredients))}
            />
            <Link to="/albaranes" className={`${buttonStyles('secondary')} print:hidden`}>Volver</Link>
          </>
        }
      />
      <div className="max-w-xl print:max-w-none">
        <NotePreview draft={note} ingredients={state.ingredients} showStock={false} />
      </div>
    </>
  )
}
