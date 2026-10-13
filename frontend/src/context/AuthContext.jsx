import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ts_token')
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('ts_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('ts_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  async function register(name, email, password, password_confirmation, referral_code) {
    const res = await api.post('/auth/register', { name, email, password, password_confirmation, referral_code })
    localStorage.setItem('ts_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('ts_token')
    setUser(null)
  }

  async function setUserFromToken(token) {
    localStorage.setItem('ts_token', token)
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
    } catch {
      localStorage.removeItem('ts_token')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
