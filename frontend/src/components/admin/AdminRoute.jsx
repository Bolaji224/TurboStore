import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminRoute({ children, requireSuper = false }) {
  const { admin, loading } = useAdminAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0F1117' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!admin) return <Navigate to="/admin/login" replace />
  if (requireSuper && admin.admin_role !== 'super_admin') return <Navigate to="/admin" replace />

  return children
}
