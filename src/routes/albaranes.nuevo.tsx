import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { NoteWizard } from '@/features/albaranes/note-wizard'
import type { NoteStep } from '@/features/albaranes/note-wizard'
import type { NoteDraft } from '@/shared/domain/types'
import { actions, useAppState } from '@/shared/store/store'
import { PageHeader } from '@/shared/ui/primitives'
import { toast } from '@/shared/ui/toast'

interface NewNoteSearch {
  paso?: NoteStep
}

export const Route = createFileRoute('/albaranes/nuevo')({
  validateSearch: (s: NewNoteSearch): NewNoteSearch => ({
    paso: s.paso === 'lineas' || s.paso === 'confirmar' ? s.paso : undefined,
  }),
  component: NewNotePage,
})

function NewNotePage() {
  const { paso } = Route.useSearch()
  const navigate = useNavigate({ from: '/albaranes/nuevo' })
  const state = useAppState()
  const [draft, setDraft] = useState<NoteDraft | null>(null)

  // Sin borrador (p. ej. al recargar) siempre se empieza por subir el albarán.
  const step: NoteStep = draft ? (paso ?? 'subir') : 'subir'

  return (
    <>
      <PageHeader title="Escanear albarán" description="Sube el albarán, revisa lo leído y el stock se actualiza solo." />
      <NoteWizard
        draft={draft}
        setDraft={setDraft}
        step={step}
        ingredients={state.ingredients}
        onStep={(p) =>
          void navigate({ search: { paso: p === 'subir' ? undefined : p }, replace: true })
        }
        onConfirm={(d) => {
          const note = actions.confirmNote(d)
          toast('Albarán guardado', { description: `${note.lines.length} líneas sumadas al stock.` })
          void navigate({ to: '/albaranes/$albaranId', params: { albaranId: note.id } })
        }}
      />
    </>
  )
}
