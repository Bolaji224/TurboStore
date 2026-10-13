import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function SocialCallback() {
  const navigate = useNavigate()
  const { setUserFromToken } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const err    = params.get('error')

    if (err || !token) {
      setError('Google sign-in failed. Please try again.')
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    localStorage.setItem('ts_token', token)
    setUserFromToken(token)
    navigate('/dashboard', { replace: true })
  }, [])

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <p style={{ color: '#DC2626', fontSize: 15 }}>{error}</p>
        <p style={{ color: '#64748B', fontSize: 13 }}>Redirecting back to login…</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
