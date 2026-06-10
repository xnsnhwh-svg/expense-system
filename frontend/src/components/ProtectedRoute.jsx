import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute