import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'
import api from '../../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send a reset link">
      {sent ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 64, height: 64, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={28} color="#16A34A" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Check your inbox</h3>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>
            We sent a reset link to <strong>{email}</strong>. Check your spam folder if you don't see it.
          </p>
          <Link to="/login" className="btn-primary" style={{ justifyContent: 'center' }}>
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input className="input" style={{ paddingLeft: 38 }} type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748B', textDecoration: 'none', marginTop: 20, justifyContent: 'center' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </>
      )}
    </AuthLayout>
  )
}
