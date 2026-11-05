import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, X, Package } from 'lucide-react'
import api from '../../../services/api'

const STATUS_CONFIG = {
  paid:        { label: 'Paid',        cls: 'badge-info' },
  in_progress: { label: 'In Progress', cls: 'badge-warning' },
  delivered:   { label: 'Delivered',   cls: 'badge-warning' },
  completed:   { label: 'Completed',   cls: 'badge-success' },
  disputed:    { label: 'Disputed',    cls: 'badge-danger' },
  cancelled:   { label: 'Cancelled',   cls: 'badge-danger' },
  refunded:    { label: 'Refunded',    cls: 'badge-danger' },
}

const DISPUTE_REASONS = [
  { value: 'not_delivered',  label: 'Service not delivered' },
  { value: 'wrong_service',  label: 'Wrong service delivered' },
  { value: 'quality_issue',  label: 'Quality issue' },
  { value: 'other',          label: 'Other' },
]

function formatNaira(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.35)', borderRadius: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function MarketplaceOrderDetail() {
  const { reference } = useParams()
  const navigate      = useNavigate()

  const [order,         setOrder]         = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toast,         setToast]         = useState({ msg: '', type: 'success' })

  // Modals
  const [showDispute, setShowDispute]   = useState(false)
  const [showCancel,  setShowCancel]    = useState(false)

  // Dispute form
  const [disputeReason, setDisputeReason]   = useState('not_delivered')
  const [disputeDesc,   setDisputeDesc]     = useState('')
  const [disputeError,  setDisputeError]    = useState('')

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  async function fetchOrder() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/marketplace/orders/${reference}`)
      setOrder(res.data.order || res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Order not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrder() }, [reference])

  async function handleConfirm() {
    setActionLoading(true)
    try {
      await api.post(`/marketplace/orders/${reference}/confirm`)
      showToast('Order marked as completed!')
      fetchOrder()
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to confirm order', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    setActionLoading(true)
    try {
      await api.post(`/marketplace/orders/${reference}/cancel`)
      setShowCancel(false)
      showToast('Order cancelled and refunded.')
      fetchOrder()
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to cancel order', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDispute() {
    if (!disputeDesc.trim()) {
      setDisputeError('Please describe the issue.')
      return
    }
    setActionLoading(true)
    setDisputeError('')
    try {
      await api.post(`/marketplace/orders/${reference}/dispute`, {
        reason:      disputeReason,
        description: disputeDesc.trim(),
      })
      setShowDispute(false)
      showToast('Dispute submitted. Our team will review it.')
      fetchOrder()
    } catch (e) {
      setDisputeError(e.response?.data?.message || 'Failed to submit dispute')
    } finally {
      setActionLoading(false)
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

  if (error || !order) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Order not found</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>{error}</p>
        <Link to="/dashboard/marketplace/orders" className="btn-primary">Back to Orders</Link>
      </div>
    )
  }

  const sc = STATUS_CONFIG[order.status] || { label: order.status, cls: 'badge-info' }
  const canConfirm = order.status === 'delivered'
  const canDispute = ['paid', 'in_progress', 'delivered'].includes(order.status)
  const canCancel  = order.status === 'paid'
  const hasDelivery = ['delivered', 'completed', 'disputed'].includes(order.status)

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      {/* Toast */}
      {toast.msg && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'error' ? '#EF4444' : '#16A34A', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,.25)' }}>
          {toast.msg}
        </div>
      )}

      {/* Dispute Modal */}
      {showDispute && (
        <Modal title="Open Dispute" onClose={() => { setShowDispute(false); setDisputeError('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Reason</label>
              <select
                className="input"
                style={{ width: '100%' }}
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}>
                {DISPUTE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Description *</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Describe the issue in detail…"
                value={disputeDesc}
                onChange={e => setDisputeDesc(e.target.value)}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            {disputeError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{disputeError}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setShowDispute(false); setDisputeError('') }}>Cancel</button>
              <button
                onClick={handleDispute}
                disabled={actionLoading}
                style={{ padding: '9px 20px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', opacity: actionLoading ? .7 : 1 }}>
                {actionLoading ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <Modal title="Cancel Order" onClose={() => setShowCancel(false)}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
            Are you sure you want to cancel this order? Your payment of <strong style={{ color: 'var(--text)' }}>{formatNaira(order.amount_kobo || 0)}</strong> will be refunded to your wallet.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowCancel(false)}>Keep Order</button>
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              style={{ padding: '9px 20px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', opacity: actionLoading ? .7 : 1 }}>
              {actionLoading ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
          </div>
        </Modal>
      )}

      {/* Back link */}
      <Link
        to="/dashboard/marketplace/orders"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', marginBottom: 20 }}
        onMouseEnter={e => e.currentTarget.style.color = '#16A34A'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      {/* Order header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>
            #{order.reference || order.id}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <span className={`badge ${sc.cls}`} style={{ fontSize: 14, padding: '6px 16px' }}>{sc.label}</span>
      </div>

      {/* Order summary card */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 14px' }}>Order Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Service',         value: order.service_title || order.service?.title || '—' },
            { label: 'Vendor',          value: order.vendor_name || order.vendor?.business_name || '—' },
            { label: 'Amount Paid',     value: formatNaira(order.amount_kobo || 0), highlight: true },
            { label: 'Est. Delivery',   value: order.delivery_days ? `${order.delivery_days} day(s)` : '—' },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.4px' }}>{item.label}</p>
              <p style={{ fontSize: 15, fontWeight: item.highlight ? 800 : 600, color: item.highlight ? '#16A34A' : 'var(--text)', margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      {order.requirements && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 10px' }}>Your Requirements</h3>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{order.requirements}</p>
        </div>
      )}

      {/* Delivery section */}
      {hasDelivery && (order.delivery_notes || order.proof) && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '3px solid #16A34A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={18} color="#16A34A" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Delivery from Vendor</h3>
          </div>
          {order.delivery_notes && (
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{order.delivery_notes}</p>
          )}
          {order.proof && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 6px' }}>PROOF / SCREENSHOT</p>
              <img src={order.proof} alt="Delivery proof" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          )}
        </div>
      )}

      {/* Timeline / Events */}
      {order.events && order.events.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 16px' }}>Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {order.events.map((ev, idx) => (
              <div key={ev.id || idx} style={{ display: 'flex', gap: 14, paddingBottom: idx < order.events.length - 1 ? 20 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A', marginTop: 4, flexShrink: 0 }} />
                  {idx < order.events.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: idx < order.events.length - 1 ? 4 : 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>
                    {ev.event?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ev.name}
                  </p>
                  {ev.note && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 2px', lineHeight: 1.5 }}>{ev.note}</p>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(ev.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(canConfirm || canDispute || canCancel) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          {canConfirm && (
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', fontWeight: 700, fontSize: 14 }}
              disabled={actionLoading}
              onClick={handleConfirm}>
              <CheckCircle size={16} />
              {actionLoading ? 'Confirming…' : 'Confirm Completion'}
            </button>
          )}
          {canDispute && (
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', border: '1.5px solid #EF4444', color: '#EF4444', background: 'transparent', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => setShowDispute(true)}>
              <AlertTriangle size={16} />
              Open Dispute
            </button>
          )}
          {canCancel && (
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14 }}
              onClick={() => setShowCancel(true)}>
              <X size={16} />
              Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  )
}
