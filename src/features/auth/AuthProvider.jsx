import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchBackstageMe, loginBackstage, logoutBackstage } from '../../api/backstageAuthApi'

const AuthContext = createContext(null)

const initialState = {
  isAuthenticated: false,
  isInitializing: true,
  user: null,
  permissions: [],
  mustResetPassword: false,
  session: null,
}

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(initialState)

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
        setAuthState({
          isAuthenticated: false,
          isInitializing: false,
          user: null,
          permissions: [],
          mustResetPassword: false,
          session: null,
        })
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

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

    setAuthState({
      isAuthenticated: false,
      isInitializing: false,
      user: null,
      permissions: [],
      mustResetPassword: false,
      session: null,
    })
  }

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
    }),
    [authState],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
