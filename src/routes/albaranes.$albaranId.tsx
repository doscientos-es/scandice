import { Link, createFileRoute } from '@tanstack/react-router'

import { NotePreview } from '@/features/albaranes/note-preview'
import { useAppState } from '@/shared/store/store'
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
        actions={<Link to="/albaranes" className={buttonStyles('secondary')}>Volver</Link>}
      />
      <div className="max-w-xl">
        <NotePreview draft={note} ingredients={state.ingredients} showStock={false} />
      </div>
    </>
  )
}
