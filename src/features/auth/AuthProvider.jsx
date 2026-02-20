import { createContext, useContext, useMemo, useState } from 'react'
import { clearAuthFromStorage, readAuthFromStorage, writeAuthToStorage } from './authStorage'

const AuthContext = createContext(null)

const MOCK_CREDENTIAL = {
  email: 'admin@idtech.local',
  password: '123456',
  name: 'Backstage Admin',
}

export const AuthProvider = ({ children }) => {
  const initialAuth = readAuthFromStorage()
  const [authState, setAuthState] = useState(
    initialAuth ?? {
      isAuthenticated: false,
      user: null,
    }
  )

  const login = async ({ email, password }) => {
    if (email !== MOCK_CREDENTIAL.email || password !== MOCK_CREDENTIAL.password) {
      throw new Error('Invalid credentials')
    }

    const nextState = {
      isAuthenticated: true,
      user: {
        email: MOCK_CREDENTIAL.email,
        name: MOCK_CREDENTIAL.name,
      },
    }

    setAuthState(nextState)
    writeAuthToStorage(nextState)
    return nextState
  }

  const logout = () => {
    const nextState = {
      isAuthenticated: false,
      user: null,
    }
    setAuthState(nextState)
    clearAuthFromStorage()
  }

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
    }),
    [authState]
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
