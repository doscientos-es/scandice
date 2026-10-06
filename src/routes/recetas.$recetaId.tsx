import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Printer } from 'lucide-react'

import { RecipeWizard } from '@/features/recetas/recipe-wizard'
import type { RecipeStep } from '@/features/recetas/recipe-wizard'
import { actions, getState, useAppState } from '@/shared/store/store'
import { EmptyState, PageHeader, buttonStyles } from '@/shared/ui/primitives'
import { toast } from '@/shared/ui/toast'

interface EditSearch {
  paso?: RecipeStep
}

export const Route = createFileRoute('/recetas/$recetaId')({
  validateSearch: (s: EditSearch): EditSearch => ({
    paso: s.paso === 'datos' || s.paso === 'ingredientes' ? s.paso : undefined,
  }),
  component: EditRecipePage,
})

function EditRecipePage() {
  const { recetaId } = Route.useParams()
  const { paso } = Route.useSearch()
  const navigate = useNavigate({ from: '/recetas/$recetaId' })
  const state = useAppState()
  const recipe = state.recipes.find((r) => r.id === recetaId)

  if (!recipe) {
    return (
      <EmptyState title="Esta receta ya no existe">
        <Link to="/recetas" className={buttonStyles('secondary')}>Volver a recetas</Link>
      </EmptyState>
    )
  }

  return (
    <>
      <PageHeader
        title={recipe.name}
        description="Edita la receta; los cambios se aplican al guardar."
        actions={
          <button type="button" onClick={() => window.print()} className={`${buttonStyles('secondary')} print:hidden`}>
            <Printer className="size-4" />
            Imprimir
          </button>
        }
      />
      <RecipeWizard
        key={recipe.id}
        initial={recipe}
        isNew={false}
        step={paso ?? 'revisar'}
        recipes={state.recipes}
        ingredients={state.ingredients}
        onStep={(p) => void navigate({ search: { paso: p }, replace: true })}
        onSave={(r) => {
          actions.saveRecipe(r)
          toast('Cambios guardados', { description: r.name })
          void navigate({ to: '/recetas' })
        }}
        onDelete={() => {
          const before = getState()
          actions.deleteRecipe(recipe.id)
          toast('Receta eliminada', {
            description: recipe.name,
            tone: 'warn',
            action: { label: 'Deshacer', onClick: () => actions.restore(before) },
          })
          void navigate({ to: '/recetas' })
        }}
      />
    </>
  )
}
