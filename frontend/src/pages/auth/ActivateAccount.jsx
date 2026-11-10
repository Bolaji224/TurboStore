import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

/**
 * Landing page for the "Access TurboStore" link in the launch email, for
 * waitlist members whose account was created for them. They choose their own
 * password here; the link is single-use and time-limited (server-enforced).
 */
export default function ActivateAccount() {
  const [params]                  = useSearchParams()
  const navigate                  = useNavigate()
  const { setUserFromToken }      = useAuth()
  const [password, setPassword]   = useState('')
  const [confirm,  setConfirm]    = useState('')
  const [showPw,   setShowPw]     = useState(false)
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')
  const [expired,  setExpired]    = useState(false)

  const token = params.get('token')
  const email = params.get('email')

  if (!token || !email) {
    return (
      <AuthLayout title="Invalid link" subtitle="This activation link is missing required parameters">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={28} color="#EF4444" />
          </div>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>
            Please open the link exactly as it appears in your launch email, or set your password with "Forgot password".
          </p>
          <Link to="/forgot-password" className="btn-primary" style={{ justifyContent: 'center' }}>
            Forgot password
          </Link>
        </div>
      </AuthLayout>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setExpired(false)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/activate-account', {
        email,
        token,
        password,
        password_confirmation: confirm,
      })
      await setUserFromToken(data.token)
      navigate('/dashboard/buy-number', { replace: true })
    } catch (err) {
      setExpired(Boolean(err.response?.data?.expired))
      setError(
        err.response?.data?.message
        || err.response?.data?.errors?.password?.[0]
        || 'Activation failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome to TurboStore 🚀" subtitle="Choose a password to activate your account">
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
        <p style={{ color: '#15803D', fontSize: 13, margin: 0 }}>
          Activating <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
          {(expired || /used|invalid/i.test(error)) && (
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>
              <Link to="/forgot-password" style={{ color: '#16A34A', fontWeight: 600 }}>Forgot password</Link>
              {' · '}
              <Link to="/login" style={{ color: '#16A34A', fontWeight: 600 }}>Sign in</Link>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              className="input"
              style={{ paddingLeft: 38, paddingRight: 42 }}
              type={showPw ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
            Confirm password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              type={showPw ? 'text' : 'password'}
              placeholder="Same password again"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}>
          {loading ? 'Activating…' : 'Activate & Continue'}
        </button>
      </form>

      <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 20 }}>
        Already set a password? <Link to="/login" style={{ color: '#16A34A', fontWeight: 600 }}>Sign in</Link>
      </p>
    </AuthLayout>
  )
}
