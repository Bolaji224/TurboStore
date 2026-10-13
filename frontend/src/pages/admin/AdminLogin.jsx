import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminLogin() {
  const { admin, login } = useAdminAuth()
  const navigate         = useNavigate()
  const [form, setForm]  = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (admin) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: '0 0 6px' }}>Admin Portal</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Turbostore — Restricted Access</p>
        </div>

        {/* Card */}
        <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 16, padding: 28 }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#EF4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="admin@example.com"
                style={{ width: '100%', padding: '10px 14px', background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#16A34A'}
                onBlur={e => e.target.style.borderColor = '#1E2736'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 40px 10px 14px', background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#16A34A'}
                  onBlur={e => e.target.style.borderColor = '#1E2736'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', background: loading ? '#14532D' : '#16A34A', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'background .15s' }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                <><LogIn size={16} /> Sign in to Admin</>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 20 }}>
          Unauthorized access is prohibited and logged.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
