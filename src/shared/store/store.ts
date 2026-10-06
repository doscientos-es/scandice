import { useSyncExternalStore } from 'react'

import { createSeedState } from '../domain/seed'
import * as t from '../domain/transitions'
import type { AppState, DeliveryNote, NoteDraft, Recipe, SaleLine } from '../domain/types'

/**
 * Persistencia 100 % local (demo). Cuando se conecte Supabase, solo hay que
 * sustituir `commit` y `load` por llamadas al backend; la UI no cambia.
 */
const STORAGE_KEY = 'scandice-demo-v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* almacenamiento corrupto o no disponible: se parte de los datos de ejemplo */
  }
  return createSeedState()
}

let state: AppState = load()
const listeners = new Set<() => void>()

function commit(next: AppState) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* sin espacio: la demo sigue funcionando en memoria */
  }
  for (const l of listeners) l()
}

export const getState = () => state

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

export const actions = {
  confirmNote: (draft: NoteDraft): DeliveryNote => {
    const result = t.confirmNote(state, draft)
    commit(result.state)
    return result.note
  },
  updateNote: (note: DeliveryNote) => commit(t.updateNote(state, note)),
  deleteNote: (id: string) => commit(t.deleteNote(state, id)),
  registerSales: (lines: SaleLine[]) => commit(t.registerSales(state, lines)),
  adjustIngredient: (id: string, patch: { stock: number; minStock: number }) =>
    commit(t.adjustIngredient(state, id, patch)),
  saveRecipe: (recipe: Recipe) => commit(t.saveRecipe(state, recipe)),
  deleteRecipe: (id: string) => commit(t.deleteRecipe(state, id)),
  /** Deshace la última acción volviendo a una foto previa del estado. */
  restore: (snapshot: AppState) => commit(snapshot),
  /** Vuelve a los datos de ejemplo. */
  resetDemo: () => commit(createSeedState()),
}
