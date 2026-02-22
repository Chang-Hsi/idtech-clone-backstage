import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchBackstageMe, loginBackstage, logoutBackstage } from '../../api/backstageAuthApi'
import { setUnauthorizedHandler } from '../../lib/request'
import { AuthContext } from './AuthContext'

const initialState = {
  isAuthenticated: false,
  isInitializing: true,
  user: null,
  permissions: [],
  mustResetPassword: false,
  session: null,
}

const loggedOutState = {
  isAuthenticated: false,
  isInitializing: false,
  user: null,
  permissions: [],
  mustResetPassword: false,
  session: null,
}

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(initialState)
  const [logoutToast, setLogoutToast] = useState(null)
  const authStateRef = useRef(initialState)

  useEffect(() => {
    authStateRef.current = authState
  }, [authState])

  const showAutoLogoutToast = useCallback(() => {
    setLogoutToast({
      id: Date.now(),
      message: 'Your session has expired. You have been signed out.',
      exiting: false,
    })
  }, [])

  useEffect(() => {
    if (!logoutToast) return undefined

    const exitTimer = window.setTimeout(() => {
      setLogoutToast((current) => {
        if (!current || current.id !== logoutToast.id) return current
        return { ...current, exiting: true }
      })
    }, 5000)

    const removeTimer = window.setTimeout(() => {
      setLogoutToast((current) => {
        if (!current || current.id !== logoutToast.id) return current
        return null
      })
    }, 5400)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(removeTimer)
    }
  }, [logoutToast])

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        const payload = await fetchBackstageMe()
        if (!mounted) return
        setAuthState({
          isAuthenticated: true,
          isInitializing: false,
          user: payload?.data?.user ?? null,
          permissions: Array.isArray(payload?.data?.permissions) ? payload.data.permissions : [],
          mustResetPassword: Boolean(payload?.data?.mustResetPassword),
          session: payload?.data?.session ?? null,
        })
      } catch {
        if (!mounted) return
        setAuthState(loggedOutState)
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!authStateRef.current.isAuthenticated) return
      setAuthState(loggedOutState)
      showAutoLogoutToast()
    }

    setUnauthorizedHandler(handleUnauthorized)
    return () => {
      setUnauthorizedHandler(null)
    }
  }, [showAutoLogoutToast])

  const login = async ({ email, password }) => {
    const payload = await loginBackstage({ email, password })

    const nextState = {
      isAuthenticated: true,
      isInitializing: false,
      user: payload?.data?.user ?? null,
      permissions: Array.isArray(payload?.data?.permissions) ? payload.data.permissions : [],
      mustResetPassword: Boolean(payload?.data?.mustResetPassword),
      session: payload?.data?.session ?? null,
    }

    setAuthState(nextState)
    return nextState
  }

  const logout = async () => {
    try {
      await logoutBackstage()
    } catch {
      // ignore logout network errors and clear local auth state anyway
    }

    setAuthState(loggedOutState)
  }

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
    }),
    [authState],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {logoutToast ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[9999]">
          <div
            className={`w-[min(92vw,24rem)] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg transition-[transform,opacity] duration-300 ease-out ${
              logoutToast.exiting ? 'translate-x-[calc(100%+1.25rem)] opacity-0' : 'translate-x-0 opacity-100'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-amber-900">Session signed out</p>
            <p className="mt-1 text-sm text-amber-800">{logoutToast.message}</p>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  )
}
