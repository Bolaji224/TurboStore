import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Briefcase, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import SupplierAuthLayout from '../../components/layout/SupplierAuthLayout'
import api from '../../services/api'

export default function SupplierRegister() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    business_name: '', bio: '',
  })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { setUserFromToken }  = useAuth()
  const navigate              = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/vendor-register', {
        name:                  form.name,
        email:                 form.email,
        password:              form.password,
        password_confirmation: form.password_confirmation,
        business_name:         form.business_name,
        bio:                   form.bio,
      })
      await setUserFromToken(res.data.token)
      navigate('/dashboard/marketplace/vendor')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        setError(Object.values(errors).flat().join(' '))
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.')
      }
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
  const focusOn  = e => e.target.style.borderColor = '#16A34A'
  const focusOff = e => e.target.style.borderColor = '#1E2736'

  return (
    <SupplierAuthLayout title="Become a supplier" subtitle="Create your account and start selling your services today">
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Account section */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Your account</p>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input style={inputStyle} type="text" placeholder="John Doe" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={focusOn} onBlur={focusOff} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input style={inputStyle} type="email" placeholder="you@business.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onFocus={focusOn} onBlur={focusOff} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input style={{ ...inputStyle, paddingRight: 40 }}
                type={showPw ? 'text' : 'password'} placeholder="Min. 8 chars" required minLength={8}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onFocus={focusOn} onBlur={focusOff} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: '#475569' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Confirm</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input style={inputStyle} type={showPw ? 'text' : 'password'} placeholder="Repeat" required
                value={form.password_confirmation} onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                onFocus={focusOn} onBlur={focusOff} />
            </div>
          </div>
        </div>

        {/* Business section */}
        <div style={{ height: 1, background: '#1E2736', margin: '4px 0 16px' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Your business</p>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Business / Brand Name</label>
          <div style={{ position: 'relative' }}>
            <Briefcase size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input style={inputStyle} type="text" placeholder="e.g. SocialBoost Pro" required
              value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
              onFocus={focusOn} onBlur={focusOff} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Short bio <span style={{ color: '#334155', fontWeight: 400 }}>(optional)</span></label>
          <div style={{ position: 'relative' }}>
            <FileText size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#475569' }} />
            <textarea
              style={{ ...inputStyle, paddingLeft: 38, paddingTop: 11, resize: 'vertical', minHeight: 72 }}
              placeholder="Tell buyers about your services and experience…"
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              onFocus={focusOn} onBlur={focusOff}
            />
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
          {loading ? 'Creating supplier account…' : 'Create Supplier Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 14 }}>
        By signing up you agree to our{' '}
        <a href="#" style={{ color: '#4ADE80', textDecoration: 'none' }}>Terms</a> &amp;{' '}
        <a href="#" style={{ color: '#4ADE80', textDecoration: 'none' }}>Supplier Policy</a>.
        Your account is approved instantly — each service listing is reviewed before going live.
      </p>

      <div style={{ margin: '20px 0', height: 1, background: '#1E2736' }} />

      <p style={{ textAlign: 'center', fontSize: 14, color: '#475569', margin: 0 }}>
        Already have an account?{' '}
        <Link to="/supplier/login" style={{ color: '#4ADE80', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#334155', marginTop: 10 }}>
        Are you a buyer?{' '}
        <Link to="/register" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>
          Create a buyer account
        </Link>
      </p>
    </SupplierAuthLayout>
  )
}
