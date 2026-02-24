import { useEffect, useMemo, useState } from 'react'
import { useMatches } from 'react-router-dom'
import AppMainWorkspace from '../components/layouts/AppMainWorkspace'
import AppPrimarySidebar from '../components/layouts/AppPrimarySidebar'
import AppSecondarySidebar from '../components/layouts/AppSecondarySidebar'
import AppSeoSidebar from '../components/layouts/AppSeoSidebar'
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_CONFIG } from '../components/layouts/layoutNavigation'
import { fetchBackstageSubmissions } from '../api/backstageSubmissionsApi'
import { useAuth } from '../features/auth/AuthContext'

const AppLayout = () => {
  const { user, logout } = useAuth()
  const matches = useMatches()
  const [hasUnreadSubmissions, setHasUnreadSubmissions] = useState(false)
  const current = matches[matches.length - 1]
  const primaryNavKey = current?.handle?.primaryNav ?? 'pages'
  const secondaryNavKey = current?.handle?.secondaryNav
  const secondaryNavConfig = secondaryNavKey ? SECONDARY_NAV_CONFIG[secondaryNavKey] : null
  const shouldShowSeoSidebar = primaryNavKey === 'seo'
  const hasSidebar = Boolean(secondaryNavConfig) || shouldShowSeoSidebar

  useEffect(() => {
    let cancelled = false

    const loadUnread = async () => {
      try {
        const payload = await fetchBackstageSubmissions({
          source: 'all',
          status: 'new',
          page: 1,
          pageSize: 1,
        })
        const total = Number(payload?.data?.pagination?.total ?? 0)
        if (!cancelled) {
          setHasUnreadSubmissions(total > 0)
        }
      } catch {
        if (!cancelled) {
          setHasUnreadSubmissions(false)
        }
      }
    }

    void loadUnread()
    const intervalId = window.setInterval(loadUnread, 20000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  const primaryNavItems = useMemo(
    () =>
      PRIMARY_NAV_ITEMS.map((item) =>
        item.key === 'submissions'
          ? {
              ...item,
              hasUnreadDot: hasUnreadSubmissions,
            }
          : item,
      ),
    [hasUnreadSubmissions],
  )

  return (
    <div className="flex min-h-screen bg-white text-slate-800">
      <AppPrimarySidebar
        items={primaryNavItems}
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
