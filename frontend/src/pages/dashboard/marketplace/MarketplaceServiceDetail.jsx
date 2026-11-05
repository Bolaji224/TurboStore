import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Star, Package, AlertCircle } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'

const PLATFORM_COLORS = {
  facebook:  '#1877F2',
  instagram: '#E1306C',
  twitter:   '#1DA1F2',
  tiktok:    '#000000',
  youtube:   '#FF0000',
  general:   '#16A34A',
}

function formatNaira(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })
}

function getPlatformColor(platform) {
  return PLATFORM_COLORS[(platform || '').toLowerCase()] || '#16A34A'
}

function StarRating({ rating, count }) {
  if (!rating) return null
  const full  = Math.floor(rating)
  const frac  = rating - full
  const empty = 5 - full - (frac > 0 ? 1 : 0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: full }).map((_, i) => <Star key={`f${i}`} size={14} fill="#F59E0B" color="#F59E0B" />)}
      {frac > 0 && <Star size={14} fill="#F59E0B" color="#F59E0B" style={{ opacity: 0.5 }} />}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} size={14} fill="none" color="#D1D5DB" />)}
      <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>{Number(rating).toFixed(1)}</span>
      {count > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({count} review{count !== 1 ? 's' : ''})</span>}
    </div>
  )
}

function generateIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export default function MarketplaceServiceDetail() {
  const { slug }     = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()

  const [service,      setService]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [activeTab,    setActiveTab]    = useState('overview')
  const [requirements, setRequirements] = useState('')
  const [ordering,     setOrdering]     = useState(false)
  const [orderError,   setOrderError]   = useState('')
  const [toast,        setToast]        = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(`/marketplace/services/${slug}`)
      .then(r => {
        const svc = r.data.data || r.data.service || r.data
        // Normalise nested vendor/category names
        if (svc.vendor && !svc.vendor_name) svc.vendor_name = svc.vendor.business_name
        if (svc.category && !svc.category_name) svc.category_name = svc.category.name
        setService(svc)
      })
      .catch(e => setError(e.response?.data?.message || 'Service not found'))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleOrder() {
    if (!requirements.trim()) {
      setOrderError('Please describe what you need.')
      return
    }
    setOrdering(true)
    setOrderError('')
    try {
      const res = await api.post('/marketplace/orders', {
        service_id:       service.id,
        requirements:     requirements.trim(),
        idempotency_key:  generateIdempotencyKey(),
      })
      const ref = res.data.order?.reference || res.data.reference
      setToast('Order placed successfully!')
      setTimeout(() => {
        navigate(`/dashboard/marketplace/orders/${ref}`)
      }, 1200)
    } catch (e) {
      setOrderError(e.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Service not found</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>{error}</p>
        <Link to="/dashboard/marketplace" className="btn-primary">Back to Marketplace</Link>
      </div>
    )
  }

  const platformColor  = getPlatformColor(service.platform)
  const isDarkPlatform = platformColor === '#000000'
  const walletNaira    = Math.round(user?.wallet_naira ?? 0)
  const priceNaira     = Math.round((service.starting_price_kobo || 0) / 100)

  const TABS = ['overview', 'requirements', 'reviews']

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: '#16A34A', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(22,163,74,0.35)' }}>
          {toast}
        </div>
      )}

      {/* Back link */}
      <Link
        to="/dashboard/marketplace"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', marginBottom: 20 }}
        onMouseEnter={e => e.currentTarget.style.color = '#16A34A'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={15} /> Back to Marketplace
      </Link>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ minWidth: 0 }}>
          {/* Service image */}
          {service.image_url && (
            <div style={{ width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '1px solid var(--border)' }}>
              <img src={service.image_url} alt={service.title} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Title */}
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.3 }}>
            {service.title}
          </h1>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: isDarkPlatform ? '#1a1a1a' : platformColor + '18',
              border: `1px solid ${platformColor}44`,
              borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
              color: isDarkPlatform ? '#e5e5e5' : platformColor,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: platformColor, display: 'inline-block' }} />
              {(service.platform || 'general').charAt(0).toUpperCase() + (service.platform || 'general').slice(1)}
            </span>
            {service.category_name && (
              <span className="badge badge-info">{service.category_name}</span>
            )}
            {service.avg_rating && (
              <StarRating rating={service.avg_rating} count={service.reviews_count || 0} />
            )}
          </div>

          {/* Vendor info box */}
          <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#063B2D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>
                {(service.vendor_name || 'V').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 3px' }}>{service.vendor_name || 'Unknown'}</p>
              {service.vendor_approved && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
                  <CheckCircle size={12} fill="#16A34A" color="#fff" /> Approved Vendor
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 14, fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? '#16A34A' : 'var(--text-muted)',
                  borderBottom: activeTab === tab ? '2px solid #16A34A' : '2px solid transparent',
                  marginBottom: -1, fontFamily: 'inherit', transition: 'color .15s',
                }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Description</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{service.description}</p>
                </div>
                {service.what_you_get && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>What You Get</h3>
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {service.what_you_get.split('\n').filter(Boolean).map((line, i) => (
                        <li key={i} style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.refund_policy && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Refund Policy</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{service.refund_policy}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requirements' && (
              <div>
                {service.requirements ? (
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{service.requirements}</p>
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>No specific requirements.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {service.reviews && service.reviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {service.reviews.filter(r => r.status === 'approved').map(review => (
                      <div key={review.id} className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{review.reviewer_name || 'Customer'}</span>
                          <StarRating rating={review.rating} />
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>No reviews yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — sticky order card */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', margin: '0 0 4px' }}>
              {formatNaira(service.starting_price_kobo)}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
              Est. {service.delivery_days} day{service.delivery_days !== 1 ? 's' : ''} delivery
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                Your Requirements
              </label>
              <textarea
                className="input"
                rows={5}
                placeholder="Describe what you need (e.g. your username, target audience, post link…)"
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
            </div>

            {orderError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{orderError}</p>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleOrder}
              disabled={ordering}>
              {ordering ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                  Placing Order…
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </>
              ) : 'Place Order'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '12px 0 16px', textAlign: 'center', lineHeight: 1.5 }}>
              Payment is deducted from your wallet.{' '}
              Balance: <strong style={{ color: walletNaira >= priceNaira ? '#16A34A' : '#EF4444' }}>₦{walletNaira.toLocaleString()}</strong>
            </p>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <Link
                to="/dashboard/marketplace/orders"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#16A34A', textDecoration: 'none', fontWeight: 500 }}>
                <Package size={13} /> View my orders →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive: stack on small screens */}
      <style>{`
        @media (max-width: 860px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  )
}
