import { Outlet, createRootRoute, redirect, useLocation } from '@tanstack/react-router'

import { canAccess, sectionOfPath } from '@/shared/domain/roles'
import { AppShell } from '@/shared/layout/app-shell'
import { getState } from '@/shared/store/store'
import { Toaster } from '@/shared/ui/toast'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { role } = getState()
    if (location.pathname === '/rol') return
    if (!role) throw redirect({ to: '/rol' })
    const section = sectionOfPath(location.pathname)
    if (section && !canAccess(role, section)) throw redirect({ to: '/' })
  },
  component: RootLayout,
  notFoundComponent: () => (
    <p className="p-10 text-center text-muted">Esta página no existe.</p>
  ),
})

function RootLayout() {
  const pathname = useLocation({ select: (l) => l.pathname })
  return (
    <>
      {pathname === '/rol' ? (
        <Outlet />
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}
      <Toaster />
    </>
  )
}
