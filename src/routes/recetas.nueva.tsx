import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { RecipeWizard, emptyRecipe } from '@/features/recetas/recipe-wizard'
import type { RecipeStep } from '@/features/recetas/recipe-wizard'
import { actions, useAppState } from '@/shared/store/store'
import { PageHeader } from '@/shared/ui/primitives'

interface NewRecipeSearch {
  tipo?: 'final' | 'intermedia'
  paso?: RecipeStep
}

const parseStep = (p: unknown): RecipeStep | undefined =>
  p === 'ingredientes' || p === 'revisar' ? p : undefined

export const Route = createFileRoute('/recetas/nueva')({
  validateSearch: (s: NewRecipeSearch): NewRecipeSearch => ({
    tipo: s.tipo === 'intermedia' ? 'intermedia' : undefined,
    paso: parseStep(s.paso),
  }),
  component: NewRecipePage,
})

function NewRecipePage() {
  const { tipo, paso } = Route.useSearch()
  const navigate = useNavigate({ from: '/recetas/nueva' })
  const state = useAppState()
  const [initial] = useState(() => emptyRecipe(tipo === 'intermedia' ? 'intermediate' : 'final'))

  return (
    <>
      <PageHeader title="Nueva receta" description="Tres pasos, y a la derecha ves cómo queda en directo." />
      <RecipeWizard
        initial={initial}
        isNew
        step={paso ?? 'datos'}
        recipes={state.recipes}
        ingredients={state.ingredients}
        onStep={(p) =>
          void navigate({ search: (prev) => ({ ...prev, paso: p === 'datos' ? undefined : p }), replace: true })
        }
        onSave={(recipe) => {
          actions.saveRecipe(recipe)
          toast('Receta creada', { description: recipe.name })
          void navigate({ to: '/recetas/$recetaId', params: { recetaId: recipe.id } })
        }}
      />
    </>
  )
}
