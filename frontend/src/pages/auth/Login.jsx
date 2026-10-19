import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Fingerprint } from 'lucide-react'
import { startAuthentication } from '@simplewebauthn/browser'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/layout/AuthLayout'
import api, { API_URL } from '../../services/api'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [pkLoading, setPkLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasskeyLogin() {
    setError('')
    setPkLoading(true)
    try {
      // 1. Get challenge from server
      const optRes = await api.post('/auth/passkey/authenticate/options')
      const options = optRes.data

      // 2. Browser prompts fingerprint
      const credential = await startAuthentication({ optionsJSON: options })

      // 3. Send assertion to server
      const verifyRes = await api.post('/auth/passkey/authenticate/verify', credential)
      const { token } = verifyRes.data

      localStorage.setItem('ts_token', token)
      // Reload user state via context
      window.location.href = '/dashboard'
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Passkey authentication was cancelled or timed out.')
      } else {
        setError(err.response?.data?.message || 'Passkey sign-in failed. Try your password instead.')
      }
    } finally {
      setPkLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your TurboStore account">
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Google button */}
      <a
        href={`${API_URL}/auth/google/redirect`}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 20px', background: 'var(--section-alt)', border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12, textDecoration: 'none', transition: 'border-color .2s', boxSizing: 'border-box' }}
      >
        <GoogleIcon />
        Continue with Google
      </a>

      {/* Passkey button */}
      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={pkLoading}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 20px', background: 'var(--section-alt)', border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 20, transition: 'border-color .2s' }}
      >
        <Fingerprint size={18} color="#16A34A" />
        {pkLoading ? 'Waiting for fingerprint…' : 'Sign in with Passkey'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>or sign in with password</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Email</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#16A34A', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              className="input"
              style={{ paddingLeft: 38, paddingRight: 40 }}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#94A3B8' }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 24 }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
          Create one free
        </Link>
      </p>
    </AuthLayout>
  )
}
