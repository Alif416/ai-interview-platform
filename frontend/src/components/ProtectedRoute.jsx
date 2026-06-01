import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// If not authenticated → redirect to login
// If authenticated → show the page

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Role-based protection
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute