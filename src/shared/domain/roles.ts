import type { Role } from './types'

export type Section = 'inicio' | 'albaranes' | 'stock' | 'recetas' | 'ventas'

export const ROLES: { id: Role; label: string; description: string; sections: Section[] }[] = [
  {
    id: 'propietario',
    label: 'Propietario',
    description: 'Acceso completo: albaranes, stock, recetas y ventas.',
    sections: ['inicio', 'albaranes', 'stock', 'recetas', 'ventas'],
  },
  {
    id: 'encargado',
    label: 'Encargado de sala',
    description: 'Escanea albaranes, revisa el stock y registra ventas.',
    sections: ['inicio', 'albaranes', 'stock', 'ventas'],
  },
  {
    id: 'cocina',
    label: 'Cocina',
    description: 'Consulta stock y recetas y registra lo que se cocina.',
    sections: ['inicio', 'stock', 'recetas', 'ventas'],
  },
]

export const roleById = (id: Role | null) => ROLES.find((r) => r.id === id)

export function sectionOfPath(pathname: string): Section | null {
  const first = pathname.split('/').filter(Boolean)[0]
  if (!first) return 'inicio'
  if (first === 'ingredientes') return 'stock'
  return (['albaranes', 'stock', 'recetas', 'ventas'] as const).find((s) => s === first) ?? null
}

export const canAccess = (role: Role | null, section: Section) =>
  !!roleById(role)?.sections.includes(section)
