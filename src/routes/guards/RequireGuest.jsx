import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

const RequireGuest = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <div className="min-h-screen bg-[#F6F7FB]" />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default RequireGuest
