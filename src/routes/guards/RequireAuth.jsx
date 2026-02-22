import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isInitializing, mustResetPassword } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <div className="min-h-screen bg-[#F6F7FB]" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  if (mustResetPassword && !location.pathname.startsWith('/settings/profile')) {
    return <Navigate to="/settings/profile" replace state={{ reason: 'must-reset-password' }} />
  }

  return children
}

export default RequireAuth
