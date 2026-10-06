import { Outlet, createRootRoute } from '@tanstack/react-router'

import { AppShell } from '@/shared/layout/app-shell'
import { Toaster } from '@/shared/ui/toast'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <p className="p-10 text-center text-muted">Esta página no existe.</p>
  ),
})

function RootLayout() {
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </>
  )
}
