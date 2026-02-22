import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'

const RequireGuest = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <div className="min-h-screen bg-[#F6F7FB]" />
  }

  if (isAuthenticated) {
    return <Navigate to="/pages/home" replace />
  }

  return children
}

export default RequireGuest
