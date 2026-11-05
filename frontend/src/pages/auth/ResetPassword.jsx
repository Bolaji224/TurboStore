import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import api from '../../services/api'

export default function ResetPassword() {
  const [params]                  = useSearchParams()
  const navigate                  = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm,  setConfirm]    = useState('')
  const [showPw,   setShowPw]     = useState(false)
  const [loading,  setLoading]    = useState(false)
  const [done,     setDone]       = useState(false)
  const [error,    setError]      = useState('')

  const token = params.get('token')
  const email = params.get('email')

  if (!token || !email) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing required parameters">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={28} color="#EF4444" />
          </div>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>
            This link is invalid or incomplete. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn-primary" style={{ justifyContent: 'center' }}>
            Request new link
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
    setLoading(true)
    try {
      await api.post('/reset-password', {
        email,
        token,
        password,
        password_confirmation: confirm,
      })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated!" subtitle="You can now log in with your new password">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 64, height: 64, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={28} color="#16A34A" />
          </div>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>
            Your password has been reset successfully.
          </p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* New password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
            New password
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
              required
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
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
              required
            />
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}>
          {loading ? 'Updating…' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  )
}
