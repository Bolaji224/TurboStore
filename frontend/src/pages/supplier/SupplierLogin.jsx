import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import SupplierAuthLayout from '../../components/layout/SupplierAuthLayout'

export default function SupplierLogin() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login }             = useAuth()
  const navigate              = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard/marketplace/vendor')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10, fontSize: 14,
    border: '1.5px solid #1E2736', background: '#161B26', color: '#E2E8F0',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color .2s',
  }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }

  return (
    <SupplierAuthLayout title="Supplier sign in" subtitle="Access your supplier dashboard and manage your services">
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              style={inputStyle}
              type="email"
              placeholder="you@business.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              onFocus={e => e.target.style.borderColor = '#16A34A'}
              onBlur={e => e.target.style.borderColor = '#1E2736'}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={labelStyle}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#4ADE80', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              style={{ ...inputStyle, paddingRight: 40 }}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              onFocus={e => e.target.style.borderColor = '#16A34A'}
              onBlur={e => e.target.style.borderColor = '#1E2736'}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#475569' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px 20px', fontSize: 15, fontWeight: 700,
            background: loading ? '#1E2736' : 'linear-gradient(135deg, #16A34A, #15803D)',
            color: loading ? '#475569' : '#fff', border: 'none', borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(22,163,74,0.3)',
            transition: 'all .2s',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In to Supplier Portal'}
        </button>
      </form>

      <div style={{ margin: '24px 0', height: 1, background: '#1E2736' }} />

      <p style={{ textAlign: 'center', fontSize: 14, color: '#475569', margin: 0 }}>
        New supplier?{' '}
        <Link to="/supplier/register" style={{ color: '#4ADE80', fontWeight: 600, textDecoration: 'none' }}>
          Create a supplier account
        </Link>
      </p>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#334155', marginTop: 12 }}>
        Are you a buyer?{' '}
        <Link to="/login" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>
          Sign in here
        </Link>
      </p>
    </SupplierAuthLayout>
  )
}
