import { useMatches } from 'react-router-dom'
import AppMainWorkspace from '../components/layouts/AppMainWorkspace'
import AppPrimarySidebar from '../components/layouts/AppPrimarySidebar'
import AppSecondarySidebar from '../components/layouts/AppSecondarySidebar'
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_CONFIG } from '../components/layouts/layoutNavigation'
import { useAuth } from '../features/auth/AuthProvider'

const AppLayout = () => {
  const { user, logout } = useAuth()
  const matches = useMatches()
  const current = matches[matches.length - 1]
  const primaryNavKey = current?.handle?.primaryNav ?? 'pages'
  const secondaryNavKey = current?.handle?.secondaryNav
  const secondaryNavConfig = secondaryNavKey ? SECONDARY_NAV_CONFIG[secondaryNavKey] : null

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <AppPrimarySidebar
        items={PRIMARY_NAV_ITEMS}
        activeKey={primaryNavKey}
        user={user}
        onLogout={logout}
      />
      <AppSecondarySidebar config={secondaryNavConfig} />
      <AppMainWorkspace hasSecondarySidebar={Boolean(secondaryNavConfig)} />
    </div>
  )
}

export default AppLayout
