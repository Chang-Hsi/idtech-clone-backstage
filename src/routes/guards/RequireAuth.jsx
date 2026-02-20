import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'

const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default RequireAuth
