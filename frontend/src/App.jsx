import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import SocialCallback from './pages/auth/SocialCallback'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import BuyNumber from './pages/dashboard/BuyNumber'
import Orders from './pages/dashboard/Orders'
import Wallet from './pages/dashboard/Wallet'
import Transactions from './pages/dashboard/Transactions'
import ApiKeys from './pages/dashboard/ApiKeys'
import Referrals from './pages/dashboard/Referrals'
import Rewards from './pages/dashboard/Rewards'
import Profile from './pages/dashboard/Profile'
import Security from './pages/dashboard/Security'
import Settings from './pages/dashboard/Settings'
import AdminLayout from './components/admin/AdminLayout'
import AdminRoute from './components/admin/AdminRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminOrders from './pages/admin/AdminOrders'
import AdminTransactions from './pages/admin/AdminTransactions'
import AdminReferrals from './pages/admin/AdminReferrals'
import AdminReports from './pages/admin/AdminReports'
import AdminProviders from './pages/admin/AdminProviders'
import AdminSettings from './pages/admin/AdminSettings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<SocialCallback />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Overview />} />
                <Route path="buy-number" element={<BuyNumber />} />
                <Route path="orders" element={<Orders />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="api-keys" element={<ApiKeys />} />
                <Route path="referrals" element={<Referrals />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="profile" element={<Profile />} />
                <Route path="security" element={<Security />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="wallet" element={<AdminTransactions />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="providers" element={<AdminProviders />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
