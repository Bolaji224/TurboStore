import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import adminApi from '../services/adminApi'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('ts_admin_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await adminApi.get('/auth/me')
      setAdmin(data.admin)
    } catch {
      localStorage.removeItem('ts_admin_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  async function login(email, password) {
    const { data } = await adminApi.post('/auth/login', { email, password })
    localStorage.setItem('ts_admin_token', data.token)
    setAdmin(data.admin)
    return data.admin
  }

  async function logout() {
    try { await adminApi.post('/auth/logout') } catch {}
    localStorage.removeItem('ts_admin_token')
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
