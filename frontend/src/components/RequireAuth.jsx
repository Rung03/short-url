import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth-context.js'

// Sends logged-out visitors to /login (and back afterwards); `admin` also requires the admin role
export default function RequireAuth({ admin = false, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="muted">กำลังโหลด…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}
