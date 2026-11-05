import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle, ShoppingBag } from 'lucide-react'
import api from '../../../services/api'

export default function VendorApply() {
  const navigate = useNavigate()

  const [businessName, setBusinessName] = useState('')
  const [about,        setAbout]        = useState('')
  const [agreed,       setAgreed]       = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [checking,     setChecking]     = useState(true)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)

  // Check if user already has a vendor profile
  useEffect(() => {
    api.get('/vendor/profile')
      .then(r => {
        const profile = r.data.vendor || r.data
        if (profile?.status === 'approved') {
          navigate('/dashboard/marketplace/vendor', { replace: true })
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!businessName.trim()) { setError('Business name is required.'); return }
    if (!agreed)              { setError('You must agree to the terms.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/vendor/apply', {
        business_name: businessName.trim(),
        about:         about.trim(),
      })
      navigate('/dashboard/marketplace/vendor', { replace: true })
    } catch (e) {
      setError(e.response?.data?.message || 'Application failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>Become a Vendor</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          List your social media marketing services and earn on TurboStore. Our team reviews every application before approval.
        </p>
      </div>

      {success ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(22,163,74,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="#16A34A" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>You're a Vendor!</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Your vendor profile is ready. Start creating services right away — each service is reviewed before going live.
          </p>
          <Link to="/dashboard/marketplace/vendor" className="btn-primary" style={{ textDecoration: 'none', fontSize: 14 }}>
            Go to Vendor Dashboard
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Business name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                Business Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                className="input"
                type="text"
                placeholder="e.g. GrowthBoost Services"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                maxLength={100}
                style={{ width: '100%' }}
                required
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{businessName.length}/100</p>
            </div>

            {/* About */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                About Your Business <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Briefly describe your services, experience, and platforms you work with…"
                value={about}
                onChange={e => setAbout(e.target.value)}
                maxLength={500}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{about.length}/500</p>
            </div>

            {/* Agreement checkbox */}
            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#16A34A', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                I agree to only list <strong>legitimate marketing services</strong> and not offer account credentials, stolen accounts, or fraudulent services.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                to="/dashboard/marketplace"
                className="btn-secondary"
                style={{ textDecoration: 'none', flex: 1, textAlign: 'center', fontSize: 14 }}>
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 2, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <>
                    <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Submitting…
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  </>
                ) : (
                  <><ShoppingBag size={15} /> Submit Application</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
