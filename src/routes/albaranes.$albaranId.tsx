import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { NoteEditor } from '@/features/albaranes/note-editor'
import { NotePreview } from '@/features/albaranes/note-preview'
import { downloadCsv } from '@/shared/domain/csv'
import { notesToRows } from '@/shared/domain/export-rows'
import { actions, getState, useAppState } from '@/shared/store/store'
import { ExportActions } from '@/shared/ui/export-actions'
import { EmptyState, PageHeader, buttonStyles } from '@/shared/ui/primitives'
import { toast } from '@/shared/ui/toast'

export const Route = createFileRoute('/albaranes/$albaranId')({ component: NoteDetail })

function NoteDetail() {
  const { albaranId } = Route.useParams()
  const state = useAppState()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const note = state.notes.find((n) => n.id === albaranId)

  if (!note) {
    return (
      <EmptyState title="Este albarán no existe">
        <Link to="/albaranes" className={buttonStyles('secondary')}>Volver a albaranes</Link>
      </EmptyState>
    )
  }
  if (editing) {
    return (
      <NoteEditor
        note={note}
        ingredients={state.ingredients}
        onCancel={() => setEditing(false)}
        onSave={(n) => {
          actions.updateNote(n)
          toast('Albarán actualizado', { description: 'Stock recalculado con la diferencia.' })
          setEditing(false)
        }}
      />
    )
  }
  return (
    <>
      <PageHeader
        title={`Albarán ${note.number || ''}`.trim()}
        description="Ya sumado al stock. Se muestra el stock actual."
        actions={
          <>
            <button type="button" onClick={() => setEditing(true)} className={`${buttonStyles('secondary')} print:hidden`}>
              <Pencil className="size-4" /> <span className="max-sm:sr-only">Editar</span>
            </button>
            <button
              type="button"
              className={`${buttonStyles('secondary')} print:hidden`}
              onClick={() => {
                if (!window.confirm('¿Eliminar este albarán? Se restará del stock lo que sumó.')) return
                const before = getState()
                actions.deleteNote(note.id)
                toast('Albarán eliminado', {
                  description: 'El stock se ha revertido.',
                  action: { label: 'Deshacer', onClick: () => actions.restore(before) },
                })
                void navigate({ to: '/albaranes' })
              }}
            >
              <Trash2 className="size-4" /> <span className="max-sm:sr-only">Eliminar</span>
            </button>
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
