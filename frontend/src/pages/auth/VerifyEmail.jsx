import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function VerifyEmail() {
  const location   = useLocation()
  const email      = location.state?.email || ''
  const { user }   = useAuth()
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)
  const [error,     setError]     = useState('')

  const params = new URLSearchParams(location.search)
  const linkError = params.get('error')

  async function handleResend() {
    setResending(true)
    setError('')
    try {
      await api.post('/auth/email/resend')
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch {
      setError('Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        {/* Card */}
        <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 24px rgba(22,163,74,.3)' }}>
            <Mail size={30} color="#fff" />
          </div>

          {linkError === 'expired' ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>Link Expired</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
                Your verification link has expired. Request a new one below.
              </p>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <AlertCircle size={14} color="#F59E0B" />
                  <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>Verification link expired</span>
                </div>
              </div>
            </>
          ) : linkError === 'invalid' ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>Invalid Link</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
                This verification link is invalid. Please request a new one.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>Check Your Inbox</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.6 }}>
                We sent a confirmation email to
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#16A34A', margin: '0 0 24px' }}>
                {email || user?.email || 'your email address'}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
                Click the link in the email to activate your account and access your virtual numbers.
              </p>
            </>
          )}

          {/* Success feedback */}
          {resent && (
            <div style={{ background: 'rgba(22,163,74,0.1)', border: '1.5px solid rgba(22,163,74,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <CheckCircle size={14} color="#16A34A" />
                <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Verification email resent!</span>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
            </div>
          )}

          {/* Resend button — only show if logged in (has token) */}
          {user && (
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: 8, marginBottom: 16 }}
            >
              <RefreshCw size={14} style={{ animation: resending ? 'spin .8s linear infinite' : 'none' }} />
              {resending ? 'Sending…' : resent ? 'Email Sent!' : 'Resend Verification Email'}
            </button>
          )}

          {/* Tips */}
          <div style={{ background: 'var(--section-alt)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Didn't receive the email?</p>
            {['Check your spam or junk folder.', 'Make sure the email address is correct.', 'Wait a minute, then try resending.'].map(tip => (
              <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 4, height: 4, background: '#16A34A', borderRadius: '50%', marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>

          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>

        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(145deg,#16A34A,#063B2D)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path d="M4 3h12l-6 6h4.5l-7.5 8 2.5-6H4.5L10 5H4V3z" fill="#4ADE80"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>TurboStore</span>
          </Link>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
