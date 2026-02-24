import { ArrowRightOnRectangleIcon, Cog6ToothIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '/logo.jpg'

const getInitials = (name = '') => {
  if (!name.trim()) return 'KD'
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

const AppPrimarySidebar = ({ items, activeKey, user, onLogout }) => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('')
  const menuRef = useRef(null)
  const avatarUrl = String(user?.avatarUrl ?? '').trim()
  const shouldShowAvatarImage = Boolean(avatarUrl) && avatarUrl !== failedAvatarUrl

  useEffect(() => {
    if (!isMenuOpen) return

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  const handleOpenProfileSettings = () => {
    setIsMenuOpen(false)
    navigate('/settings/profile')
  }

  const handleLogout = () => {
    setIsMenuOpen(false)
    onLogout()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-18 border-r border-slate-300 bg-[#000]">
      <div className="flex h-full flex-col items-center justify-between py-4">
        <div className="flex w-full flex-col items-center gap-4">
          <button
            type="button"
            className="p-2 "
            aria-label="Backstage logo"
          >
            <img src={logo} alt="Backstage" className="h-full w-full object-contain" />
          </button>

          <nav className="mt-1 flex w-full flex-col items-center gap-2">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeKey === item.key

              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-md transition ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-slate-300 hover:bg-slate-200/30 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.hasUnreadDot ? (
                    <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-red-500" />
                  ) : null}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div ref={menuRef} className="relative flex flex-col items-center gap-2">
          {isMenuOpen ? (
            <div
              className="fade-up-in absolute bottom-12 left-0 w-56 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-xl"
              style={{ '--anim-distance': '10px', '--anim-duration': '180ms' }}
            >
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-base font-semibold leading-tight">{user?.displayName ?? user?.name ?? 'Admin User'}</p>
                <p className="mt-1 text-sm text-slate-500">{user?.email ?? 'admin@idtech.local'}</p>
              </div>
              <div className="px-2 py-2">
                <button
                  type="button"
                  onClick={handleOpenProfileSettings}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-slate-700 transition hover:bg-slate-100"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span>Profile settings</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 transition hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-semibold ${
              shouldShowAvatarImage ? 'bg-white ring-1 ring-slate-200' : 'bg-indigo-600 text-white'
            }`}
            aria-label="Account"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            title={user?.displayName ?? user?.name ?? 'Account'}
          >
            {shouldShowAvatarImage ? (
              <img
                src={avatarUrl}
                alt={user?.displayName ?? user?.name ?? 'User avatar'}
                className="h-full w-full object-cover"
                onError={() => setFailedAvatarUrl(avatarUrl)}
              />
            ) : (
              getInitials(user?.displayName ?? user?.name)
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AppPrimarySidebar
