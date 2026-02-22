import { useMatches } from 'react-router-dom'
import AppMainWorkspace from '../components/layouts/AppMainWorkspace'
import AppPrimarySidebar from '../components/layouts/AppPrimarySidebar'
import AppSecondarySidebar from '../components/layouts/AppSecondarySidebar'
import AppSeoSidebar from '../components/layouts/AppSeoSidebar'
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_CONFIG } from '../components/layouts/layoutNavigation'
import { useAuth } from '../features/auth/AuthContext'

const AppLayout = () => {
  const { user, logout } = useAuth()
  const matches = useMatches()
  const current = matches[matches.length - 1]
  const primaryNavKey = current?.handle?.primaryNav ?? 'pages'
  const secondaryNavKey = current?.handle?.secondaryNav
  const secondaryNavConfig = secondaryNavKey ? SECONDARY_NAV_CONFIG[secondaryNavKey] : null
  const shouldShowSeoSidebar = primaryNavKey === 'seo'
  const hasSidebar = Boolean(secondaryNavConfig) || shouldShowSeoSidebar

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <AppPrimarySidebar
        items={PRIMARY_NAV_ITEMS}
        activeKey={primaryNavKey}
        user={user}
        onLogout={logout}
      />
      <AppSecondarySidebar config={secondaryNavConfig} />
      {shouldShowSeoSidebar ? <AppSeoSidebar /> : null}
      <AppMainWorkspace hasSecondarySidebar={hasSidebar} />
    </div>
  )
}

export default AppLayout
