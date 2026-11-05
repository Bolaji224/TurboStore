import axios from 'axios'
import { API_URL } from './api'

const adminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/admin`,
  baseURL: `${API_URL}/api/admin`,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('ts_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ts_admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export default adminApi
