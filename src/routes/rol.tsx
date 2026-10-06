import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChefHat, ScanLine, Store, UserRound } from 'lucide-react'

import { ROLES } from '@/shared/domain/roles'
import type { Role } from '@/shared/domain/types'
import { actions } from '@/shared/store/store'
import { Card } from '@/shared/ui/primitives'

export const Route = createFileRoute('/rol')({ component: RolePage })

const icons: Record<Role, typeof UserRound> = {
  propietario: Store,
  encargado: UserRound,
  cocina: ChefHat,
}

function RolePage() {
  const navigate = useNavigate()

  const choose = (role: Role) => {
    actions.setRole(role)
    void navigate({ to: '/' })
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand text-white">
            <ScanLine className="size-7" />
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">ScanDice</h1>
          <p className="mt-2 text-muted">
            Albaranes, stock y recetas del restaurante. ¿Con qué rol quieres probar la demo?
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map((role) => {
            const Icon = icons[role.id]
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => choose(role.id)}
                className="text-left"
              >
                <Card className="h-full p-6 transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg">
                  <Icon className="mb-4 size-7 text-brand" />
                  <h2 className="text-lg font-semibold">{role.label}</h2>
                  <p className="mt-1 text-sm text-muted">{role.description}</p>
                </Card>
              </button>
            )
          })}
        </div>
        <p className="mt-8 text-center text-xs text-muted">
          Demo sin conexión a servidor: los datos se guardan solo en este navegador.
        </p>
      </div>
    </main>
  )
}
