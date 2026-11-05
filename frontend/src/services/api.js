import axios from 'axios'

// Laravel API origin; set VITE_API_URL at build time for production
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ts_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ts_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
